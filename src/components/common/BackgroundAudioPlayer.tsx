import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api.ts';

export const BackgroundAudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    return localStorage.getItem('nerva_audio_playing') !== 'false';
  });
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('nerva_audio_volume');
    return saved !== null ? Number(saved) : 0.35;
  });
  const [trackUrl, setTrackUrl] = useState<string>('https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3');

  // Load active track from server
  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await api.getAudioTracks();
        const active = res.tracks?.find(t => t.is_active) || res.tracks?.[0];
        if (active?.url) {
          setTrackUrl(active.url);
        }
      } catch (err) {
        // Fallback default track
      }
    }
    loadTrack();
  }, []);

  // Sync with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented by browser until user clicks
          const handleFirstClick = () => {
            if (audioRef.current && isPlaying) {
              audioRef.current.play().catch(() => {});
            }
            window.removeEventListener('click', handleFirstClick);
            window.removeEventListener('keydown', handleFirstClick);
          };
          window.addEventListener('click', handleFirstClick, { once: true });
          window.addEventListener('keydown', handleFirstClick, { once: true });
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, volume, trackUrl]);

  // Listen for custom events dispatched from "Más > Sonido"
  useEffect(() => {
    const handleControl = (e: CustomEvent<{ playing?: boolean; volume?: number; trackUrl?: string }>) => {
      if (e.detail.playing !== undefined) {
        setIsPlaying(e.detail.playing);
        localStorage.setItem('nerva_audio_playing', String(e.detail.playing));
      }
      if (e.detail.volume !== undefined) {
        setVolume(e.detail.volume);
        localStorage.setItem('nerva_audio_volume', String(e.detail.volume));
      }
      if (e.detail.trackUrl !== undefined) {
        setTrackUrl(e.detail.trackUrl);
      }
    };

    window.addEventListener('nerva-audio-control' as any, handleControl as any);
    return () => {
      window.removeEventListener('nerva-audio-control' as any, handleControl as any);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src={trackUrl}
      loop
      preload="auto"
      className="hidden"
    />
  );
};

// Helper for UI components to broadcast sound adjustments
export function updateGlobalAudio(settings: { playing?: boolean; volume?: number; trackUrl?: string }) {
  window.dispatchEvent(new CustomEvent('nerva-audio-control', { detail: settings }));
}
