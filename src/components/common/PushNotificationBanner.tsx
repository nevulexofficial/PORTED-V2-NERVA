import React, { useState, useEffect } from 'react';
import { PushAlert } from '../../types/index.ts';
import { Shield, Sparkles, X, ChevronRight, Flame } from 'lucide-react';

interface PushNotificationBannerProps {
  onNavigateToAuction?: (auctionId?: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  onNavigateToAuction
}) => {
  const [currentAlert, setCurrentAlert] = useState<PushAlert | null>(null);
  const [visible, setVisible] = useState(false);

  // Play subtle native-style notification chime using Web Audio
  const playPushChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // Audio playback might be restricted before user gesture
    }
  };

  useEffect(() => {
    const handlePushEvent = (e: any) => {
      const alertData: PushAlert = e.detail;
      if (!alertData) return;

      setCurrentAlert(alertData);
      setVisible(true);
      playPushChime();

      // Vibrate if mobile device supports it
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    };

    window.addEventListener('nerva:push-alert', handlePushEvent);
    return () => window.removeEventListener('nerva:push-alert', handlePushEvent);
  }, []);

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !currentAlert) return null;

  return (
    <div className="fixed top-2 left-0 right-0 z-[100] px-3 max-w-md mx-auto pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto bg-[#0d1424]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl shadow-emerald-950/60 flex flex-col gap-2 ring-1 ring-emerald-500/20">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-sm">
              N
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Notificación Push · Mercado NERVA
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-mono">Ahora</span>
            <button
              onClick={() => setVisible(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white leading-tight">
              {currentAlert.title}
            </h4>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
              {currentAlert.body}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[9px] text-amber-400 font-semibold">
            ⏱️ Subasta en vivo de 6 minutos
          </span>
          <button
            onClick={() => {
              setVisible(false);
              if (onNavigateToAuction) {
                onNavigateToAuction(currentAlert.auction_id);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-950/40 touch-press"
          >
            <span>{currentAlert.action_label || 'Pujar en Subasta'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const triggerPushNotification = (alert: Omit<PushAlert, 'id' | 'created_at'>) => {
  const fullAlert: PushAlert = {
    ...alert,
    id: `push-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  window.dispatchEvent(new CustomEvent('nerva:push-alert', { detail: fullAlert }));
};
