/**
 * Base Provider Interface
 * All AI model providers must implement this interface
 */

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  duration?: number;
  quality?: string;
  aspectRatio?: string;
  seed?: number;
}

export interface GenerationResult {
  success: boolean;
  url?: string;
  previewUrl?: string;
  error?: string;
  statusCode?: number;
  duration?: number; // Actual generation time in seconds
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  type: 'TEXT_TO_VIDEO' | 'IMAGE_TO_VIDEO' | 'TEXT_TO_IMAGE' | 'VIDEO_UPSCALE';
  creditsPerSecond: number;
  maxDuration: number;
  supportedQualities: string[];
  supportedAspectRatios: string[];
}

/**
 * Abstract base class for all AI providers
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected name: string;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = {
      timeout: 60000,
      maxRetries: 2,
      ...config
    };
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Validate API key is present
   */
  protected validateApiKey(): void {
    if (!this.config.apiKey) {
      throw new Error(`${this.name}: API key not configured`);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`${this.name}: Request timeout after ${this.config.timeout}ms`);
      }

      if (attempt < (this.config.maxRetries || 2)) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Submit a generation request
   * Must return a job ID for tracking
   */
  abstract submitGeneration(
    model: string,
    type: string,
    params: GenerationParams
  ): Promise<string>;

  /**
   * Check status of a generation job
   */
  abstract checkStatus(jobId: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    result?: string;
    error?: string;
  }>;

  /**
   * Cancel a pending job
   */
  abstract cancelJob(jobId: string): Promise<boolean>;

  /**
   * Calculate estimated generation time based on params
   */
  abstract estimateTime(params: GenerationParams): number;

  /**
   * Validate parameters before submission
   */
  abstract validateParams(model: string, type: string, params: GenerationParams): void;
}
