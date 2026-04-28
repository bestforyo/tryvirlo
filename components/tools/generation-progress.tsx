"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";

interface GenerationProgressProps {
  generation: {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    resultUrl?: string;
    error?: string;
  };
  onComplete?: (url: string) => void;
  onRetry?: () => void;
}

export function GenerationProgress({
  generation,
  onComplete,
  onRetry,
}: GenerationProgressProps) {
  const { status, progress, resultUrl, error } = generation;

  if (status === 'COMPLETED' && resultUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-[rgba(16,185,129,0.2)] border border-[#10B981]">
          <CheckCircle className="h-5 w-5 text-[#10B981]" />
          <span className="font-semibold text-white">Generation Complete!</span>
        </div>

        <video
          src={resultUrl}
          controls
          className="w-full rounded-lg"
          onLoadedData={() => onComplete?.(resultUrl)}
        />

        <Button asChild className="w-full">
          <a href={resultUrl} download>
            Download Video
          </a>
        </Button>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-[rgba(239,68,68,0.2)] border border-[#EF4444]">
          <AlertCircle className="h-5 w-5 text-[#EF4444] inline mr-2" />
          <span className="font-semibold text-white">Generation Failed</span>
        </div>
        {error && (
          <p className="text-sm text-[#9CA3AF]">{error}</p>
        )}

        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#E5E5E5]">
            {status === 'PENDING' ? 'Queued...' : 'Processing...'}
          </span>
          <span className="text-[#E5E5E5]">{progress || 0}%</span>
        </div>
        <Progress value={progress || 0} />
      </div>

      <ProcessingAnimation status={status} />
    </div>
  );
}

function ProcessingAnimation({ status }: { status: string }) {
  return (
    <div className="flex justify-center py-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FF4081] animate-spin" />
      </div>
    </div>
  );
}
