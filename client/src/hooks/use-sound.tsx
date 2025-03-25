import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';

// Sound categories
export enum SoundCategory {
  Music = 'music',
  GameEffects = 'gameEffects',
  UI = 'ui',
  Ambient = 'ambient',
  Voice = 'voice'
}

interface SoundOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  category?: SoundCategory;
  preload?: boolean;
  onEnd?: () => void;
}

interface UseSound {
  play: () => void;
  playFrom: (time: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  duration: number;
  currentTime: number;
}

// Sound Manager Context
interface SoundSettings {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  uiVolume: number;
  ambientVolume: number;
  voiceVolume: number;
  isMuted: boolean;
}

interface SoundManagerContextType extends SoundSettings {
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setEffectsVolume: (volume: number) => void;
  setUIVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  setVoiceVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  getCategoryVolume: (category: SoundCategory) => number;
  getEffectiveVolume: (category: SoundCategory) => number;
  playUISound: (soundName: UISound) => void;
}

export enum UISound {
  ButtonClick = 'buttonClick',
  Notification = 'notification',
  Success = 'success',
  Error = 'error',
  ChipPlace = 'chipPlace',
  LanguageChange = 'languageChange',
  MenuOpen = 'menuOpen',
  MenuClose = 'menuClose',
  TabChange = 'tabChange',
  Hover = 'hover'
}

const SoundManagerContext = createContext<SoundManagerContextType | undefined>(undefined);

// Sound Provider Component
export function SoundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>({
    masterVolume: 0.7,
    musicVolume: 0.6,
    effectsVolume: 0.8,
    uiVolume: 0.5,
    ambientVolume: 0.4,
    voiceVolume: 0.9,
    isMuted: false
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('soundSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Failed to parse sound settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
  }, [settings]);

  // UI sound instances
  const uiSounds = useRef<Record<UISound, HTMLAudioElement | null>>({
    [UISound.ButtonClick]: null,
    [UISound.Notification]: null,
    [UISound.Success]: null,
    [UISound.Error]: null,
    [UISound.ChipPlace]: null,
    [UISound.LanguageChange]: null,
    [UISound.MenuOpen]: null,
    [UISound.MenuClose]: null,
    [UISound.TabChange]: null,
    [UISound.Hover]: null
  });

  // Preload UI sounds
  useEffect(() => {
    // Map UI sounds to file paths
    const soundPaths: Record<UISound, string> = {
      [UISound.ButtonClick]: '/sounds/ui/button-click.mp3',
      [UISound.Notification]: '/sounds/ui/notification.mp3',
      [UISound.Success]: '/sounds/ui/success.mp3',
      [UISound.Error]: '/sounds/ui/error.mp3',
      [UISound.ChipPlace]: '/sounds/ui/chip-place.mp3',
      [UISound.LanguageChange]: '/sounds/ui/language-change.mp3',
      [UISound.MenuOpen]: '/sounds/ui/menu-open.mp3',
      [UISound.MenuClose]: '/sounds/ui/menu-close.mp3',
      [UISound.TabChange]: '/sounds/ui/tab-change.mp3',
      [UISound.Hover]: '/sounds/ui/hover.mp3'
    };

    // Create audio elements for each sound
    Object.entries(soundPaths).forEach(([sound, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      uiSounds.current[sound as UISound] = audio;
    });

    // Cleanup on unmount
    return () => {
      Object.values(uiSounds.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  // Volume setters
  const setMasterVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, masterVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, musicVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setEffectsVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, effectsVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setUIVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, uiVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setAmbientVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, ambientVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setVoiceVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, voiceVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleMute = useCallback(() => {
    setSettings(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setSettings(prev => ({ ...prev, isMuted: muted }));
  }, []);

  // Get volume for a specific category
  const getCategoryVolume = useCallback((category: SoundCategory): number => {
    switch (category) {
      case SoundCategory.Music:
        return settings.musicVolume;
      case SoundCategory.GameEffects:
        return settings.effectsVolume;
      case SoundCategory.UI:
        return settings.uiVolume;
      case SoundCategory.Ambient:
        return settings.ambientVolume;
      case SoundCategory.Voice:
        return settings.voiceVolume;
      default:
        return settings.effectsVolume;
    }
  }, [settings]);

  // Get effective volume (considering master volume and mute state)
  const getEffectiveVolume = useCallback((category: SoundCategory): number => {
    if (settings.isMuted) return 0;
    return settings.masterVolume * getCategoryVolume(category);
  }, [settings, getCategoryVolume]);

  // Play UI sound
  const playUISound = useCallback((soundName: UISound) => {
    const audio = uiSounds.current[soundName];
    if (!audio || settings.isMuted || settings.masterVolume === 0 || settings.uiVolume === 0) return;
    
    audio.volume = settings.masterVolume * settings.uiVolume;
    audio.currentTime = 0;
    audio.play().catch(error => {
      console.error(`Error playing UI sound ${soundName}:`, error);
    });
  }, [settings]);

  const contextValue: SoundManagerContextType = {
    ...settings,
    setMasterVolume,
    setMusicVolume,
    setEffectsVolume,
    setUIVolume,
    setAmbientVolume,
    setVoiceVolume,
    toggleMute,
    setMuted,
    getCategoryVolume,
    getEffectiveVolume,
    playUISound
  };

  return (
    <SoundManagerContext.Provider value={contextValue}>
      {children}
    </SoundManagerContext.Provider>
  );
}

// Hook to use the sound manager
export function useSoundManager() {
  const context = useContext(SoundManagerContext);
  if (!context) {
    throw new Error('useSoundManager must be used within a SoundProvider');
  }
  return context;
}

// Enhanced useSound hook
export function useSound(src: string, options: SoundOptions = {}): UseSound {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundManager = useSoundManager();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const category = options.category || SoundCategory.GameEffects;
  
  // Calculate effective volume
  const effectiveVolume = soundManager.getEffectiveVolume(category) * (options.volume ?? 1);
  
  // Initialize audio on mount
  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = options.preload ? 'auto' : 'metadata';
    
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      if (options.onEnd) {
        options.onEnd();
      }
    };
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    
    audioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current.removeEventListener('ended', onEnded);
      }
    };
  }, [src, options.onEnd, options.preload]);

  // Update audio settings when they change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
      audioRef.current.loop = options.loop ?? false;
      audioRef.current.playbackRate = options.playbackRate ?? 1;
    }
  }, [effectiveVolume, options.loop, options.playbackRate]);

  // Play function
  const play = useCallback(() => {
    if (!audioRef.current || effectiveVolume === 0) return;
    
    // Reset to beginning
    audioRef.current.currentTime = 0;
    
    // Play the sound
    audioRef.current.play().catch(error => {
      console.error("Error playing audio:", error);
    });
    
    setIsPlaying(true);
    setIsPaused(false);
  }, [effectiveVolume]);

  // Play from a specific time
  const playFrom = useCallback((time: number) => {
    if (!audioRef.current || effectiveVolume === 0) return;
    
    audioRef.current.currentTime = Math.min(Math.max(0, time), audioRef.current.duration || 0);
    
    audioRef.current.play().catch(error => {
      console.error("Error playing audio:", error);
    });
    
    setIsPlaying(true);
    setIsPaused(false);
  }, [effectiveVolume]);

  // Pause function
  const pause = useCallback(() => {
    if (!audioRef.current || !isPlaying) return;
    
    audioRef.current.pause();
    setIsPaused(true);
  }, [isPlaying]);

  // Resume function
  const resume = useCallback(() => {
    if (!audioRef.current || !isPaused) return;
    
    audioRef.current.play().catch(error => {
      console.error("Error resuming audio:", error);
    });
    
    setIsPaused(false);
  }, [isPaused]);

  // Stop function
  const stop = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Set volume function
  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    
    const sanitizedVolume = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = soundManager.isMuted ? 0 : sanitizedVolume * soundManager.masterVolume;
  }, [soundManager.isMuted, soundManager.masterVolume]);

  // Set playback rate function
  const setPlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.playbackRate = rate;
  }, []);

  return { 
    play, 
    playFrom, 
    stop, 
    pause, 
    resume, 
    isPlaying, 
    isPaused, 
    setVolume, 
    setPlaybackRate, 
    duration, 
    currentTime 
  };
}