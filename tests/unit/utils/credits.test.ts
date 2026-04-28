import { describe, it, expect } from 'vitest';
import { calculateCredits, CREDIT_RATES } from '@/lib/utils/credits';

describe('Credits Utility', () => {
  describe('calculateCredits', () => {
    describe('TEXT_TO_VIDEO', () => {
      it('should calculate 5s 720p video correctly', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 5, '720p');
        expect(credits).toBe(25);
      });

      it('should calculate 5s 1080p video correctly', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 5, '1080p');
        expect(credits).toBe(50);
      });

      it('should calculate 10s 720p video correctly', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 10, '720p');
        expect(credits).toBe(50);
      });

      it('should calculate 10s 1080p video correctly', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 10, '1080p');
        expect(credits).toBe(100);
      });

      it('should calculate 15s 720p video correctly', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 15, '720p');
        expect(credits).toBe(75);
      });

      it('should calculate 15s 1080p video correctly', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 15, '1080p');
        expect(credits).toBe(150);
      });

      it('should return 0 for unsupported combinations', () => {
        const credits = calculateCredits('TEXT_TO_VIDEO', 20, '4K');
        expect(credits).toBe(0);
      });
    });

    describe('IMAGE_TO_VIDEO', () => {
      it('should calculate 5s 720p video correctly', () => {
        const credits = calculateCredits('IMAGE_TO_VIDEO', 5, '720p');
        expect(credits).toBe(15);
      });

      it('should calculate 5s 1080p video correctly', () => {
        const credits = calculateCredits('IMAGE_TO_VIDEO', 5, '1080p');
        expect(credits).toBe(30);
      });

      it('should return 0 for unsupported durations', () => {
        const credits = calculateCredits('IMAGE_TO_VIDEO', 10, '1080p');
        expect(credits).toBe(0);
      });
    });

    describe('TEXT_TO_IMAGE', () => {
      it('should return fixed cost of 5 credits', () => {
        const credits = calculateCredits('TEXT_TO_IMAGE', 0, '1080p');
        expect(credits).toBe(5);
      });

      it('should ignore duration parameter', () => {
        const credits1 = calculateCredits('TEXT_TO_IMAGE', 0, '1080p');
        const credits2 = calculateCredits('TEXT_TO_IMAGE', 10, '1080p');
        expect(credits1).toBe(credits2);
      });
    });

    describe('VIDEO_UPSCALE', () => {
      it('should calculate 720p to 1080p correctly', () => {
        const credits = calculateCredits('VIDEO_UPSCALE', 0, '720p');
        expect(credits).toBe(50);
      });

      it('should calculate 1080p to 4K correctly', () => {
        const credits = calculateCredits('VIDEO_UPSCALE', 0, '1080p');
        expect(credits).toBe(100);
      });

      it('should return 0 for unsupported quality', () => {
        const credits = calculateCredits('VIDEO_UPSCALE', 0, '4K');
        expect(credits).toBe(0);
      });
    });
  });

  describe('CREDIT_RATES constant', () => {
    it('should have TEXT_TO_VIDEO rates', () => {
      expect(CREDIT_RATES.TEXT_TO_VIDEO).toBeDefined();
      expect(CREDIT_RATES.TEXT_TO_VIDEO['10s-1080p']).toBe(100);
    });

    it('should have IMAGE_TO_VIDEO rates', () => {
      expect(CREDIT_RATES.IMAGE_TO_VIDEO).toBeDefined();
      expect(CREDIT_RATES.IMAGE_TO_VIDEO['5s-1080p']).toBe(30);
    });

    it('should have TEXT_TO_IMAGE fixed rate', () => {
      expect(CREDIT_RATES.TEXT_TO_IMAGE).toBeDefined();
      expect(CREDIT_RATES.TEXT_TO_IMAGE['standard']).toBe(5);
    });

    it('should have VIDEO_UPSCALE rates', () => {
      expect(CREDIT_RATES.VIDEO_UPSCALE).toBeDefined();
      expect(CREDIT_RATES.VIDEO_UPSCALE['1080p-to-4k']).toBe(100);
    });
  });

  describe('Cost Consistency', () => {
    it('should have higher cost for 1080p than 720p (10s video)', () => {
      const credits720p = calculateCredits('TEXT_TO_VIDEO', 10, '720p');
      const credits1080p = calculateCredits('TEXT_TO_VIDEO', 10, '1080p');
      expect(credits1080p).toBeGreaterThan(credits720p);
    });

    it('should scale with duration (5s vs 10s at 1080p)', () => {
      const credits5s = calculateCredits('TEXT_TO_VIDEO', 5, '1080p');
      const credits10s = calculateCredits('TEXT_TO_VIDEO', 10, '1080p');
      expect(credits10s).toBe(credits5s * 2);
    });

    it('should scale with duration (5s vs 15s at 720p)', () => {
      const credits5s = calculateCredits('TEXT_TO_VIDEO', 5, '720p');
      const credits15s = calculateCredits('TEXT_TO_VIDEO', 15, '720p');
      expect(credits15s).toBe(credits5s * 3);
    });
  });

  describe('Type-based Cost Comparison', () => {
    it('TEXT_TO_IMAGE should be cheaper than TEXT_TO_VIDEO', () => {
      const imageCredits = calculateCredits('TEXT_TO_IMAGE', 0, '1080p');
      const videoCredits = calculateCredits('TEXT_TO_VIDEO', 5, '720p');
      expect(imageCredits).toBeLessThan(videoCredits);
    });

    it('IMAGE_TO_VIDEO should be cheaper than TEXT_TO_VIDEO (same duration)', () => {
      const imageToVideo = calculateCredits('IMAGE_TO_VIDEO', 5, '1080p');
      const textToVideo = calculateCredits('TEXT_TO_VIDEO', 5, '1080p');
      expect(imageToVideo).toBeLessThan(textToVideo);
    });

    it('VIDEO_UPSCALE should have predictable costs', () => {
      const upscale720p = calculateCredits('VIDEO_UPSCALE', 0, '720p');
      const upscale1080p = calculateCredits('VIDEO_UPSCALE', 0, '1080p');
      expect(upscale1080p).toBe(upscale720p * 2);
    });
  });
});
