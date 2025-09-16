import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { config } from './config';

export interface DifyMessage {
  inputs: Record<string, any>;
  query: string;
  user: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id?: string;
  files?: Array<{
    type: 'image';
    transfer_method: 'local_file';
    upload_file_id: string;
  }>;
}

export interface DifyResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  created_at: number;
}

export interface FileInfo {
  data: string;
  name: string;
  mimetype: string;
}

export class DifyClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.dify.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.dify.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async uploadFile(file: FileInfo): Promise<string> {
    try {
      const base64Data = file.data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const form = new FormData();
      form.append('file', buffer, {
        filename: file.name,
        contentType: file.mimetype,
      });
      form.append('user', 'slack-bot');

      const response = await this.client.post('/files/upload', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${config.dify.apiKey}`,
        },
        timeout: 60000,
      });

      if (config.app.debug) {
        console.log('File upload response:', response.data);
      }

      return response.data.id;
    } catch (error) {
      console.error('Failed to upload file to Dify:', error);
      throw error;
    }
  }

  async sendMessage(
    query: string,
    user: string,
    conversationId?: string,
    files?: FileInfo[]
  ): Promise<DifyResponse> {
    try {
      let fileIds: string[] = [];
      
      if (files && files.length > 0) {
        console.log(`Uploading ${files.length} file(s) to Dify...`);
        fileIds = await Promise.all(files.map(file => this.uploadFile(file)));
      }

      const message: DifyMessage = {
        inputs: {},
        query,
        user,
        response_mode: 'blocking',
        ...(conversationId && { conversation_id: conversationId }),
        ...(fileIds.length > 0 && {
          files: fileIds.map(id => ({
            type: 'image' as const,
            transfer_method: 'local_file' as const,
            upload_file_id: id,
          })),
        }),
      };

      if (config.app.debug) {
        console.log('Sending to Dify:', JSON.stringify(message, null, 2));
      }

      const response = await this.client.post<DifyResponse>(
        '/chat-messages',
        message
      );

      if (config.app.debug) {
        console.log('Dify response:', JSON.stringify(response.data, null, 2));
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Dify API error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
        throw new Error(
          `Dify API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/parameters');
      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return true;
      }
      console.error('Failed to test Dify connection:', error);
      return false;
    }
  }
}