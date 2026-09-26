import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Coins, Settings, Crown } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenPremium: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenPremium }) => {
  const { user, club } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0e17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 h-14 flex items-center justify-between">
      {/* Left: Club Crest + Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-900 shrink-0">
          <img
            src={club?.crest_url || '/src/assets/images/nerva_brand_logo_1790393799448.jpg'}
            alt={club?.name || 'Club'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wide text-white truncate max-w-[95px] uppercase">
              {club?.short_name || 'NER'}
            </span>
            {user?.premium_active && (
              <span className="text-[10px] font-bold px-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 leading-none py-0.5">
                VIP
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium tracking-tight">
            División {club?.division_tier || 1}
          </span>
        </div>
      </div>

      {/* Center: NERVA Title */}
      <div className="flex items-center justify-center">
        <span className="font-sports text-2xl tracking-widest bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent font-bold">
          NERVA
        </span>
      </div>

      {/* Right: Coins balance + Settings trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPremium}
          className="flex items-center gap-1.5 bg-[#121826] border border-slate-800 hover:border-amber-500/40 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-300 transition-colors touch-press"
          title="Monedas y Tienda"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="tabular-nums font-semibold tracking-tight text-[11px]">
            {user ? (user.coins >= 1000000 ? `${(user.coins / 1000000).toFixed(1)}M` : `${(user.coins / 1000).toFixed(0)}K`) : '0'}
          </span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-xl bg-[#121826] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition touch-press"
          aria-label="Ajustes de NERVA"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
