import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    socketMode: true,
  },
  dify: {
    apiKey: process.env.DIFY_API_KEY || '',
    apiBaseUrl: process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    debug: process.env.DEBUG === 'true',
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.slack.botToken) {
    errors.push('SLACK_BOT_TOKEN is required');
  }
  if (!config.slack.appToken) {
    errors.push('SLACK_APP_TOKEN is required');
  }
  if (!config.dify.apiKey) {
    errors.push('DIFY_API_KEY is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}