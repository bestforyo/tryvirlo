"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ModelSelector } from "@/components/tools/model-selector";
import { SettingsPanel } from "@/components/tools/settings-panel";
import { GenerationProgress } from "@/components/tools/generation-progress";
import { calculateCredits } from "@/lib/utils/credits";

interface Model {
  id: string;
  name: string;
  quality: string;
  speedTier: string;
  credits: number;
}

const MODELS: Model[] = [
  { id: 'videoupscale-pro', name: 'Video Upscale Pro', quality: '4K', speedTier: 'medium', credits: 25 },
  { id: 'videoupscale-fast', name: 'Video Upscale Fast', quality: '1080p', speedTier: 'fast', credits: 15 },
  { id: 'videoupscale-anim', name: 'Video Upscale Anime', quality: '4K', speedTier: 'slow', credits: 30 },
];

export default function VideoUpscalerPage() {
  const [selectedModel, setSelectedModel] = useState('videoupscale-pro');
  const [quality, setQuality] = useState('4K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(1250);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModelData = MODELS.find(m => m.id === selectedModel)!;
  const creditsRequired = calculateCredits('VIDEO_UPSCALE', 1, quality);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!videoFile) {
      alert('Please upload a video first');
      return;
    }

    if (userCredits < creditsRequired) {
      alert(`Insufficient credits. You need ${creditsRequired} credits but only have ${userCredits}. Please upgrade your plan.`);
      return;
    }

    setIsGenerating(true);

    try {
      // First, upload the video to get a URL
      const formData = new FormData();
      formData.append('file', videoFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const uploadData = await uploadResponse.json();
      const videoUrl = uploadData.url;

      // Then start the upscaling
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VIDEO_UPSCALE',
          modelId: selectedModel,
          prompt: 'Upscale video to higher resolution',
          parameters: {
            quality,
            videoUrl
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start upscaling');
      }

      setGeneration(data);

      // Start polling for status
      pollStatus(data.id);
    } catch (error: any) {
      console.error('Upscaling error:', error);
      alert(error.message || 'Failed to start upscaling');
      setIsGenerating(false);
    }
  };

  const pollStatus = async (generationId: string) => {
    const maxAttempts = 40; // 4 minutes total

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 6000));

      try {
        const response = await fetch(`/api/status/${generationId}`);
        const data = await response.json();

        setGeneration(data);

        if (data.status === 'COMPLETED') {
          setIsGenerating(false);
          setUserCredits(prev => prev - creditsRequired);
          return;
        }

        if (data.status === 'FAILED') {
          setIsGenerating(false);
          alert(`Upscaling failed: ${data.error || 'Unknown error'}`);
          return;
        }
      } catch (error: any) {
        console.error('Status check error:', error);
        setIsGenerating(false);
        alert('Failed to check upscaling status');
        return;
      }
    }

    setIsGenerating(false);
    alert('Upscaling timed out. Please try again.');
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `upscaled-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
        {' > '}
        <span className="text-white">Video Upscaler</span>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Video Upscaler</h1>
          <p className="text-xl text-[#9CA3AF]">
            Enhance your videos to 4K resolution with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Video Upload */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upload Video</h3>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="block w-full p-4 border-2 border-dashed border-[#374151] rounded-xl text-center cursor-pointer hover:border-[#FF4081] transition-colors"
                >
                  {selectedVideo ? (
                    <div className="space-y-2">
                      <div className="text-green-400">✓ Video selected</div>
                      <video
                        src={selectedVideo}
                        className="max-w-full max-h-32 mx-auto rounded"
                        controls={false}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-2xl">🎬</div>
                      <div className="text-[#9CA3AF]">Click to upload video</div>
                      <div className="text-sm text-[#6B7280]">MP4, MOV, AVI up to 100MB</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <ModelSelector
              models={MODELS}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
            />

            <SettingsPanel
              quality={quality}
              onQualityChange={setQuality}
              duration={5} // Fixed duration for video upscaling
              onDurationChange={() => { }} // Duration is fixed for video upscaling
              aspectRatio="16:9" // Fixed aspect ratio for video upscaling
              onAspectRatioChange={() => { }} // Aspect ratio is fixed for video upscaling
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !videoFile}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold text-lg hover:translate-y-[-2px] hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isGenerating ? 'Upscaling...' : `Upscale Video (${creditsRequired} credits)`}
            </button>
          </div>

          {/* Right Column - Result */}
          <div className="space-y-6">
            {generation && (
              <GenerationProgress
                generation={generation}
              />
            )}

            {!generation && (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">📺 ➔ 🎬</div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Upscale</h3>
                <p className="text-[#9CA3AF]">
                  Upload a video and enhance it to higher resolution with AI-powered upscaling
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
