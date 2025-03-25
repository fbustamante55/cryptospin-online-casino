import { useState, useEffect, useCallback, useRef } from 'react';

interface SoundOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
}

interface UseSound {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
}

export function useSound(src: string, options: SoundOptions = {}): UseSound {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(options.volume ?? 1);
  const [playbackRate, setPlaybackRateState] = useState(options.playbackRate ?? 1);

  // Initialize audio on mount
  useEffect(() => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = options.loop ?? false;
    audio.playbackRate = playbackRate;
    
    // Set up event listeners
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    audioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, [src, options.loop]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Play function
  const play = useCallback(() => {
    if (audioRef.current) {
      // Reset to beginning if already playing
      if (isPlaying) {
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
        });
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  // Stop function
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // Set volume function
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  // Set playback rate function
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
  }, []);

  return { play, stop, isPlaying, setVolume, setPlaybackRate };
}

export function useSoundManager() {
  // Global sound settings
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Set volume for all sounds
  const setVolume = useCallback((volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    setMasterVolume(newVolume);
    
    // Update volume for all cached audio elements
    audioCache.current.forEach(audio => {
      audio.volume = isMuted ? 0 : newVolume;
    });
  }, [isMuted]);

  // Play a sound with the current volume settings
  const playSound = useCallback((src: string, options: { volume?: number; loop?: boolean } = {}) => {
    if (!src) return;
    
    try {
      let audio: HTMLAudioElement;
      
      // Check if audio is already cached
      if (audioCache.current.has(src)) {
        audio = audioCache.current.get(src)!;
        audio.currentTime = 0; // Reset to beginning
      } else {
        // Create and cache new audio
        audio = new Audio(src);
        audio.preload = 'auto';
        audioCache.current.set(src, audio);
      }
      
      // Apply current settings
      const effectiveVolume = isMuted ? 0 : (options.volume !== undefined ? options.volume * masterVolume : masterVolume);
      audio.volume = effectiveVolume;
      audio.loop = options.loop || false;
      
      // Play the sound
      audio.play().catch(error => {
        console.error("Error playing audio:", error);
      });
    } catch (error) {
      console.error("Error setting up audio:", error);
    }
  }, [masterVolume, isMuted]);

  return {
    masterVolume,
    setMasterVolume,
    isMuted,
    setIsMuted,
    toggleMute,
    setVolume,
    playSound,
    effectiveVolume: isMuted ? 0 : masterVolume
  };
}