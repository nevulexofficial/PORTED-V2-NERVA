import React, { useState } from 'react';
import { Player, Club } from '../../types/index.ts';
import { SlidersHorizontal, ArrowLeftRight, Check, X, Shield, Plus, User } from 'lucide-react';

interface TacticalPitchProps {
  squad: Player[];
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
  onFormationChange: (formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1') => void;
  onToggleStarter: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

interface PositionCoord {
  id: string;
  role: string;
  x: number; // percentage from left
  y: number; // percentage from bottom (POR near 0, DC near 100)
}

const FORMATION_COORDS: Record<'4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1', PositionCoord[]> = {
  '4-3-3': [
    { id: 'gk', role: 'POR', x: 50, y: 7 },
    { id: 'lb', role: 'LI', x: 14, y: 24 },
    { id: 'cb1', role: 'DFC', x: 38, y: 20 },
    { id: 'cb2', role: 'DFC', x: 62, y: 20 },
    { id: 'rb', role: 'LD', x: 86, y: 24 },
    { id: 'cm1', role: 'MC', x: 26, y: 46 },
    { id: 'dm', role: 'MCD', x: 50, y: 40 },
    { id: 'cm2', role: 'MC', x: 74, y: 46 },
    { id: 'lw', role: 'EI', x: 18, y: 74 },
    { id: 'st', role: 'DC', x: 50, y: 82 },
    { id: 'rw', role: 'ED', x: 82, y: 74 },
  ],
  '4-4-2': [
    { id: 'gk', role: 'POR', x: 50, y: 7 },
    { id: 'lb', role: 'LI', x: 14, y: 23 },
    { id: 'cb1', role: 'DFC', x: 38, y: 19 },
    { id: 'cb2', role: 'DFC', x: 62, y: 19 },
    { id: 'rb', role: 'LD', x: 86, y: 23 },
    { id: 'lm', role: 'MI', x: 15, y: 50 },
    { id: 'cm1', role: 'MC', x: 38, y: 46 },
    { id: 'cm2', role: 'MC', x: 62, y: 46 },
    { id: 'rm', role: 'MD', x: 85, y: 50 },
    { id: 'st1', role: 'DC', x: 36, y: 79 },
    { id: 'st2', role: 'DC', x: 64, y: 79 },
  ],
  '3-5-2': [
    { id: 'gk', role: 'POR', x: 50, y: 7 },
    { id: 'cb1', role: 'DFC', x: 25, y: 21 },
    { id: 'cb2', role: 'DFC', x: 50, y: 18 },
    { id: 'cb3', role: 'DFC', x: 75, y: 21 },
    { id: 'lwb', role: 'CAI', x: 12, y: 48 },
    { id: 'cm1', role: 'MC', x: 34, y: 44 },
    { id: 'dm', role: 'MCD', x: 50, y: 38 },
    { id: 'cm2', role: 'MC', x: 66, y: 44 },
    { id: 'rwb', role: 'CAD', x: 88, y: 48 },
    { id: 'st1', role: 'DC', x: 36, y: 79 },
    { id: 'st2', role: 'DC', x: 64, y: 79 },
  ],
  '4-2-3-1': [
    { id: 'gk', role: 'POR', x: 50, y: 7 },
    { id: 'lb', role: 'LI', x: 14, y: 22 },
    { id: 'cb1', role: 'DFC', x: 38, y: 18 },
    { id: 'cb2', role: 'DFC', x: 62, y: 18 },
    { id: 'rb', role: 'LD', x: 86, y: 22 },
    { id: 'dm1', role: 'MCD', x: 35, y: 38 },
    { id: 'dm2', role: 'MCD', x: 65, y: 38 },
    { id: 'am1', role: 'EI', x: 20, y: 60 },
    { id: 'am2', role: 'MCO', x: 50, y: 62 },
    { id: 'am3', role: 'ED', x: 80, y: 60 },
    { id: 'st', role: 'DC', x: 50, y: 83 },
  ],
};

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  squad,
  formation,
  onFormationChange,
  onToggleStarter,
  onSelectPlayer,
}) => {
  const starters = squad.filter((p) => p.is_starter);
  const bench = squad.filter((p) => !p.is_starter);
  const coords = FORMATION_COORDS[formation] || FORMATION_COORDS['4-3-3'];

  // Swap modal state
  const [playerToSwap, setPlayerToSwap] = useState<Player | null>(null);

  const handleSwap = (benchPlayer: Player) => {
    if (!playerToSwap) return;
    // Swap starters
    onToggleStarter(playerToSwap); // un-starter
    onToggleStarter(benchPlayer);  // become starter
    setPlayerToSwap(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Formation Selector Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 px-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-white uppercase">Formación:</span>
        </div>
        <div className="flex items-center gap-1">
          {(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => onFormationChange(fmt)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                formation === fmt
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* FOOTBALL PITCH (CANCHA DE FÚTBOL REALISTA) */}
      <div className="relative w-full aspect-[3/4.2] rounded-3xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-[#1b4329]">
        {/* Grass Turf Stripes */}
        <div 
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              #1e4d30,
              #1e4d30 36px,
              #1b4329 36px,
              #1b4329 72px
            )`
          }}
        />

        {/* Pitch Lines (Cal reglamentaria blanca) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 fill-none" strokeWidth="1.8">
          {/* Outer Boundary */}
          <rect x="5%" y="4%" width="90%" height="92%" rx="8" />

          {/* Halfway Line */}
          <line x1="5%" y1="50%" x2="95%" y2="50%" />

          {/* Center Circle & Spot */}
          <circle cx="50%" cy="50%" r="14%" />
          <circle cx="50%" cy="50%" r="1.5%" className="fill-white/40" />

          {/* Bottom Penalty Box (Home Goal Area) */}
          <rect x="25%" y="78%" width="50%" height="18%" />
          {/* Bottom 6-yard Box */}
          <rect x="36%" y="89%" width="28%" height="7%" />
          {/* Bottom Penalty Spot */}
          <circle cx="50%" cy="86%" r="1.2%" className="fill-white/40" />
          {/* Bottom Penalty Arc */}
          <path d="M 40% 78% A 12% 12% 0 0 1 60% 78%" />

          {/* Top Penalty Box (Rival Area) */}
          <rect x="25%" y="4%" width="50%" height="18%" />
          {/* Top 6-yard Box */}
          <rect x="36%" y="4%" width="28%" height="7%" />
          {/* Top Penalty Spot */}
          <circle cx="50%" cy="14%" r="1.2%" className="fill-white/40" />
          {/* Top Penalty Arc */}
          <path d="M 40% 22% A 12% 12% 0 0 0 60% 22%" />

          {/* Corner Arcs */}
          <path d="M 5% 7% A 3% 3% 0 0 1 8% 4%" />
          <path d="M 95% 7% A 3% 3% 0 0 0 92% 4%" />
          <path d="M 5% 93% A 3% 3% 0 0 0 8% 96%" />
          <path d="M 95% 93% A 3% 3% 0 0 1 92% 96%" />
        </svg>

        {/* Pitch Direction Badge */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-white/70 uppercase tracking-widest pointer-events-none">
          Ataque ↑
        </div>

        {/* 11 Starter Players Positioned on Pitch */}
        {coords.map((pos, idx) => {
          const player = starters[idx];

          return (
            <div
              key={pos.id}
              style={{
                left: `${pos.x}%`,
                bottom: `${pos.y}%`,
                transform: 'translate(-50%, 50%)',
              }}
              className="absolute z-10 flex flex-col items-center group cursor-pointer"
              onClick={() => {
                if (player) {
                  setPlayerToSwap(player);
                }
              }}
            >
              {player ? (
                /* Player Token */
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {/* Circle Card with Glow */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-950 shadow-lg shadow-black/80 flex items-center justify-center p-0.5 group-hover:scale-110 transition">
                      <img
                        src={player.avatar_url}
                        alt={player.last_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    {/* OVR Rating Badge */}
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded-full leading-tight border border-amber-300 shadow">
                      {player.rating}
                    </span>
                    {/* Position Label Tag */}
                    <span className="absolute -bottom-1 -left-1 bg-emerald-700 text-white font-bold text-[8px] px-1 rounded leading-tight shadow border border-emerald-500">
                      {pos.role}
                    </span>
                  </div>

                  {/* Player Name Pill */}
                  <div className="mt-1 px-1.5 py-0.2 rounded-md bg-black/75 backdrop-blur-md border border-white/20 text-center max-w-[65px] truncate">
                    <span className="text-[9px] font-bold text-white truncate block">
                      {player.last_name}
                    </span>
                  </div>
                </div>
              ) : (
                /* Empty Position Placeholder */
                <div className="flex flex-col items-center opacity-60 hover:opacity-100 transition">
                  <div className="w-9 h-9 rounded-full border border-dashed border-white/50 bg-black/30 flex items-center justify-center text-white text-[10px] font-bold">
                    {pos.role}
                  </div>
                  <span className="text-[8px] font-semibold text-white/80 mt-0.5">Vacante</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bench / Substitutes List */}
      <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Banquillo de Suplentes ({bench.length})
          </span>
          <span className="text-[10px] text-slate-400">Toca para incluir o intercambiar</span>
        </div>

        {bench.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">Todos los jugadores están en el campo.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bench.map((player) => (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                className="shrink-0 w-28 p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center text-center cursor-pointer transition touch-press"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 bg-slate-950 mb-1">
                  <img src={player.avatar_url} alt={player.last_name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-bold text-white truncate w-full">
                  {player.last_name}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                  <span className="text-emerald-400 font-bold">{player.position}</span>
                  <span>·</span>
                  <span className="text-amber-400 font-bold">{player.rating}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStarter(player);
                  }}
                  className="mt-1.5 w-full py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 transition"
                >
                  Meter Titular
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fast Player Swap Modal */}
      {playerToSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase">Sustituir a {playerToSwap.last_name}</h4>
              </div>
              <button onClick={() => setPlayerToSwap(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Selecciona el jugador suplente que entrará al once titular:
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {bench.map((bPlayer) => (
                <div
                  key={bPlayer.id}
                  onClick={() => handleSwap(bPlayer)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img src={bPlayer.avatar_url} alt={bPlayer.last_name} className="w-8 h-8 rounded-full object-cover bg-slate-950" />
                    <div>
                      <span className="text-xs font-bold text-white block">{bPlayer.first_name} {bPlayer.last_name}</span>
                      <span className="text-[10px] text-slate-400">{bPlayer.position} · OVR {bPlayer.rating}</span>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                    Entrar
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => onToggleStarter(playerToSwap)}
              className="py-2 rounded-xl bg-rose-950/40 text-rose-300 text-xs font-bold border border-rose-500/30 hover:bg-rose-900/40"
            >
              Mandar al banquillo directamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
