/**
 * Cloudflare R2 Storage Client
 * Handles file uploads, signed URLs, and cleanup
 */

import { v4 as uuidv4 } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl as getAwsSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  success: boolean;
  key: string;
  url?: string;
  size?: number;
  error?: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

class R2Storage {
  private accountId: string;
  private bucketName: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private publicUrl: string;
  private endpoint: string;
  private client: S3Client;

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID || '';
    this.bucketName = process.env.R2_BUCKET_NAME || 'tryvirlo-assets';
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

    const configuredEndpoint = process.env.R2_ENDPOINT || `https://${this.accountId}.r2.cloudflarestorage.com`;
    const parsed = new URL(configuredEndpoint);
    this.endpoint = `${parsed.protocol}//${parsed.host}`;
    this.publicUrl = process.env.R2_PUBLIC_URL || `${this.endpoint}/${this.bucketName}`;

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      },
      forcePathStyle: false
    });
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.accountId || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error('R2 credentials not configured');
    }
  }

  /**
   * Generate storage key for a file
   */
  private generateKey(
    userId: string,
    type: 'video' | 'image' | 'preview',
    extension: string
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${userId}/${year}/${month}/${day}/${uuidv4()}.${extension}`;
  }

  /**
   * Upload a file from URL to R2
   */
  async uploadFromUrl(
    userId: string,
    fileUrl: string,
    type: 'video' | 'image' | 'preview' = 'video'
  ): Promise<UploadResult> {
    this.validateConfig();

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'video/mp4';
      const extension = this.getExtension(contentType, fileUrl);
      const key = this.generateKey(userId, type, extension);

      const uploadResult = await this.uploadBuffer(key, buffer, contentType);
      if (!uploadResult.success) {
        return uploadResult;
      }

      return {
        success: true,
        key,
        url: uploadResult.url,
        size: buffer.length
      };
    } catch (error: any) {
      return {
        success: false,
        key: '',
        error: error.message
      };
    }
  }

  /**
   * Upload a buffer to R2
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<UploadResult> {
    this.validateConfig();

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
      });

      await this.client.send(command);

      return {
        success: true,
        key,
        url: `${this.publicUrl}/${key}`,
        size: buffer.length
      };
    } catch (error: any) {
      return {
        success: false,
        key,
        error: error.message
      };
    }
  }

  /**
   * Generate signed URL for temporary access
   */
  async getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    this.validateConfig();

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const url = await getAwsSignedUrl(this.client, command, {
      expiresIn
    });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
  }

  /**
   * Delete a file from R2
   */
  async delete(key: string): Promise<boolean> {
    this.validateConfig();

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      return response.$metadata.httpStatusCode === 204 || response.$metadata.httpStatusCode === 200;
    } catch {
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMany(keys: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    await Promise.all(
      keys.map(async (key) => {
        const result = await this.delete(key);
        if (result) {
          deleted++;
        } else {
          failed++;
        }
      })
    );

    return { deleted, failed };
  }

  /**
   * List files for a user (with prefix)
   */
  async listUserFiles(
    userId: string,
    limit: number = 100
  ): Promise<string[]> {
    this.validateConfig();

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `${userId}/`,
        MaxKeys: limit
      });

      const response = await this.client.send(command);
      return response.Contents?.map((item) => item.Key as string).filter(Boolean) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get file size from URL
   */
  async getFileSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get file extension from content type or URL
   */
  private getExtension(contentType: string, url: string): string {
    const typeMap: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/mov': 'mov',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };

    if (typeMap[contentType]) {
      return typeMap[contentType];
    }

    const match = url.match(/\.([^.]+)$/);
    return match ? match[1] : 'mp4';
  }
}

// Singleton instance
export const r2Storage = new R2Storage();
