/**
 * Pic2API Provider Implementation
 * Specialized in image-to-video generation
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface Pic2APIJobResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

interface Pic2APISubmitRequest {
  model: string;
  prompt?: string;
  image_url?: string;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
}

export class Pic2APIProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('Pic2API', config);
  }

  /**
   * Map internal model ID to Pic2API model
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'animate-diff': 'sora-2-pro',
      'motion-v1': 'veo-3',
      'live-portrait': 'kling-2.5'
    };
    return modelMap[model] || model;
  }

  /**
   * Get task type based on generation type
   */
  private getTaskType(type: string): string {
    switch (type) {
      case 'TEXT_TO_VIDEO':
        return 'txt2video';
      case 'IMAGE_TO_VIDEO':
        return 'img2video';
      case 'TEXT_TO_IMAGE':
        return 'txt2img';
      default:
        return 'img2video';
    }
  }

  /**
   * Validate parameters before submission
   */
  validateParams(model: string, type: string, params: GenerationParams): void {
    if (type !== 'IMAGE_TO_VIDEO') {
      throw new Error('Pic2API only supports image-to-video generation');
    }

    if (!params.prompt && type === 'IMAGE_TO_VIDEO') {
      // Prompt is optional for image-to-video but warn if missing
      console.warn('Pic2API: Prompt is optional but recommended for better results');
    }

    if (params.duration && params.duration > 8) {
      throw new Error('Maximum duration is 8 seconds for Pic2API');
    }

    this.validateApiKey();
  }

  /**
   * Submit generation request to Pic2API
   */
  async submitGeneration(
    model: string,
    type: string,
    params: GenerationParams
  ): Promise<string> {
    this.validateParams(model, type, params);

    const payload: Pic2APISubmitRequest = {
      model: this.mapModel(model),
      prompt: params.prompt || undefined,
      duration: params.duration || 5,
      aspect_ratio: params.aspectRatio || '16:9',
      resolution: params.quality === '4K' ? '2160p' : params.quality === '1080p' ? '1080p' : '720p'
    };

    // For image-to-video, add image_url
    if (type === 'IMAGE_TO_VIDEO') {
      const imageUrl = (params as any).imageUrl;
      if (!imageUrl) {
        throw new Error('Image URL is required for image-to-video generation');
      }
      payload.image_url = imageUrl;
    }

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/video/generations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data: Pic2APIJobResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to submit generation');
      }

      if (!data.id) {
        throw new Error('No task ID returned from Pic2API');
      }

      return data.id;
    } catch (error: any) {
      throw new Error(`Pic2API submission failed: ${error.message}`);
    }
  }

  /**
   * Check job status
   */
  async checkStatus(jobId: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    result?: string;
    error?: string;
  }> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/video/generations/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: Pic2APIJobResponse = await response.json();

      if (data.error) {
        return {
          status: 'FAILED',
          error: data.error.message
        };
      }

      // Pic2API returns data array with URLs when completed
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return {
          status: 'COMPLETED',
          result: data.data[0].url
        };
      }

      // If no data yet, assume it's still processing
      return {
        status: 'PROCESSING'
      };
    } catch (error: any) {
      return {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    // Pic2API may not support cancellation, return false
    return false;
  }

  /**
   * Estimate generation time based on parameters
   */
  estimateTime(params: GenerationParams): number {
    const baseTime = 15;
    const durationMultiplier = (params.duration || 4) / 4;

    return Math.round(baseTime * durationMultiplier);
  }
}
