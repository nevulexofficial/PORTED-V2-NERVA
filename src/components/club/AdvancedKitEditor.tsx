import React, { useState } from 'react';
import { Club } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Shirt, Palette, Sparkles, CheckCircle2, Sliders, Type } from 'lucide-react';

interface AdvancedKitEditorProps {
  club: Club;
  onSaveSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdvancedKitEditor: React.FC<AdvancedKitEditorProps> = ({
  club,
  onSaveSuccess,
  showToast,
}) => {
  const [primaryColor, setPrimaryColor] = useState(club.primary_kit_color || '#10b981');
  const [secondaryColor, setSecondaryColor] = useState(club.secondary_kit_color || '#ffffff');
  const [accentColor, setAccentColor] = useState(club.accent_kit_color || '#0f172a');
  const [sleeveColor, setSleeveColor] = useState(club.sleeve_color || club.secondary_kit_color || '#ffffff');
  const [textColor, setTextColor] = useState(club.text_kit_color || '#ffffff');
  
  const [kitPattern, setKitPattern] = useState<any>(club.kit_pattern || 'stripes');
  const [collarType, setCollarType] = useState<any>(club.collar_type || 'round');
  const [numberFont, setNumberFont] = useState<any>(club.number_font || 'modern');
  const [jerseyNumber, setJerseyNumber] = useState('10');
  const [jerseyName, setJerseyName] = useState(club.short_name || 'NERVA');

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMyClub({
        primary_kit_color: primaryColor,
        secondary_kit_color: secondaryColor,
        accent_kit_color: accentColor,
        sleeve_color: sleeveColor,
        text_kit_color: textColor,
        kit_pattern: kitPattern,
        collar_type: collarType,
        number_font: numberFont,
      });
      showToast('¡Equipación deportiva oficial guardada con éxito!', 'success');
      onSaveSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar equipación', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Diseñador Avanzado de Camisetas
            </h3>
            <span className="text-[10px] text-slate-400">
              Texturas hiper-realistas, patrones oficiales y dorsal personalizado
            </span>
          </div>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          PRO STUDIO
        </span>
      </div>

      {/* Hi-Fi 3D-Look Athletic Soccer Jersey Preview */}
      <div className="relative py-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-slate-950 rounded-2xl border border-slate-800 shadow-inner overflow-hidden">
        {/* Subtle Stadium Light Glow */}
        <div className="absolute top-0 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <svg viewBox="0 0 280 300" className="w-56 h-60 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] z-10">
          <defs>
            {/* Athletic Micro-Mesh Filter */}
            <filter id="fabricTexture" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.05 0" />
              <feComposite in2="SourceGraphic" in="gl" operator="in" />
            </filter>

            {/* Realistic 3D Torso Shading Gradient */}
            <linearGradient id="bodyShade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </linearGradient>

            {/* Vertical Stripes Pattern */}
            <pattern id="advStripes" width="44" height="20" patternUnits="userSpaceOnUse">
              <rect width="22" height="20" fill={primaryColor} />
              <rect x="22" width="22" height="20" fill={secondaryColor} />
            </pattern>

            {/* Horizontal Hoops Pattern */}
            <pattern id="advHoops" width="20" height="44" patternUnits="userSpaceOnUse">
              <rect width="20" height="22" fill={primaryColor} />
              <rect y="22" width="20" height="22" fill={secondaryColor} />
            </pattern>

            {/* Checkered / Damero Pattern */}
            <pattern id="advCheckered" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill={primaryColor} />
              <rect x="20" width="20" height="20" fill={secondaryColor} />
              <rect y="20" width="20" height="20" fill={secondaryColor} />
              <rect x="20" y="20" width="20" height="20" fill={primaryColor} />
            </pattern>

            {/* Pinstripes Pattern */}
            <pattern id="advPinstripes" width="26" height="20" patternUnits="userSpaceOnUse">
              <rect width="26" height="20" fill={primaryColor} />
              <rect x="12" width="2.5" height="20" fill={secondaryColor} />
            </pattern>

            {/* Camo Geometric Pattern */}
            <pattern id="advCamo" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="60" height="60" fill={primaryColor} />
              <polygon points="0,0 30,0 15,30" fill={secondaryColor} opacity="0.3" />
              <polygon points="30,0 60,0 45,30" fill={accentColor} opacity="0.25" />
              <polygon points="15,30 45,30 30,60" fill={secondaryColor} opacity="0.35" />
            </pattern>

            {/* Dynamic Radial Gradient */}
            <radialGradient id="advRadial" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor={secondaryColor} />
              <stop offset="100%" stopColor={primaryColor} />
            </radialGradient>
          </defs>

          {/* Left Sleeve with Realistic Angle & Cuff */}
          <g>
            <path
              d="M 45,55 L 8,110 L 40,132 L 72,75 Z"
              fill={kitPattern === 'sleeves_contrast' ? sleeveColor : (kitPattern === 'halves' ? primaryColor : sleeveColor)}
              stroke={accentColor}
              strokeWidth="2"
            />
            {/* Sleeve Cuff Trim */}
            <path d="M 8,110 L 15,122 L 47,144 L 40,132 Z" fill={accentColor} />
          </g>

          {/* Right Sleeve with Realistic Angle & Cuff */}
          <g>
            <path
              d="M 235,55 L 272,110 L 240,132 L 208,75 Z"
              fill={kitPattern === 'sleeves_contrast' ? sleeveColor : (kitPattern === 'halves' ? secondaryColor : sleeveColor)}
              stroke={accentColor}
              strokeWidth="2"
            />
            {/* Sleeve Cuff Trim */}
            <path d="M 272,110 L 265,122 L 233,144 L 240,132 Z" fill={accentColor} />
          </g>

          {/* Torso Main Athletic Silhouette */}
          <g>
            {kitPattern === 'halves' ? (
              <g>
                <path d="M 60,55 L 140,55 L 140,270 L 72,270 Z" fill={primaryColor} />
                <path d="M 140,55 L 220,55 L 208,270 L 140,270 Z" fill={secondaryColor} />
                <path d="M 60,55 L 220,55 L 208,270 L 72,270 Z" fill="none" stroke={accentColor} strokeWidth="3" />
              </g>
            ) : (
              <path
                d="M 60,55 L 220,55 L 208,270 L 72,270 Z"
                fill={
                  kitPattern === 'stripes' ? 'url(#advStripes)' :
                  kitPattern === 'hoops' ? 'url(#advHoops)' :
                  kitPattern === 'checkered' ? 'url(#advCheckered)' :
                  kitPattern === 'pinstripes' ? 'url(#advPinstripes)' :
                  kitPattern === 'camo_geometric' ? 'url(#advCamo)' :
                  kitPattern === 'radial_burst' ? 'url(#advRadial)' :
                  primaryColor
                }
                stroke={accentColor}
                strokeWidth="3"
              />
            )}

            {/* Chevron V Pattern */}
            {kitPattern === 'chevron' && (
              <polygon points="60,95 140,145 220,95 220,122 140,172 60,122" fill={secondaryColor} opacity="0.95" />
            )}

            {/* Diagonal Sash */}
            {kitPattern === 'sash' && (
              <polygon points="60,55 100,55 208,225 208,270" fill={secondaryColor} opacity="0.9" />
            )}

            {/* 3D Realistic Torso Lighting & Shading Layer */}
            <path d="M 60,55 L 220,55 L 208,270 L 72,270 Z" fill="url(#bodyShade)" pointerEvents="none" />
          </g>

          {/* Athletic Collar Render */}
          {collarType === 'v-neck' ? (
            <g>
              <polygon points="105,55 175,55 140,90" fill={accentColor} stroke="#ffffff" strokeWidth="0.5" />
              <polygon points="115,55 165,55 140,82" fill="#0f172a" />
            </g>
          ) : collarType === 'polo' ? (
            <g>
              {/* Folded Polo Collar Lapels */}
              <polygon points="98,55 182,55 170,92 140,75 110,92" fill={accentColor} stroke="#ffffff" strokeWidth="1" />
              <line x1="140" y1="75" x2="140" y2="105" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="140" cy="85" r="2" fill="#ffffff" />
              <circle cx="140" cy="97" r="2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              {/* Round Crewneck with ribbed trim */}
              <path d="M 105,55 Q 140,90 175,55" fill="none" stroke={accentColor} strokeWidth="8" strokeLinecap="round" />
              <path d="M 112,55 Q 140,84 168,55" fill="#0f172a" />
            </g>
          )}

          {/* Club Crest (Left Chest) */}
          <g>
            <circle cx="95" cy="110" r="17" fill="#020617" stroke="#eab308" strokeWidth="2.5" />
            <image href={club.crest_url} x="82" y="97" width="26" height="26" preserveAspectRatio="xMidYMid slice" />
          </g>

          {/* Kit Manufacturer Brand Logo (Right Chest) */}
          <g>
            <path d="M 175,108 L 190,102 L 186,114 Z" fill={textColor} opacity="0.9" />
          </g>

          {/* Front Sponsor Stamp */}
          <g>
            <rect x="80" y="160" width="120" height="32" rx="7" fill="#020617" opacity="0.88" stroke="#334155" strokeWidth="1" />
            <text x="140" y="180" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
              {(club.active_sponsor_id ? 'PATROCINIO' : 'NERVA').toUpperCase()}
            </text>
          </g>

          {/* Dorsal Number & Name on Jersey */}
          <g opacity="0.85">
            <text x="140" y="215" textAnchor="middle" fill={textColor} fontSize="11" fontWeight="800" fontFamily="sans-serif">
              {jerseyName.toUpperCase()}
            </text>
            <text x="140" y="252" textAnchor="middle" fill={textColor} fontSize="32" fontWeight="900" fontFamily={
              numberFont === 'classic' ? 'serif' : numberFont === 'futuristic' ? 'monospace' : 'sans-serif'
            }>
              {jerseyNumber}
            </text>
          </g>
        </svg>

        <span className="text-xs font-black text-white mt-2 tracking-wide">
          {club.name} · Kit Oficial 2026/27
        </span>
      </div>

      {/* Control Palettes */}
      <div className="flex flex-col gap-3">
        {/* Colors Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Base Color */}
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-300">Base</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-[10px] font-mono text-emerald-400">{primaryColor}</span>
            </div>
          </div>

          {/* Secondary Color */}
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-300">Rayas/Patrón</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-[10px] font-mono text-slate-300">{secondaryColor}</span>
            </div>
          </div>

          {/* Sleeves Color */}
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-300">Mangas</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={sleeveColor}
                onChange={(e) => setSleeveColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-[10px] font-mono text-slate-300">{sleeveColor}</span>
            </div>
          </div>

          {/* Accent/Cuello Color */}
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-300">Cuello/Ribetes</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-[10px] font-mono text-slate-300">{accentColor}</span>
            </div>
          </div>
        </div>

        {/* 11 Professional Kit Patterns */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            Estilo de Patrón Gráfico (11 Diseños)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'solid', label: 'Lisa Clásica' },
              { id: 'stripes', label: 'Rayas Verticales' },
              { id: 'hoops', label: 'Franjas Horizontales' },
              { id: 'sash', label: 'Banda Diagonal' },
              { id: 'halves', label: 'Mitad y Mitad' },
              { id: 'checkered', label: 'Ajedrezado' },
              { id: 'chevron', label: 'Pectoral en V' },
              { id: 'pinstripes', label: 'Líneas Finas' },
              { id: 'sleeves_contrast', label: 'Mangas Contraste' },
              { id: 'camo_geometric', label: 'Camuflaje Geométrico' },
              { id: 'radial_burst', label: 'Degradado Energético' },
            ].map((pat) => (
              <button
                key={pat.id}
                type="button"
                onClick={() => setKitPattern(pat.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                  kitPattern === pat.id
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {pat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collar Types */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            Tipo de Cuello Atlético
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'round', label: 'Cuello Redondo' },
              { id: 'v-neck', label: 'Cuello en V' },
              { id: 'polo', label: 'Cuello Polo' },
            ].map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setCollarType(col.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  collarType === col.id
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dorsal Name & Number */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            Dorsal y Tipografía
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Nombre en Camiseta</label>
              <input
                type="text"
                value={jerseyName}
                onChange={(e) => setJerseyName(e.target.value.toUpperCase().slice(0, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Número Dorsal (0-99)</label>
              <input
                type="text"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value.slice(0, 2))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition touch-press"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Aplicar Equipación al Club'}</span>
        </button>
      </div>
    </div>
  );
};
