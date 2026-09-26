import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Player, Club } from '../../types/index.ts';
import { TacticalPitch } from './TacticalPitch.tsx';
import { AdvancedKitEditor } from './AdvancedKitEditor.tsx';
import { 
  Shield, Edit3, Crown, Users, Award, 
  ChevronRight, Sparkles, Check, X, SlidersHorizontal, 
  Shirt, DollarSign, Palette, CheckCircle2 
} from 'lucide-react';

interface ClubViewProps {
  onOpenPremium: () => void;
}

export const ClubView: React.FC<ClubViewProps> = ({ onOpenPremium }) => {
  const { club, user, showToast, refreshUserData } = useAuth();
  const [squad, setSquad] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Tabs: Plantilla vs Camiseta (Kit)
  const [activeTab, setActiveTab] = useState<'squad' | 'kit'>('squad');

  // Basic Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFormation, setEditFormation] = useState<'4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1'>('4-3-3');
  const [editCrestUrl, setEditCrestUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');

  // Kit Customization State (Expanded Patterns)
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#0a0e17');
  const [kitPattern, setKitPattern] = useState<'solid' | 'stripes' | 'hoops' | 'sash' | 'gradient' | 'halves' | 'checkered' | 'chevron' | 'pinstripes' | 'sleeves_contrast' | 'camo_geometric' | 'radial_burst'>('stripes');
  const [collarType, setCollarType] = useState<'round' | 'v-neck' | 'polo'>('round');
  const [isSavingKit, setIsSavingKit] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const clubData = await api.getMyClub();
        setSquad(clubData.squad);
        
        if (clubData.club) {
          setEditName(clubData.club.name);
          setEditDesc(clubData.club.description);
          setEditFormation(clubData.club.formation);
          setEditCrestUrl(clubData.club.crest_url);
          setEditBannerUrl(clubData.club.banner_url);

          if (clubData.club.primary_kit_color) setPrimaryColor(clubData.club.primary_kit_color);
          if (clubData.club.secondary_kit_color) setSecondaryColor(clubData.club.secondary_kit_color);
          if (clubData.club.kit_pattern) setKitPattern(clubData.club.kit_pattern);
          if (clubData.club.accent_kit_color) setAccentColor(clubData.club.accent_kit_color);
          if (clubData.club.collar_type) setCollarType(clubData.club.collar_type);
        }
      } catch (err) {
        console.error('Error loading club data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveClub = async () => {
    try {
      await api.updateMyClub({
        name: editName,
        description: editDesc,
        formation: editFormation,
        crest_url: editCrestUrl,
        banner_url: editBannerUrl,
      });
      showToast('Club actualizado con éxito', 'success');
      setIsEditing(false);
      refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar club', 'error');
    }
  };

  const handleSaveKit = async () => {
    setIsSavingKit(true);
    try {
      await api.updateMyClub({
        primary_kit_color: primaryColor,
        secondary_kit_color: secondaryColor,
        accent_kit_color: accentColor,
        kit_pattern: kitPattern,
        collar_type: collarType
      });
      showToast('Equipación oficial actualizada y guardada', 'success');
      refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar equipación', 'error');
    } finally {
      setIsSavingKit(false);
    }
  };

  const handleToggleStarter = async (player: Player) => {
    try {
      const updatedStatus = !player.is_starter;
      await api.updatePlayerLineup(player.id, updatedStatus);
      setSquad(prev => prev.map(p => p.id === player.id ? { ...p, is_starter: updatedStatus } : p));
      showToast(`${player.last_name} ${updatedStatus ? 'incluido en el once titular' : 'en el banquillo'}`, 'info');
      if (selectedPlayer && selectedPlayer.id === player.id) {
        setSelectedPlayer({ ...selectedPlayer, is_starter: updatedStatus });
      }
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar alineación', 'error');
    }
  };

  const starters = squad.filter(p => p.is_starter);
  const bench = squad.filter(p => !p.is_starter);

  return (
    <div className="flex flex-col gap-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Club Identity Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#121826] shadow-xl">
        <div className="h-28 w-full relative">
          <img
            src={club?.banner_url || '/src/assets/images/stadium_banner_pitch_1790393808701.jpg'}
            alt="Banner del Club"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121826] via-[#121826]/60 to-transparent" />
        </div>

        <div className="relative px-5 pb-5 -mt-8 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-900 shadow-xl shrink-0 p-1">
                <img
                  src={club?.crest_url || '/src/assets/images/crest_titan_fc_1790393819091.jpg'}
                  alt={club?.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-white tracking-tight truncate">
                  {club?.name}
                </h1>
                <p className="text-xs text-slate-400 line-clamp-1">{club?.description}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition touch-press"
              aria-label="Editar Club"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Detailed Club Statistics Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Partidos</span>
              <span className="text-sm font-bold text-white tabular-nums">{club?.matches_played || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Victorias</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">{club?.matches_won || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Goles (DIF)</span>
              <span className="text-sm font-bold text-teal-400 tabular-nums">
                {((club?.goals_for || 0) - (club?.goals_against || 0)) > 0 ? `+${(club?.goals_for || 0) - (club?.goals_against || 0)}` : (club?.goals_for || 0) - (club?.goals_against || 0)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Trofeos</span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">{club?.trophies_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher (Plantilla / Camiseta) */}
      <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveTab('squad')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'squad'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Plantilla</span>
        </button>
        <button
          onClick={() => setActiveTab('kit')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'kit'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>Camisetas</span>
        </button>
      </div>

      {/* TAB 1: PLANTILLA CON CANCHA DE FÚTBOL REALISTA Y POSICIONES */}
      {activeTab === 'squad' && (
        <div className="flex flex-col gap-4">
          <TacticalPitch
            squad={squad}
            formation={club?.formation || '4-3-3'}
            onFormationChange={async (newFmt) => {
              try {
                await api.updateMyClub({ formation: newFmt });
                if (club) club.formation = newFmt;
                setEditFormation(newFmt);
                refreshUserData();
                showToast(`Formación táctica actualizada a ${newFmt}`, 'success');
              } catch (err: any) {
                showToast(err.message || 'Error al cambiar formación', 'error');
              }
            }}
            onToggleStarter={handleToggleStarter}
            onSelectPlayer={(player) => setSelectedPlayer(player)}
          />
        </div>
      )}

      {/* TAB 2: EDICIÓN AVANZADA DE CAMISETAS */}
      {activeTab === 'kit' && (
        <div className="rounded-3xl bg-[#121826] border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Diseñador de Equipación Oficial</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              PRO KIT
            </span>
          </div>

          {/* Interactive Soccer Jersey SVG Renderer */}
          <div className="relative py-4 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            <svg viewBox="0 0 240 260" className="w-52 h-56 drop-shadow-2xl">
              <defs>
                {/* Vertical Stripes Pattern */}
                <pattern id="stripesPattern" width="40" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill={primaryColor} />
                  <rect x="20" width="20" height="20" fill={secondaryColor} />
                </pattern>
                {/* Horizontal Hoops Pattern */}
                <pattern id="hoopsPattern" width="20" height="40" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill={primaryColor} />
                  <rect y="20" width="20" height="20" fill={secondaryColor} />
                </pattern>
                {/* Checkered / Ajedrezado (Croacia) */}
                <pattern id="checkeredPattern" width="36" height="36" patternUnits="userSpaceOnUse">
                  <rect width="18" height="18" fill={primaryColor} />
                  <rect x="18" width="18" height="18" fill={secondaryColor} />
                  <rect y="18" width="18" height="18" fill={secondaryColor} />
                  <rect x="18" y="18" width="18" height="18" fill={primaryColor} />
                </pattern>
                {/* Pinstripes / Rayas Finas Elegantes */}
                <pattern id="pinstripesPattern" width="24" height="20" patternUnits="userSpaceOnUse">
                  <rect width="24" height="20" fill={primaryColor} />
                  <rect x="11" width="2.5" height="20" fill={secondaryColor} />
                </pattern>
                {/* Gradient */}
                <linearGradient id="kitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
              </defs>

              {/* Sleeves Left & Right */}
              <path 
                d="M 35,45 L 5,95 L 35,115 L 60,65 Z" 
                fill={kitPattern === 'sleeves_contrast' ? secondaryColor : (kitPattern === 'halves' ? primaryColor : secondaryColor)} 
                stroke={accentColor} 
                strokeWidth="2" 
              />
              <path 
                d="M 205,45 L 235,95 L 205,115 L 180,65 Z" 
                fill={kitPattern === 'sleeves_contrast' ? secondaryColor : (kitPattern === 'halves' ? secondaryColor : secondaryColor)} 
                stroke={accentColor} 
                strokeWidth="2" 
              />

              {/* Main Jersey Body */}
              {kitPattern === 'halves' ? (
                <g>
                  {/* Left Half (Primary) */}
                  <path d="M 50,45 L 120,45 L 120,240 L 60,240 Z" fill={primaryColor} />
                  {/* Right Half (Secondary) */}
                  <path d="M 120,45 L 190,45 L 180,240 L 120,240 Z" fill={secondaryColor} />
                  {/* Outer Outline */}
                  <path d="M 50,45 L 190,45 L 180,240 L 60,240 Z" fill="none" stroke={accentColor} strokeWidth="2.5" />
                </g>
              ) : (
                <path
                  d="M 50,45 L 190,45 L 180,240 L 60,240 Z"
                  fill={
                    kitPattern === 'stripes' ? 'url(#stripesPattern)' :
                    kitPattern === 'hoops' ? 'url(#hoopsPattern)' :
                    kitPattern === 'checkered' ? 'url(#checkeredPattern)' :
                    kitPattern === 'pinstripes' ? 'url(#pinstripesPattern)' :
                    kitPattern === 'gradient' ? 'url(#kitGradient)' :
                    primaryColor
                  }
                  stroke={accentColor}
                  strokeWidth="2.5"
                />
              )}

              {/* Chevron Pattern (V en el pecho) */}
              {kitPattern === 'chevron' && (
                <polygon points="50,85 120,130 190,85 190,110 120,155 50,110" fill={secondaryColor} opacity="0.95" />
              )}

              {/* Diagonal Sash if selected */}
              {kitPattern === 'sash' && (
                <polygon points="50,45 85,45 180,205 180,240" fill={secondaryColor} opacity="0.9" />
              )}

              {/* Collar Design */}
              {collarType === 'v-neck' ? (
                <polygon points="95,45 145,45 120,75" fill={accentColor} />
              ) : collarType === 'polo' ? (
                <g>
                  {/* Polo Collar with lapels */}
                  <polygon points="88,45 152,45 142,78 120,62 98,78" fill={accentColor} stroke="#ffffff" strokeWidth="0.5" />
                  <line x1="120" y1="62" x2="120" y2="88" stroke="#ffffff" strokeWidth="1" />
                </g>
              ) : (
                <path d="M 95,45 Q 120,75 145,45 Z" fill={accentColor} />
              )}

              {/* Club Badge Crest on Chest */}
              <circle cx="85" cy="95" r="16" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              <text x="85" y="99" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">★</text>

              {/* Chest Brand Print */}
              <g>
                <rect x="75" y="145" width="90" height="22" rx="5" fill="#000000" opacity="0.5" stroke="#334155" strokeWidth="0.5" />
                <text x="120" y="160" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
                  {(club?.short_name || club?.name || 'NERVA').toUpperCase()}
                </text>
              </g>
            </svg>

            <span className="text-[11px] font-bold text-slate-300 mt-1">
              {club?.name} · Temporada Oficial 2026/27
            </span>
          </div>

          {/* Color Palettes & Custom Hex */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
                <span>Color Principal (Base)</span>
                <span className="font-mono text-emerald-400 text-[11px]">{primaryColor}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {['#10b981', '#1e40af', '#dc2626', '#f59e0b', '#0284c7', '#7c3aed', '#111827', '#ffffff', '#e11d48'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      className={`w-7 h-7 rounded-lg shrink-0 border-2 transition ${primaryColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
                <span>Color Secundario (Rayas / Contrastes)</span>
                <span className="font-mono text-slate-400 text-[11px]">{secondaryColor}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {['#ffffff', '#0f172a', '#fbbf24', '#38bdf8', '#f87171', '#34d399', '#a855f7', '#fb7185'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSecondaryColor(c)}
                      className={`w-7 h-7 rounded-lg shrink-0 border-2 transition ${secondaryColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Expanded Pattern Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Estilo de Diseño / Patrón (10 Diseños Profesionales)
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
                  { id: 'gradient', label: 'Degradado Atlético' },
                ].map(pat => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => setKitPattern(pat.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      kitPattern === pat.id
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {pat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Collar Type */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Tipo de Cuello
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCollarType('round')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    collarType === 'round'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Cuello Redondo
                </button>
                <button
                  type="button"
                  onClick={() => setCollarType('v-neck')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    collarType === 'v-neck'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Cuello en V
                </button>
                <button
                  type="button"
                  onClick={() => setCollarType('polo')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    collarType === 'polo'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Cuello Polo
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveKit}
              disabled={isSavingKit}
              className="mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSavingKit ? 'Guardando...' : 'Aplicar Equipación al Club'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Player Detail Bottom Sheet / Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0">
          <div className="w-full max-w-md bg-[#121826] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/50 p-0.5 shrink-0">
                  <img src={selectedPlayer.avatar_url} alt={selectedPlayer.last_name} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {selectedPlayer.first_name} {selectedPlayer.last_name}
                    </h3>
                    <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {selectedPlayer.position}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedPlayer.nationality} · {selectedPlayer.age} años · Salario: {selectedPlayer.salary.toLocaleString()}/sem
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Valoración OVR</span>
                <span className="text-xl font-black text-emerald-400 tabular-nums">{selectedPlayer.rating}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Potencial MÁX</span>
                <span className="text-xl font-black text-amber-400 tabular-nums">{selectedPlayer.potential}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">PAC (Velocidad)</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedPlayer.stats.pace}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">SHO (Tiro)</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedPlayer.stats.shooting}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">PAS (Pase)</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedPlayer.stats.passing}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">DRI (Regate)</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedPlayer.stats.dribbling}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">DEF (Defensa)</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedPlayer.stats.defense}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">PHY (Físico)</span>
                <span className="text-sm font-bold text-white tabular-nums">{selectedPlayer.stats.physical}</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleStarter(selectedPlayer)}
              className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition touch-press ${
                selectedPlayer.is_starter
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {selectedPlayer.is_starter ? 'Enviar al Banquillo' : 'Alinear en el Once Titular'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Club Modal (Basic & Premium Advanced) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Editar Club</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Edition */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-300">
                Nombre del Club
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-xs font-semibold text-slate-300">
                Descripción del Club
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-xs font-semibold text-slate-300">
                Formación Táctica
                <select
                  value={editFormation}
                  onChange={(e) => setEditFormation(e.target.value as any)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="4-3-3">4-3-3 (Equilibrado)</option>
                  <option value="4-4-2">4-4-2 (Clásico)</option>
                  <option value="3-5-2">3-5-2 (Dominio del mediocampo)</option>
                  <option value="4-2-3-1">4-2-3-1 (Ofensivo)</option>
                </select>
              </label>
            </div>

            {/* Advanced Edition */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Personalización Avanzada VIP
                </span>
                {!user?.premium_active && (
                  <button
                    onClick={onOpenPremium}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  >
                    Activar VIP
                  </button>
                )}
              </div>

              <label className="text-xs font-semibold text-slate-400">
                URL del Escudo (Independiente)
                <input
                  type="text"
                  value={editCrestUrl}
                  disabled={!user?.premium_active && user?.role === 'user'}
                  onChange={(e) => setEditCrestUrl(e.target.value)}
                  placeholder="https://... / escudo.png"
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white disabled:opacity-50"
                />
              </label>

              <label className="text-xs font-semibold text-slate-400">
                URL del Banner (Independiente)
                <input
                  type="text"
                  value={editBannerUrl}
                  disabled={!user?.premium_active && user?.role === 'user'}
                  onChange={(e) => setEditBannerUrl(e.target.value)}
                  placeholder="https://... / banner.jpg"
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white disabled:opacity-50"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClub}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
