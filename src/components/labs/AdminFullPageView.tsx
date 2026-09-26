import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { 
  Profile, Club, Player, League, Trophy, Sponsor, AppSettings, BackgroundTrack 
} from '../../types/index.ts';
import { 
  Terminal, Shield, Users, Trophy as TrophyIcon, Sparkles, 
  Trash2, Edit, Plus, Upload, Link as LinkIcon, Save, RefreshCw, 
  ArrowLeft, Search, Music, Gift, Settings, CheckCircle2, AlertTriangle, Play, Pause, Flame
} from 'lucide-react';

interface AdminFullPageViewProps {
  onBackToApp: () => void;
}

export const AdminFullPageView: React.FC<AdminFullPageViewProps> = ({ onBackToApp }) => {
  const { user, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'clubs' | 'players' | 'users' | 'leagues' | 'sponsors' | 'trophies' | 'audio' | 'codes' | 'config'
  >('clubs');

  // Data lists
  const [clubs, setClubs] = useState<Club[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [tracks, setTracks] = useState<BackgroundTrack[]>([]);
  const [codes, setCodes] = useState<{ reward_codes: any[]; premium_codes: any[] }>({ reward_codes: [], premium_codes: [] });
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const [loading, setLoading] = useState(true);

  // Search Filters
  const [clubSearch, setClubSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Editing Club State
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  // AI Player Image Generation State
  const [generatingPlayerId, setGeneratingPlayerId] = useState<string | null>(null);

  // New Code Form
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeType, setNewCodeType] = useState<'coins' | 'premium'>('coins');
  const [newCodeVal, setNewCodeVal] = useState(250000);
  const [newCodeDays, setNewCodeDays] = useState(7);

  // Audio Upload from Device
  const [audioTitle, setAudioTitle] = useState('');
  const [audioArtist, setAudioArtist] = useState('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Load All Admin Data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cRes, uRes, lRes, sRes, tRes, trkRes, cdRes, cfgRes] = await Promise.all([
        api.getAdminClubs().catch(() => ({ clubs: [] })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getLeagues().catch(() => ({ leagues: [] })),
        api.getAdminSponsors().catch(() => ({ sponsors: [] })),
        api.getTrophies().catch(() => ({ trophies: [] })),
        api.getAudioTracks().catch(() => ({ tracks: [] })),
        api.getAdminCodes().catch(() => ({ reward_codes: [], premium_codes: [] })),
        api.getAppSettings().catch(() => ({ settings: null })),
      ]);

      if (cRes.clubs) setClubs(cRes.clubs);
      if (uRes.users) setUsersList(uRes.users);
      if (lRes.leagues) setLeagues(lRes.leagues);
      if (sRes.sponsors) setSponsors(sRes.sponsors);
      if (tRes.trophies) setTrophies(tRes.trophies);
      if (trkRes.tracks) setTracks(trkRes.tracks);
      if (cdRes) setCodes(cdRes);
      if (cfgRes.settings) setAppSettings(cfgRes.settings);

      const pRes = await fetch('/api/players');
      const pData = await pRes.json();
      setPlayers(pData.players || []);
    } catch (err) {
      console.error('Error loading full admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // -------------------------------------------------------------
  // DELETE HANDLERS (FIXED: Never use blocking confirm())
  // -------------------------------------------------------------
  const handleDeleteClub = async (id: string, name: string) => {
    try {
      await api.deleteAdminClub(id);
      showToast(`Club "${name}" eliminado correctamente`, 'info');
      setClubs(prev => prev.filter(c => c.id !== id));
      if (editingClub?.id === id) setEditingClub(null);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar club', 'error');
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    try {
      await api.deleteAdminPlayer(id);
      showToast(`Jugador "${name}" eliminado de la base de datos`, 'info');
      setPlayers(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar jugador', 'error');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    try {
      await api.deleteAdminUser(id);
      showToast(`Usuario @${username} eliminado`, 'info');
      setUsersList(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar usuario', 'error');
    }
  };

  const handleDeleteLeague = async (id: string) => {
    try {
      await api.deleteAdminLeague(id);
      showToast('Liga eliminada del sistema', 'info');
      setLeagues(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar liga', 'error');
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    try {
      await api.deleteAdminSponsor(id);
      showToast('Patrocinador eliminado', 'info');
      setSponsors(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar patrocinador', 'error');
    }
  };

  const handleDeleteTrophy = async (id: string) => {
    try {
      await api.deleteAdminTrophy(id);
      showToast('Trofeo eliminado', 'info');
      setTrophies(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar trofeo', 'error');
    }
  };

  const handleDeleteTrack = async (id: string) => {
    try {
      await api.adminDelete('track', id);
      showToast('Pista de música eliminada', 'info');
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar pista', 'error');
    }
  };

  const handleDeleteCode = async (id: string) => {
    try {
      await api.deleteAdminCode(id);
      showToast('Código eliminado del sistema', 'info');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar código', 'error');
    }
  };

  // -------------------------------------------------------------
  // AI PLAYER IMAGE GENERATION
  // -------------------------------------------------------------
  const handleGeneratePlayerAI = async (player: Player) => {
    setGeneratingPlayerId(player.id);
    try {
      const res = await api.adminGeneratePlayerImage(player.id, player.position, player.nationality);
      showToast(`¡Rostro hiperrealista generado con IA para ${player.first_name}!`, 'success');
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, avatar_url: res.imageUrl } : p));
    } catch (err: any) {
      showToast(err.message || 'Error en generación de imagen con IA', 'error');
    } finally {
      setGeneratingPlayerId(null);
    }
  };

  // -------------------------------------------------------------
  // SAVE CLUB EDITS
  // -------------------------------------------------------------
  const handleSaveClub = async () => {
    if (!editingClub) return;
    try {
      await api.updateAdminClub(editingClub.id, {
        name: editingClub.name,
        crest_url: editingClub.crest_url,
        stadium_level: editingClub.stadium_level,
        reputation: editingClub.reputation,
        fans: editingClub.fans,
        budget: editingClub.budget,
        formation: editingClub.formation
      });
      showToast(`Club "${editingClub.name}" actualizado con éxito`, 'success');
      setClubs(prev => prev.map(c => c.id === editingClub.id ? editingClub : c));
      setEditingClub(null);
    } catch (err: any) {
      showToast(err.message || 'Error actualizando club', 'error');
    }
  };

  // -------------------------------------------------------------
  // AUDIO UPLOAD FROM DEVICE
  // -------------------------------------------------------------
  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBase64) {
      showToast('Selecciona un archivo de audio', 'error');
      return;
    }
    setUploadingAudio(true);
    try {
      await api.uploadAudio({
        title: audioTitle.trim() || audioFileName.replace(/\.[^/.]+$/, ""),
        artist: audioArtist.trim() || 'NERVA Sound Studio',
        dataUrl: audioBase64
      });
      showToast('¡Nueva pista de audio guardada en el servidor y activada!', 'success');
      setAudioTitle('');
      setAudioArtist('');
      setAudioBase64(null);
      setAudioFileName('');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Error al subir pista de audio', 'error');
    } finally {
      setUploadingAudio(false);
    }
  };

  // -------------------------------------------------------------
  // CODE GENERATOR
  // -------------------------------------------------------------
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) {
      showToast('Ingresa el código', 'error');
      return;
    }
    try {
      await api.createAdminCode({
        code: newCodeName.trim(),
        type: newCodeType,
        reward_value: newCodeVal,
        duration_days: newCodeDays
      });
      showToast(`Código ${newCodeName.toUpperCase()} activado en base de datos`, 'success');
      setNewCodeName('');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Error creando código', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Root Bar */}
      <header className="sticky top-0 z-50 bg-[#0c121e]/95 backdrop-blur-md border-b border-amber-500/30 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition touch-press"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Volver a NERVA App</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>ROOT ADMIN CONSOLE</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    /directorioraizdenuestraygrandisimaownerv2
                  </span>
                </h1>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Plataforma completa de edición deportiva, finanzas, jugadores con IA y bases de datos
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 uppercase tracking-wide">
              {user?.role.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Responsive Body */}
      <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1 flex flex-col gap-5">
        {/* Navigation Tabs Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
          {[
            { id: 'clubs', label: '🛡️ Clubes & Estadios' },
            { id: 'players', label: '⚽ Jugadores & IA' },
            { id: 'users', label: '👥 Usuarios & Cuentas' },
            { id: 'leagues', label: '🏆 Ligas' },
            { id: 'sponsors', label: '💼 Sponsors' },
            { id: 'trophies', label: '🥇 Trofeos' },
            { id: 'audio', label: '🎵 Música' },
            { id: 'codes', label: '🎁 Códigos' },
            { id: 'config', label: '⚙️ Configuración' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#121826] text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: CLUBES & ESTADIOS                                      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'clubs' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Gestión Directa de Clubes ({clubs.length})</h2>
                <p className="text-xs text-slate-400">Edita estadio (0 a 10 Monumental), fans (hasta 8B), reputación y escudo</p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  placeholder="Buscar club..."
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Club Editor Modal / Card if selected */}
            {editingClub && (
              <div className="p-4 rounded-3xl bg-[#141c2e] border-2 border-amber-500/40 shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editando Club: {editingClub.name}
                  </h3>
                  <button
                    onClick={() => setEditingClub(null)}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Nombre Oficial</label>
                    <input
                      type="text"
                      value={editingClub.name}
                      onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Nivel de Estadio (0 a 10 Monumental)
                    </label>
                    <select
                      value={editingClub.stadium_level || 0}
                      onChange={(e) => setEditingClub({ ...editingClub, stadium_level: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-bold text-amber-300"
                    >
                      <option value={0}>Nivel 0: Cancha Municipal (1 Sponsor)</option>
                      <option value={1}>Nivel 1: Graderío Básico (2 Sponsors)</option>
                      <option value={2}>Nivel 2: Estadio Regional (3 Sponsors)</option>
                      <option value={3}>Nivel 3: Arena Comunitaria (4 Sponsors)</option>
                      <option value={4}>Nivel 4: Metropolitano (5 Sponsors)</option>
                      <option value={5}>Nivel 5: Parque Deportivo (7 Sponsors)</option>
                      <option value={6}>Nivel 6: Olímpico (9 Sponsors)</option>
                      <option value={7}>Nivel 7: Catedral del Fútbol (12 Sponsors)</option>
                      <option value={8}>Nivel 8: Gran Coliseo (15 Sponsors)</option>
                      <option value={9}>Nivel 9: Superdomo (17 Sponsors)</option>
                      <option value={10}>Nivel 10: MONUMENTAL (20 Sponsors)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Reputación Deportiva (pts)
                    </label>
                    <input
                      type="number"
                      value={editingClub.reputation || 1000}
                      onChange={(e) => setEditingClub({ ...editingClub, reputation: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-bold text-amber-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Seguidores / Fans (Máx 8 Billones)
                    </label>
                    <input
                      type="number"
                      max={8000000000}
                      value={editingClub.fans || 5000}
                      onChange={(e) => setEditingClub({ ...editingClub, fans: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Presupuesto (€)</label>
                    <input
                      type="number"
                      value={editingClub.budget || 50000}
                      onChange={(e) => setEditingClub({ ...editingClub, budget: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">URL Escudo</label>
                    <input
                      type="text"
                      value={editingClub.crest_url}
                      onChange={(e) => setEditingClub({ ...editingClub, crest_url: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setEditingClub(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveClub}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            )}

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {clubs
                .filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase()))
                .map((c) => (
                  <div key={c.id} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={c.crest_url || '/src/assets/images/crest_titan_fc_1790393819091.jpg'} alt={c.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <h4 className="text-xs font-black text-white">{c.name}</h4>
                          <span className="text-[10px] text-slate-400">Nivel {c.stadium_level || 0} ({c.stadium_name || 'Cancha'})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingClub(c)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClub(c.id, c.name)}
                          className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-slate-900/60 p-2 rounded-xl">
                      <div>
                        <span className="text-slate-500 block">Reputación</span>
                        <span className="font-bold text-amber-400">{c.reputation || 1000} pts</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Fans</span>
                        <span className="font-bold text-emerald-400">{(c.fans || 5000).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Presupuesto</span>
                        <span className="font-bold text-white">{(c.budget / 1000).toFixed(0)}k €</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: JUGADORES & GENERACIÓN CON IA                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'players' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Editor de Jugadores & Generador IA ({players.length})</h2>
                <p className="text-xs text-slate-400">Genera rostros de futbolistas hiperrealistas con IA y asigna directamente a la base de datos</p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Buscar por nombre, posición o club..."
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {players
                .filter(p => `${p.first_name} ${p.last_name} ${p.position} ${p.club_name}`.toLowerCase().includes(playerSearch.toLowerCase()))
                .map((p) => {
                  const isGenerating = generatingPlayerId === p.id;
                  return (
                    <div key={p.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.avatar_url}
                            alt={`${p.first_name} ${p.last_name}`}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md"
                          />
                          <div>
                            <h4 className="text-xs font-black text-white truncate">
                              {p.first_name} {p.last_name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                {p.position}
                              </span>
                              <span className="text-[10px] text-slate-400">OVR {p.rating} · Pot {p.potential}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 block">{p.club_name || 'Agente Libre'}</span>
                          </div>
                        </div>

                        {/* Working Delete Button */}
                        <button
                          onClick={() => handleDeletePlayer(p.id, `${p.first_name} ${p.last_name}`)}
                          className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                          title="Eliminar de la base de datos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* AI Generator Button */}
                      <button
                        onClick={() => handleGeneratePlayerAI(p)}
                        disabled={isGenerating}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-purple-400' : ''}`} />
                        <span>{isGenerating ? 'Generando Rostro con IA...' : 'Generar Rostro con IA'}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: USUARIOS & CUENTAS                                     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Cuentas de Usuarios ({usersList.length})</h2>
                <p className="text-xs text-slate-400">Modifica roles (Owner/Admin/User), asigna monedas o elimina usuarios</p>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar usuario o ID..."
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="divide-y divide-slate-800 bg-[#121826] rounded-3xl border border-slate-800 overflow-hidden">
              {usersList
                .filter(u => `${u.username} ${u.display_name}`.toLowerCase().includes(userSearch.toLowerCase()))
                .map((u) => (
                  <div key={u.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url} alt={u.display_name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{u.display_name}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            @{u.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="text-emerald-400 font-bold">{u.coins.toLocaleString()} Monedas</span>
                          <span>·</span>
                          <span>Estado: {u.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          await api.updateUserRole(u.id, { role: newRole });
                          showToast(`Rol de @${u.username} cambiado a ${newRole}`, 'success');
                          setUsersList(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole as any } : x));
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                      >
                        <option value="user">USER</option>
                        <option value="moderator">MODERATOR</option>
                        <option value="admin">ADMIN</option>
                        <option value="owner">OWNER</option>
                      </select>

                      <button
                        onClick={async () => {
                          const add = 200000;
                          await api.updateUserRole(u.id, { coins: u.coins + add });
                          showToast(`+200.000 monedas añadidas a @${u.username}`, 'success');
                          setUsersList(prev => prev.map(x => x.id === u.id ? { ...x, coins: x.coins + add } : x));
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                      >
                        +200k €
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                        title="Eliminar usuario de la base de datos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: MÚSICA DE FONDO (SUBIDA DESDE DISPOSITIVO O URL)        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-black text-white">Música de Fondo Oficial & Pistas de Audio ({tracks.length})</h2>
              <p className="text-xs text-slate-400">Sube pistas de audio directamente desde tu dispositivo (.mp3, .wav, .ogg) para reproducirse en la web</p>
            </div>

            {/* Audio Upload Form */}
            <form onSubmit={handleUploadAudio} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Subir Pista desde Dispositivo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                  placeholder="Título de la pista (ej. UEFA Champions Beat)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={audioArtist}
                  onChange={(e) => setAudioArtist(e.target.value)}
                  placeholder="Artista (ej. Hans Zimmer / Nerva Sound)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer text-xs text-amber-200">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{audioFileName || 'Seleccionar archivo de audio desde tu computadora/teléfono'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFile}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={uploadingAudio || !audioBase64}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{uploadingAudio ? 'Subiendo archivo...' : 'Guardar y Publicar en NERVA Web'}</span>
              </button>
            </form>

            {/* Existing Tracks List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tracks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-black text-white block truncate">{t.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{t.artist}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                      t.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {t.is_active ? 'ACTIVA POR DEFECTO' : 'SECUNDARIA'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await api.activateAudioTrack(t.id);
                        showToast(`Pista "${t.title}" activada como principal`, 'success');
                        loadAllData();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
                    >
                      Activar
                    </button>
                    <button
                      onClick={() => handleDeleteTrack(t.id)}
                      className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: CÓDIGOS DE RECOMPENSA                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'codes' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-black text-white">Generador y Editor de Códigos</h2>
              <p className="text-xs text-slate-400">Crea códigos de monedas o VIP con validación en servidor</p>
            </div>

            <form onSubmit={handleCreateCode} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Nuevo Código Promocional
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  placeholder="Código (ej. PROMO2026)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                />

                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="coins">Monedas (€)</option>
                  <option value="premium">Pase VIP / Premium</option>
                </select>

                <input
                  type="number"
                  value={newCodeVal}
                  onChange={(e) => setNewCodeVal(Number(e.target.value))}
                  placeholder="Monedas de recompensa"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />

                <button
                  type="submit"
                  className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
                >
                  Activar Código
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {codes.reward_codes.map((c) => (
                <div key={c.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-black text-emerald-400 block">{c.code}</span>
                    <span className="text-[10px] text-slate-400">{c.reward_value.toLocaleString()} Monedas · {c.uses_count || 0} canjes</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCode(c.id)}
                    className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OTHER TABS: LEAGUES, SPONSORS, TROPHIES                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'sponsors' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-black text-white">Patrocinadores Oficiales ({sponsors.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sponsors.map((s) => (
                <div key={s.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={s.icon_url} alt={s.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                    <div>
                      <h4 className="text-xs font-black text-white">{s.name}</h4>
                      <span className="text-[10px] text-slate-400">Firma: +{s.signing_bonus.toLocaleString()} €</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSponsor(s.id)}
                    className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trophies' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-black text-white">Vitrina de Trofeos ({trophies.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {trophies.map((t) => (
                <div key={t.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{t.icon || '🏆'}</span>
                    <div>
                      <h4 className="text-xs font-black text-white">{t.name || t.title}</h4>
                      <span className="text-[10px] text-slate-400">{t.season || '2026/2027'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrophy(t.id)}
                    className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leagues' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-black text-white">Ligas & Competiciones ({leagues.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leagues.map((l) => (
                <div key={l.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">{l.title}</h4>
                    <span className="text-[10px] text-emerald-400">División Nivel {l.tier}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLeague(l.id)}
                    className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 flex flex-col gap-3 max-w-lg">
            <h2 className="text-base font-black text-white">Configuración del Servidor</h2>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Nombre de la Aplicación</label>
              <input
                type="text"
                value={appSettings?.app_name || 'NERVA Football Manager'}
                onChange={(e) => setAppSettings(appSettings ? { ...appSettings, app_name: e.target.value } : null)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Favicon URL</label>
              <input
                type="text"
                value={appSettings?.favicon_url || '/icon.svg'}
                onChange={(e) => setAppSettings(appSettings ? { ...appSettings, favicon_url: e.target.value } : null)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
              />
            </div>
            <button
              onClick={async () => {
                if (appSettings) {
                  await api.updateAppSettings(appSettings);
                  showToast('Ajustes del sistema actualizados', 'success');
                }
              }}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider mt-2"
            >
              Guardar Configuración
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
