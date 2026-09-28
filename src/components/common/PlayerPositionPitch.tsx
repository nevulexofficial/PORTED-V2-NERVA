import React from 'react';
import { PlayerPosition } from '../../types/index.ts';

interface PlayerPositionPitchProps {
  position: PlayerPosition | string;
  className?: string;
  showLegend?: boolean;
}

interface PosCoord {
  id: string;
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top (100% is own goal, 0% is opponent goal)
  role: string;
}

const TACTICAL_POSITIONS: Record<string, PosCoord> = {
  POR: { id: 'POR', name: 'Portero', x: 50, y: 88, role: 'Guardameta' },
  DFC: { id: 'DFC', name: 'Defensa Central', x: 50, y: 72, role: 'Zaguero Central' },
  LI: { id: 'LI', name: 'Lateral Izquierdo', x: 18, y: 70, role: 'Banda Defensiva Izquierda' },
  LD: { id: 'LD', name: 'Lateral Derecho', x: 82, y: 70, role: 'Banda Defensiva Derecha' },
  MCD: { id: 'MCD', name: 'Pivote Defensivo', x: 50, y: 56, role: 'Contención' },
  MC: { id: 'MC', name: 'Mediocentro', x: 50, y: 44, role: 'Organizador' },
  MCO: { id: 'MCO', name: 'Mediapunta', x: 50, y: 32, role: 'Enganche / Creador' },
  EI: { id: 'EI', name: 'Extremo Izquierdo', x: 20, y: 22, role: 'Ataque por Banda Izq.' },
  ED: { id: 'ED', name: 'Extremo Derecho', x: 80, y: 22, role: 'Ataque por Banda Der.' },
  DC: { id: 'DC', name: 'Delantero Centro', x: 50, y: 15, role: 'Goleador / Ariete' }
};

export const PlayerPositionPitch: React.FC<PlayerPositionPitchProps> = ({
  position,
  className = '',
  showLegend = true
}) => {
  const normPos = (position || 'DC').toUpperCase();
  const currentPos = TACTICAL_POSITIONS[normPos] || TACTICAL_POSITIONS.DC;

  const allGhostPositions: PosCoord[] = Object.values(TACTICAL_POSITIONS);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Mini Football Pitch Canvas */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-500/40 bg-gradient-to-b from-[#064e3b] via-[#043e2f] to-[#022c22] shadow-inner select-none">
        
        {/* Field Grass Alternating Striping */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
          <div className="flex-1 bg-white/5" />
          <div className="flex-1 bg-black/10" />
          <div className="flex-1 bg-white/5" />
          <div className="flex-1 bg-black/10" />
          <div className="flex-1 bg-white/5" />
          <div className="flex-1 bg-black/10" />
        </div>

        {/* Pitch Lines (SVG overlay) */}
        <svg className="absolute inset-0 w-full h-full stroke-white/40 fill-none" strokeWidth="1.2">
          {/* Outer Boundary Line */}
          <rect x="5%" y="6%" width="90%" height="88%" rx="4" />

          {/* Halfway Line */}
          <line x1="5%" y1="50%" x2="95%" y2="50%" />

          {/* Center Circle */}
          <circle cx="50%" cy="50%" r="14%" />
          <circle cx="50%" cy="50%" r="1.5%" className="fill-white/50" />

          {/* Opponent Penalty Box (Top) */}
          <rect x="25%" y="6%" width="50%" height="18%" />
          <rect x="36%" y="6%" width="28%" height="7%" />
          <path d="M 42%,24% A 10% 8% 0 0,0 58%,24%" />

          {/* Own Penalty Box (Bottom) */}
          <rect x="25%" y="76%" width="50%" height="18%" />
          <rect x="36%" y="87%" width="28%" height="7%" />
          <path d="M 42%,76% A 10% 8% 0 0,1 58%,76%" />

          {/* Goal Arcs */}
          <line x1="44%" y1="6%" x2="56%" y2="6%" strokeWidth="2.5" className="stroke-emerald-300/80" />
          <line x1="44%" y1="94%" x2="56%" y2="94%" strokeWidth="2.5" className="stroke-emerald-300/80" />
        </svg>

        {/* Direction Indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] font-bold text-emerald-300/60 uppercase tracking-widest">
          <span>Arco Rival ▲</span>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-bold text-emerald-300/60 uppercase tracking-widest">
          <span>Arco Propio ▼</span>
        </div>

        {/* Ghost Position Reference Dots */}
        {allGhostPositions.map((p) => {
          if (p.id === currentPos.id) return null;
          return (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          );
        })}

        {/* Active Player Position Pin with Glow & Radar Pulse */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center cursor-default transition-all duration-300"
          style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
        >
          {/* Radar Pulse ring */}
          <span className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />

          {/* Glowing Badge */}
          <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] tracking-tight shadow-lg shadow-amber-950/80 border border-white flex items-center gap-1">
            <span>{currentPos.id}</span>
          </div>

          <span className="text-[7.5px] font-black text-amber-200 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap">
            {currentPos.name}
          </span>
        </div>
      </div>

      {/* Descriptive Footer Info */}
      {showLegend && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px]">
          <span className="text-slate-400">Demarcación Táctica:</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {currentPos.name} ({currentPos.role})
          </span>
        </div>
      )}
    </div>
  );
};
