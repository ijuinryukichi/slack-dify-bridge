import { App, AppMentionEvent, GenericMessageEvent, LogLevel } from '@slack/bolt';
import { DifyClient, FileInfo } from './dify-client';
import { config } from './config';

export class SlackHandler {
  private app: App;
  private difyClient: DifyClient;
  private conversationStore: Map<string, string>;

  constructor() {
    this.app = new App({
      token: config.slack.botToken,
      appToken: config.slack.appToken,
      socketMode: config.slack.socketMode,
      logLevel: config.app.debug ? LogLevel.DEBUG : LogLevel.INFO,
    });

    this.difyClient = new DifyClient();
    this.conversationStore = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.app.event('app_mention', async ({ event, say }) => {
      await this.handleAppMention(event as AppMentionEvent, say);
    });

    this.app.message(async ({ message, say }) => {
      if (message.subtype === undefined) {
        await this.handleDirectMessage(message as GenericMessageEvent, say);
      }
    });

    this.app.error(async (error) => {
      console.error('Slack app error:', error);
    });
  }

  private async handleAppMention(
    event: AppMentionEvent,
    say: any
  ): Promise<void> {
    try {
      const botUserId = await this.getBotUserId();
      const cleanedText = this.removeUserMention(event.text, botUserId);
      
      if (!cleanedText.trim()) {
        await say('こんにちは！何かお手伝いできることはありますか？');
        return;
      }

      const processingMessage = await say({
        text: '🔍 確認中です。少々お待ちください...',
        thread_ts: event.thread_ts || event.ts,
      });

      const files = await this.extractFiles(event as any);
      const conversationKey = `${event.channel}-${event.user}`;
      const conversationId = this.conversationStore.get(conversationKey);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 60000);
      });

      const response = await Promise.race([
        this.difyClient.sendMessage(
          cleanedText,
          event.user || 'unknown',
          conversationId,
          files
        ),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof this.difyClient.sendMessage>>;

      this.conversationStore.set(conversationKey, response.conversation_id);

      await this.app.client.chat.update({
        token: config.slack.botToken,
        channel: event.channel,
        ts: processingMessage.ts as string,
        text: response.answer,
        thread_ts: event.thread_ts || event.ts,
      });
    } catch (error) {
      console.error('Error handling app mention:', error);
      const errorMessage = error instanceof Error && error.message === 'Timeout'
        ? 'タイムアウトしました。もう一度お試しください。'
        : 'すみません、エラーが発生しました。もう一度お試しください。';
      await say({
        text: errorMessage,
        thread_ts: event.thread_ts || event.ts,
      });
    }
  }

  private async handleDirectMessage(
    message: GenericMessageEvent,
    say: any
  ): Promise<void> {
    try {
      if (!message.text || message.bot_id) {
        return;
      }

      const channelType = await this.getChannelType(message.channel);
      if (channelType !== 'im') {
        return;
      }

      const processingMessage = await say('🔍 確認中です。少々お待ちください...');

      const files = await this.extractFiles(message);
      const conversationKey = `${message.channel}-${message.user}`;
      const conversationId = this.conversationStore.get(conversationKey);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 60000);
      });

      const response = await Promise.race([
        this.difyClient.sendMessage(
          message.text,
          message.user!,
          conversationId,
          files
        ),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof this.difyClient.sendMessage>>;

      this.conversationStore.set(conversationKey, response.conversation_id);

      await this.app.client.chat.update({
        token: config.slack.botToken,
        channel: message.channel,
        ts: processingMessage.ts as string,
        text: response.answer,
      });
    } catch (error) {
      console.error('Error handling direct message:', error);
      const errorMessage = error instanceof Error && error.message === 'Timeout'
        ? 'タイムアウトしました。もう一度お試しください。'
        : 'すみません、エラーが発生しました。もう一度お試しください。';
      await say(errorMessage);
    }
  }

  private async getBotUserId(): Promise<string> {
    try {
      const authResult = await this.app.client.auth.test({
        token: config.slack.botToken,
      });
      return authResult.user_id as string;
    } catch (error) {
      console.error('Failed to get bot user ID:', error);
      return '';
    }
  }

  private removeUserMention(text: string, userId: string): string {
    const mentionPattern = new RegExp(`<@${userId}>`, 'g');
    return text.replace(mentionPattern, '').trim();
  }

  private async getChannelType(channel: string): Promise<string> {
    try {
      const result = await this.app.client.conversations.info({
        token: config.slack.botToken,
        channel,
      });
      return (result.channel as any)?.is_im ? 'im' : 'channel';
    } catch (error) {
      return 'unknown';
    }
  }

  private async extractFiles(message: any): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    
    if (!message.files || message.files.length === 0) {
      return files;
    }

    for (const file of message.files) {
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        try {
          const fileInfo = await this.app.client.files.info({
            token: config.slack.botToken,
            file: file.id,
          });

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          const response = await fetch((fileInfo.file as any).url_private, {
            headers: {
              'Authorization': `Bearer ${config.slack.botToken}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeout);

          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          
          files.push({
            data: `data:${file.mimetype};base64,${base64}`,
            name: file.name || 'image.png',
            mimetype: file.mimetype,
          });
        } catch (error) {
          console.error(`Failed to download file ${file.name}:`, error);
        }
      }
    }

    return files;
  }


  async start(): Promise<void> {
    await this.app.start();
    console.log('⚡️ Slack app is running in Socket Mode!');
    
    const isDifyConnected = await this.difyClient.testConnection();
    if (isDifyConnected) {
      console.log('✅ Successfully connected to Dify API');
    } else {
      console.warn('⚠️  Could not verify Dify API connection');
    }
  }

  async stop(): Promise<void> {
    await this.app.stop();
    console.log('Slack app stopped');
  }
}