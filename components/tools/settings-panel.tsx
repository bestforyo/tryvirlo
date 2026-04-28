"use client";

import { Label } from "@/components/ui/label";

interface SettingsPanelProps {
  duration: number;
  quality: string;
  aspectRatio: string;
  onDurationChange: (duration: number) => void;
  onQualityChange: (quality: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
}

const DURATIONS = [5, 10, 15] as const;
const QUALITIES = ['720p', '1080p'] as const;
const ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const;

export function SettingsPanel({
  duration,
  quality,
  aspectRatio,
  onDurationChange,
  onQualityChange,
  onAspectRatioChange,
}: SettingsPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Settings</h3>

      {/* Duration Selection */}
      <div>
        <Label>Duration</Label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                duration === d
                  ? 'bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white border-transparent'
                  : 'border-white/20 text-white hover:bg-white/5'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio Selection */}
      <div>
        <Label>Aspect Ratio</Label>
        <select
          value={aspectRatio}
          onChange={(e) => onAspectRatioChange(e.target.value)}
          className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-[#FF4081]"
        >
          {ASPECT_RATIOS.map((ratio) => (
            <option key={ratio} value={ratio} className="bg-[#0D0D0D]">
              {ratio}
            </option>
          ))}
        </select>
      </div>

      {/* Quality Display (hidden input for tracking) */}
      <input type="hidden" value={quality} />
    </div>
  );
}
