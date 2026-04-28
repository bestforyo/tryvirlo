/**
 * Pic2API Provider Implementation
 * Specialized in image-to-video generation
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface Pic2APIJobResponse {
  success: boolean;
  task_id?: string;
  status?: string;
  output_url?: string;
  error?: string;
}

interface Pic2APISubmitRequest {
  model: string;
  image_url: string;
  prompt?: string;
  duration?: number;
  motion_scale?: number;
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
      'animate-diff': 'animate-diff-v3',
      'motion-v1': 'motion-v1',
      'live-portrait': 'live-portrait'
    };
    return modelMap[model] || model;
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

    // For image-to-video, expect imageUrl in params
    const imageUrl = (params as any).imageUrl;

    if (!imageUrl) {
      throw new Error('Image URL is required for image-to-video generation');
    }

    const payload: Pic2APISubmitRequest = {
      model: this.mapModel(model),
      image_url: imageUrl,
      prompt: params.prompt || undefined,
      duration: params.duration || 4,
      motion_scale: 5
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/api/v1/animate`,
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

      if (!data.success || !data.task_id) {
        throw new Error(data.error || 'Failed to submit animation');
      }

      return data.task_id;
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
        `${this.config.baseUrl}/api/v1/task/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: Pic2APIJobResponse = await response.json();

      const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> = {
        'pending': 'PENDING',
        'processing': 'PROCESSING',
        'succeeded': 'COMPLETED',
        'failed': 'FAILED'
      };

      return {
        status: statusMap[data.status || 'pending'] || 'PENDING',
        result: data.output_url,
        error: data.error
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
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/api/v1/task/${jobId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: Pic2APIJobResponse = await response.json();
      return data.success;
    } catch {
      return false;
    }
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
