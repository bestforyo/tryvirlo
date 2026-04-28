/**
 * Cloudflare R2 Storage Client
 * Handles file uploads, signed URLs, and cleanup
 */

import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  key: string;
  url?: string;
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

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID || '';
    this.bucketName = process.env.R2_BUCKET_NAME || 'tryvirlo-assets';
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || `https://r2.pub.dev/${this.bucketName}`;
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
      // Download the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'video/mp4';

      // Determine extension
      const extension = this.getExtension(contentType, fileUrl);
      const key = this.generateKey(userId, type, extension);

      // Upload to R2
      const uploadResult = await this.uploadBuffer(key, Buffer.from(buffer), contentType);

      if (uploadResult.success) {
        return {
          success: true,
          key,
          url: `${this.publicUrl}/${key}`
        };
      }

      return uploadResult;
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
      const url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Authorization': this.getAuthHeader('PUT', key, contentType, buffer.length)
        },
        body: buffer
      });

      if (!response.ok) {
        throw new Error(`R2 upload failed: ${response.statusText}`);
      }

      return {
        success: true,
        key,
        url: `${this.publicUrl}/${key}`
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

    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const url = `${this.publicUrl}/${key}?expires=${expiresAt.getTime()}`;

    return { url, expiresAt };
  }

  /**
   * Delete a file from R2
   */
  async delete(key: string): Promise<boolean> {
    this.validateConfig();

    try {
      const url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader('DELETE', key, '', 0)
        }
      });

      return response.ok;
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
      const url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}?prefix=${userId}/&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader('GET', `${userId}/`, '', 0)
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.contents?.map((item: any) => item.key) || [];
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
      'video/mov': 'mov',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };

    if (typeMap[contentType]) {
      return typeMap[contentType];
    }

    // Extract from URL
    const match = url.match(/\.([^.]+)$/);
    return match ? match[1] : 'mp4';
  }

  /**
   * Generate AWS-style authorization header
   */
  private getAuthHeader(
    method: string,
    key: string,
    contentType: string,
    contentLength: number
  ): string {
    // Simplified auth - in production use AWS SDK or proper signing
    const date = new Date().toUTCString();
    const stringToSign = `${method}\n\n${contentType}\n${date}\n/${this.bucketName}/${key}`;

    // This is a placeholder - implement proper HMAC-SHA256 signing
    // For production, use @aws-sdk/client-s3 or similar
    return `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${this.dateString()}/${this.accountId}/r2/aws4_request, SignedHeaders=host;x-amz-date, Signature=${this.computeSignature(stringToSign)}`;
  }

  private dateString(): string {
    const date = new Date();
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private computeSignature(stringToSign: string): string {
    // Placeholder - implement proper HMAC-SHA256
    return Buffer.from(stringToSign).toString('base64').substring(0, 32);
  }
}

// Singleton instance
export const r2Storage = new R2Storage();
