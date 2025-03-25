import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
  className?: string;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  className = '',
}: VolumeControlProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="text-gray-400 hover:text-white h-8 w-8 rounded-full"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume className="h-4 w-4" />
        )}
      </Button>
      <Slider
        className="w-32"
        defaultValue={[volume]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={(values) => onVolumeChange(values[0])}
      />
    </div>
  );
}