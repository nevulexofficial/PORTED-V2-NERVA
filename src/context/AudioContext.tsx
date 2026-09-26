import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BackgroundTrack } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AudioContextType {
  isPlaying: boolean;
  volume: number;
  currentTrack: BackgroundTrack | null;
  tracks: BackgroundTrack[];
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  setVolume: (vol: number) => void;
  selectTrack: (trackId: string) => void;
  refreshTracks: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<BackgroundTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<BackgroundTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    return localStorage.getItem('nerva_audio_playing') === 'true';
  });
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('nerva_audio_volume');
    return saved !== null ? Number(saved) : 0.4;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refreshTracks = async () => {
    try {
      const res = await api.getAudioTracks();
      if (res && res.tracks && res.tracks.length > 0) {
        setTracks(res.tracks);
        const active = res.tracks.find(t => t.is_active) || res.tracks[0];
        setCurrentTrack(active);
      }
    } catch (err) {
      console.warn('Could not load audio tracks, using default beat:', err);
      const fallback: BackgroundTrack = {
        id: 'trk-default',
        title: 'Nerva Champions Theme (Electric Stadium)',
        artist: 'Nerva Sound Lab',
        url: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
        is_active: true
      };
      setTracks([fallback]);
      setCurrentTrack(fallback);
    }
  };

  useEffect(() => {
    refreshTracks();
  }, []);

  // Initialize Audio instance
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync track URL
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const currentSrc = audioRef.current.src;
      // Resolve relative URL if needed
      const fullUrl = currentTrack.url.startsWith('http')
        ? currentTrack.url
        : `${window.location.origin}${currentTrack.url}`;

      if (currentSrc !== fullUrl) {
        audioRef.current.src = currentTrack.url;
        if (isPlaying) {
          audioRef.current.play().catch(e => {
            console.warn('Autoplay prevented by browser, waiting for user interaction:', e);
          });
        }
      }
    }
  }, [currentTrack]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    localStorage.setItem('nerva_audio_volume', String(volume));
  }, [volume]);

  // Sync Play / Pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn('Autoplay policy requires user click:', e);
        });
      } else {
        audioRef.current.pause();
      }
    }
    localStorage.setItem('nerva_audio_playing', String(isPlaying));
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const pause = () => setIsPlaying(false);
  const play = () => setIsPlaying(true);

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
  };

  const selectTrack = (trackId: string) => {
    const found = tracks.find(t => t.id === trackId);
    if (found) {
      setCurrentTrack(found);
      setIsPlaying(true);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        volume,
        currentTrack,
        tracks,
        togglePlay,
        pause,
        play,
        setVolume,
        selectTrack,
        refreshTracks,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useBackgroundAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useBackgroundAudio must be used within an AudioProvider');
  }
  return context;
};
