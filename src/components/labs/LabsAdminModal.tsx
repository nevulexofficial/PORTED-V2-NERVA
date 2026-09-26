import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Profile, Player, League, Trophy, AppSettings, Sponsor } from '../../types/index.ts';
import { 
  X, Terminal, Users, Shield, UserPlus, Trophy as TrophyIcon, 
  Gift, Settings, Trash2, Edit2, Plus, Search, CheckCircle2, 
  AlertTriangle, DollarSign, Award, Layers, Sparkles, Sliders
} from 'lucide-react';

interface LabsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabsAdminModal: React.FC<LabsAdminModalProps> = ({ isOpen, onClose }) => {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'players' | 'leagues' | 'trophies' | 'sponsors' | 'codes' | 'config'>('dashboard');
  
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [leaguesList, setLeaguesList] = useState<League[]>([]);
  const [trophiesList, setTrophiesList] = useState<Trophy[]>([]);
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>([]);
  const [codesList, setCodesList] = useState<{ reward_codes: any[]; premium_codes: any[] }>({ reward_codes: [], premium_codes: [] });
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Search
  const [userSearch, setUserSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  // 1. Advanced Player Creator Form
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerLast, setNewPlayerLast] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState<string>('DC');
  const [newPlayerAge, setNewPlayerAge] = useState<number>(22);
  const [newPlayerNat, setNewPlayerNat] = useState<string>('España');
  const [newPlayerRating, setNewPlayerRating] = useState<number>(84);
  const [newPlayerPotential, setNewPlayerPotential] = useState<number>(90);
  const [newPlayerPrice, setNewPlayerPrice] = useState<number>(3500000);
  const [newPlayerSalary, setNewPlayerSalary] = useState<number>(45000);
  const [newPlayerAvatar, setNewPlayerAvatar] = useState<string>('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80');
  const [newPlayerStats, setNewPlayerStats] = useState({
    pace: 85,
    shooting: 83,
    passing: 78,
    dribbling: 84,
    defense: 45,
    physical: 76
  });

  // 2. League Creator Form
  const [isLeagueFormOpen, setIsLeagueFormOpen] = useState(false);
  const [leagueTitle, setLeagueTitle] = useState('');
  const [leagueDesc, setLeagueDesc] = useState('');
  const [leagueTier, setLeagueTier] = useState<number>(1);
  const [leagueLogo, setLeagueLogo] = useState('');
  const [leagueBanner, setLeagueBanner] = useState('');

  // 3. Trophy Creator Form
  const [isTrophyFormOpen, setIsTrophyFormOpen] = useState(false);
  const [trophyName, setTrophyName] = useState('');
  const [trophyDesc, setTrophyDesc] = useState('');
  const [trophyIcon, setTrophyIcon] = useState('🏆');
  const [trophyTier, setTrophyTier] = useState<number>(1);
  const [trophySeason, setTrophySeason] = useState('2026/2027');

  // 4. Sponsor Creator Form
  const [isSponsorFormOpen, setIsSponsorFormOpen] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorCat, setSponsorCat] = useState('Aerolíneas & Aviación');
  const [sponsorIcon, setSponsorIcon] = useState('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80');
  const [sponsorSignBonus, setSponsorSignBonus] = useState<number>(350000);
  const [sponsorMatchBonus, setSponsorMatchBonus] = useState<number>(45000);
  const [sponsorReqTier, setSponsorReqTier] = useState<number>(1);
  const [sponsorDesc, setSponsorDesc] = useState('');

  // 5. Code generator form
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeType, setNewCodeType] = useState<'coins' | 'premium'>('coins');
  const [newCodeVal, setNewCodeVal] = useState<number>(100000);
  const [newCodeDays, setNewCodeDays] = useState<number>(7);

  // 6. Config form
  const [cfgName, setCfgName] = useState('');
  const [cfgFavicon, setCfgFavicon] = useState('');
  const [cfgMaintenance, setCfgMaintenance] = useState(false);

  const loadData = async () => {
    try {
      const [mRes, uRes, lRes, sRes, tRes, spnRes, cRes] = await Promise.all([
        api.getAdminMetrics().catch(() => ({ metrics: null })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getLeagues().catch(() => ({ leagues: [] })),
        api.getAppSettings().catch(() => ({ settings: null })),
        api.getTrophies().catch(() => ({ trophies: [] })),
        api.getAdminSponsors().catch(() => ({ sponsors: [] })),
        api.getAdminCodes().catch(() => ({ reward_codes: [], premium_codes: [] }))
      ]);

      if (mRes.metrics) setMetrics(mRes.metrics);
      if (uRes.users) setUsersList(uRes.users);
      if (lRes.leagues) setLeaguesList(lRes.leagues);
      if (tRes.trophies) setTrophiesList(tRes.trophies);
      if (spnRes.sponsors) setSponsorsList(spnRes.sponsors);
      if (cRes) setCodesList(cRes);

      if (sRes.settings) {
        setAppSettings(sRes.settings);
        setCfgName(sRes.settings.app_name);
        setCfgFavicon(sRes.settings.favicon_url);
        setCfgMaintenance(sRes.settings.maintenance_mode);
      }

      const allPlayersRes = await fetch('/api/players');
      const pData = await allPlayersRes.json();
      setPlayersList(pData.players || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Security check: Only Admin & Owner
  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return null;
  }

  const handleUpdateRole = async (targetUser: Profile, newRole: string) => {
    if (newRole === 'owner' && user.role !== 'owner') {
      showToast('Solo el Owner puede nombrar a otro Owner', 'error');
      return;
    }
    try {
      await api.updateUserRole(targetUser.id, { role: newRole });
      showToast(`Rol de ${targetUser.display_name} actualizado a ${newRole}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar rol', 'error');
    }
  };

  const handleAdjustCoins = async (targetUser: Profile, amount: number) => {
    try {
      await api.updateUserRole(targetUser.id, { coins: Math.max(0, targetUser.coins + amount) });
      showToast(`Monedas de ${targetUser.display_name} ajustadas`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create Advanced Player
  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerLast.trim()) {
      showToast('Nombre y apellido requeridos', 'error');
      return;
    }
    try {
      await api.createAdminPlayer({
        first_name: newPlayerName.trim(),
        last_name: newPlayerLast.trim(),
        age: newPlayerAge,
        nationality: newPlayerNat,
        position: newPlayerPos,
        rating: newPlayerRating,
        potential: newPlayerPotential,
        price: newPlayerPrice,
        salary: newPlayerSalary,
        avatar_url: newPlayerAvatar,
        stats: newPlayerStats
      });
      showToast(`Jugador ${newPlayerName} ${newPlayerLast} creado con estadísticas avanzadas`, 'success');
      setIsPlayerFormOpen(false);
      setNewPlayerName('');
      setNewPlayerLast('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creando jugador', 'error');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('¿Eliminar jugador de la base de datos?')) return;
    try {
      await api.deleteAdminPlayer(id);
      showToast('Jugador eliminado', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create League
  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueTitle.trim()) {
      showToast('Título de la liga requerido', 'error');
      return;
    }
    try {
      await api.createAdminLeague({
        title: leagueTitle.trim(),
        description: leagueDesc.trim() || 'Campeonato oficial de la liga',
        tier: leagueTier,
        logo_url: leagueLogo || '/src/assets/images/nerva_brand_logo_1790393799448.jpg',
        banner_url: leagueBanner || '/src/assets/images/stadium_banner_pitch_1790393808701.jpg'
      });
      showToast(`Liga "${leagueTitle}" creada exitosamente`, 'success');
      setIsLeagueFormOpen(false);
      setLeagueTitle('');
      setLeagueDesc('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creando liga', 'error');
    }
  };

  const handleDeleteLeague = async (id: string) => {
    if (!confirm('¿Eliminar esta liga?')) return;
    try {
      await api.deleteAdminLeague(id);
      showToast('Liga eliminada', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create Trophy
  const handleCreateTrophy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trophyName.trim()) {
      showToast('Nombre del trofeo requerido', 'error');
      return;
    }
    try {
      await api.createAdminTrophy({
        name: trophyName.trim(),
        description: trophyDesc.trim() || 'Trofeo oficial otorgado por mérito deportivo',
        icon: trophyIcon,
        tier: trophyTier,
        season: trophySeason
      });
      showToast(`Trofeo "${trophyName}" creado y agregado a vitrina`, 'success');
      setIsTrophyFormOpen(false);
      setTrophyName('');
      setTrophyDesc('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creando trofeo', 'error');
    }
  };

  const handleDeleteTrophy = async (id: string) => {
    if (!confirm('¿Eliminar trofeo?')) return;
    try {
      await api.deleteAdminTrophy(id);
      showToast('Trofeo eliminado', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create Sponsor
  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim()) {
      showToast('Nombre de patrocinador requerido', 'error');
      return;
    }
    try {
      await api.createAdminSponsor({
        name: sponsorName.trim(),
        category: sponsorCat,
        icon_url: sponsorIcon,
        signing_bonus: sponsorSignBonus,
        match_bonus: sponsorMatchBonus,
        requirement_tier: sponsorReqTier,
        description: sponsorDesc.trim() || `Contrato oficial con ${sponsorName}`
      });
      showToast(`Patrocinador "${sponsorName}" creado con éxito`, 'success');
      setIsSponsorFormOpen(false);
      setSponsorName('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creando sponsor', 'error');
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('¿Eliminar este patrocinador?')) return;
    try {
      await api.deleteAdminSponsor(id);
      showToast('Patrocinador eliminado', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create Code (Coins or Premium)
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) {
      showToast('Código requerido', 'error');
      return;
    }
    try {
      await api.createAdminCode({
        code: newCodeName.trim(),
        type: newCodeType,
        reward_value: newCodeVal,
        duration_days: newCodeDays
      });
      showToast(`Código ${newCodeName.toUpperCase()} activado en el sistema`, 'success');
      setNewCodeName('');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCode = async (id: string) => {
    try {
      await api.deleteAdminCode(id);
      showToast('Código desactivado y eliminado', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAppSettings({
        app_name: cfgName,
        favicon_url: cfgFavicon,
        maintenance_mode: cfgMaintenance
      });
      if (cfgFavicon) {
        const link = document.getElementById('app-favicon') as HTMLLinkElement;
        if (link) link.href = cfgFavicon;
      }
      showToast('Configuración del sistema y favicon actualizados', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-lg bg-[#0e1422] border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 max-h-[95vh] overflow-y-auto">
        {/* Labs Title Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                NERVA Labs
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {user.role.toUpperCase()}
                </span>
              </h2>
              <span className="text-[10px] text-slate-400">Consola Maestra de Gestión & Reglas</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/80">
          {[
            { id: 'dashboard', label: 'Métricas' },
            { id: 'users', label: 'Usuarios' },
            { id: 'players', label: 'Editor Jugadores' },
            { id: 'leagues', label: 'Ligas' },
            { id: 'trophies', label: 'Trofeos' },
            { id: 'sponsors', label: 'Sponsors' },
            { id: 'codes', label: 'Códigos' },
            { id: 'config', label: 'Ajustes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && metrics && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Usuarios Registrados</span>
                <span className="text-xl font-black text-white block tabular-nums">{metrics.users_count}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Clubes Fundados</span>
                <span className="text-xl font-black text-emerald-400 block tabular-nums">{metrics.clubs_count}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Jugadores</span>
                <span className="text-xl font-black text-teal-400 block tabular-nums">{metrics.players_count}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Suscripciones VIP</span>
                <span className="text-xl font-black text-amber-400 block tabular-nums">{metrics.active_premium_count}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-2">Auditoría en Tiempo Real</span>
              <div className="flex flex-col gap-1.5 text-[10px] text-slate-400">
                {metrics.recent_actions?.length > 0 ? (
                  metrics.recent_actions.map((act: any) => (
                    <div key={act.id} className="flex justify-between border-b border-slate-800/40 pb-1">
                      <span className="text-emerald-400 font-mono">@{act.admin_username}</span>
                      <span className="truncate max-w-[220px]">{act.details}</span>
                    </div>
                  ))
                ) : (
                  <p>Sin acciones administrativas recientes registradas.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Users Tab */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuario o username..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {usersList
                .filter(u => `${u.username} ${u.display_name}`.toLowerCase().includes(userSearch.toLowerCase()))
                .map((target) => (
                  <div key={target.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{target.display_name}</h4>
                        <p className="text-[10px] text-slate-400">@{target.username} · {target.coins.toLocaleString()} monedas</p>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {target.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-slate-400">Monedas:</span>
                        <button
                          onClick={() => handleAdjustCoins(target, 100000)}
                          className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded hover:bg-emerald-900 font-bold"
                        >
                          +100K
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={target.role}
                          onChange={(e) => handleUpdateRole(target, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                          {user.role === 'owner' && <option value="owner">Owner</option>}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 3. Advanced Player Creator Tab */}
        {activeTab === 'players' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsPlayerFormOpen(!isPlayerFormOpen)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isPlayerFormOpen ? 'Cerrar Editor' : 'Crear Jugador (Editor Avanzado)'}</span>
            </button>

            {isPlayerFormOpen && (
              <form onSubmit={handleCreatePlayer} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 text-xs font-bold text-emerald-400">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Editor de Atributos & Ficha Técnica</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Nombre (ej. Kylian)"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newPlayerLast}
                    onChange={(e) => setNewPlayerLast(e.target.value)}
                    placeholder="Apellido (ej. Mbappé)"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Posición</label>
                    <select
                      value={newPlayerPos}
                      onChange={(e) => setNewPlayerPos(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    >
                      {['POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'].map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Edad</label>
                    <input
                      type="number"
                      value={newPlayerAge}
                      onChange={(e) => setNewPlayerAge(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Nacionalidad</label>
                    <input
                      type="text"
                      value={newPlayerNat}
                      onChange={(e) => setNewPlayerNat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Valoración Media (OVR)</label>
                    <input
                      type="number"
                      min="40"
                      max="99"
                      value={newPlayerRating}
                      onChange={(e) => setNewPlayerRating(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Potencial Máximo</label>
                    <input
                      type="number"
                      min="40"
                      max="99"
                      value={newPlayerPotential}
                      onChange={(e) => setNewPlayerPotential(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Precio Mercado (€)</label>
                    <input
                      type="number"
                      value={newPlayerPrice}
                      onChange={(e) => setNewPlayerPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Sueldo Semanal (€)</label>
                    <input
                      type="number"
                      value={newPlayerSalary}
                      onChange={(e) => setNewPlayerSalary(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Individual Stats Sliders */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Atributos de Rendimiento:</span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ritmo (PAC):</span>
                      <input 
                        type="number" min="30" max="99" 
                        value={newPlayerStats.pace} 
                        onChange={(e) => setNewPlayerStats({ ...newPlayerStats, pace: Number(e.target.value) })}
                        className="w-12 bg-slate-950 text-right px-1 py-0.5 rounded text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tiro (SHO):</span>
                      <input 
                        type="number" min="30" max="99" 
                        value={newPlayerStats.shooting} 
                        onChange={(e) => setNewPlayerStats({ ...newPlayerStats, shooting: Number(e.target.value) })}
                        className="w-12 bg-slate-950 text-right px-1 py-0.5 rounded text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pase (PAS):</span>
                      <input 
                        type="number" min="30" max="99" 
                        value={newPlayerStats.passing} 
                        onChange={(e) => setNewPlayerStats({ ...newPlayerStats, passing: Number(e.target.value) })}
                        className="w-12 bg-slate-950 text-right px-1 py-0.5 rounded text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Regate (DRI):</span>
                      <input 
                        type="number" min="30" max="99" 
                        value={newPlayerStats.dribbling} 
                        onChange={(e) => setNewPlayerStats({ ...newPlayerStats, dribbling: Number(e.target.value) })}
                        className="w-12 bg-slate-950 text-right px-1 py-0.5 rounded text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Defensa (DEF):</span>
                      <input 
                        type="number" min="30" max="99" 
                        value={newPlayerStats.defense} 
                        onChange={(e) => setNewPlayerStats({ ...newPlayerStats, defense: Number(e.target.value) })}
                        className="w-12 bg-slate-950 text-right px-1 py-0.5 rounded text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Físico (PHY):</span>
                      <input 
                        type="number" min="30" max="99" 
                        value={newPlayerStats.physical} 
                        onChange={(e) => setNewPlayerStats({ ...newPlayerStats, physical: Number(e.target.value) })}
                        className="w-12 bg-slate-950 text-right px-1 py-0.5 rounded text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="py-2.5 bg-emerald-600 rounded-xl text-xs font-bold text-white shadow-md shadow-emerald-600/30">
                  Guardar y Publicar Jugador
                </button>
              </form>
            )}

            {/* Players Search & List */}
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Buscar en la base de datos de jugadores..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />

            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {playersList
                .filter(p => `${p.first_name} ${p.last_name} ${p.position}`.toLowerCase().includes(playerSearch.toLowerCase()))
                .slice(0, 20)
                .map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {p.first_name} {p.last_name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black">
                          {p.position}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">OVR {p.rating} · Pot {p.potential} · {(p.price / 1000000).toFixed(1)}M €</span>
                    </div>
                    <button
                      onClick={() => handleDeletePlayer(p.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 4. Leagues Tab */}
        {activeTab === 'leagues' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsLeagueFormOpen(!isLeagueFormOpen)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isLeagueFormOpen ? 'Cerrar Formulario' : 'Crear Nueva Liga'}</span>
            </button>

            {isLeagueFormOpen && (
              <form onSubmit={handleCreateLeague} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
                <input
                  type="text"
                  value={leagueTitle}
                  onChange={(e) => setLeagueTitle(e.target.value)}
                  placeholder="Nombre de la Liga (ej. Premier NERVA, Liga Élite)"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={leagueDesc}
                  onChange={(e) => setLeagueDesc(e.target.value)}
                  placeholder="Descripción de la categoría"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Nivel de División (Tier)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={leagueTier}
                      onChange={(e) => setLeagueTier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Logo URL (Opcional)</label>
                    <input
                      type="text"
                      value={leagueLogo}
                      onChange={(e) => setLeagueLogo(e.target.value)}
                      placeholder="/logo.png"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <button type="submit" className="py-2 bg-emerald-600 rounded-lg text-xs font-bold text-white">
                  Registrar Liga en Calendario
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {leaguesList.map((leg) => (
                <div key={leg.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{leg.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        Tier {leg.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{leg.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteLeague(leg.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Trophies Tab */}
        {activeTab === 'trophies' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsTrophyFormOpen(!isTrophyFormOpen)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <TrophyIcon className="w-4 h-4" />
              <span>{isTrophyFormOpen ? 'Cerrar Formulario' : 'Crear Nuevo Trofeo'}</span>
            </button>

            {isTrophyFormOpen && (
              <form onSubmit={handleCreateTrophy} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={trophyName}
                      onChange={(e) => setTrophyName(e.target.value)}
                      placeholder="Nombre del Trofeo (ej. Copa de Campeones)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <select
                    value={trophyIcon}
                    onChange={(e) => setTrophyIcon(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="🏆">🏆 Copa Oro</option>
                    <option value="🥇">🥇 Medalla</option>
                    <option value="👑">👑 Corona</option>
                    <option value="🛡️">🛡️ Escudo</option>
                    <option value="⭐">⭐ Estrella</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={trophyDesc}
                  onChange={(e) => setTrophyDesc(e.target.value)}
                  placeholder="Descripción del mérito (ej. Campeón invicto de temporada)"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Nivel (Tier 1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={trophyTier}
                      onChange={(e) => setTrophyTier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Temporada</label>
                    <input
                      type="text"
                      value={trophySeason}
                      onChange={(e) => setTrophySeason(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <button type="submit" className="py-2 bg-amber-600 rounded-lg text-xs font-bold text-white">
                  Registrar Trofeo en Vitrina Oficial
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {trophiesList.map((trp) => (
                <div key={trp.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{trp.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{trp.name}</h4>
                      <p className="text-[10px] text-slate-400">{trp.description} · Temporada {trp.season}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrophy(trp.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Sponsors Tab (CREAR Sponsors y su icono y cuanto dinero da) */}
        {activeTab === 'sponsors' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsSponsorFormOpen(!isSponsorFormOpen)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
            >
              <DollarSign className="w-4 h-4" />
              <span>{isSponsorFormOpen ? 'Cerrar Formulario' : 'Crear Nuevo Sponsor Comercial'}</span>
            </button>

            {isSponsorFormOpen && (
              <form onSubmit={handleCreateSponsor} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Nombre de la marca (ej. Fly Emirates, Puma Pro)"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={sponsorCat}
                    onChange={(e) => setSponsorCat(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Aerolíneas & Aviación">Aerolíneas & Aviación</option>
                    <option value="Bebidas Energéticas">Bebidas Energéticas</option>
                    <option value="Fintech & Banca Digital">Fintech & Banca</option>
                    <option value="Ropa Deportiva & Calzado">Ropa Deportiva</option>
                    <option value="Tecnología & IA">Tecnología & IA</option>
                    <option value="Automoción & Motor">Automoción & Motor</option>
                  </select>
                  <input
                    type="text"
                    value={sponsorIcon}
                    onChange={(e) => setSponsorIcon(e.target.value)}
                    placeholder="Icono URL (https://...)"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Bono por Firma (€ / Monedas)</label>
                    <input
                      type="number"
                      value={sponsorSignBonus}
                      onChange={(e) => setSponsorSignBonus(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Bono por Partido Jugado</label>
                    <input
                      type="number"
                      value={sponsorMatchBonus}
                      onChange={(e) => setSponsorMatchBonus(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-bold text-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Requisito División (Tier)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sponsorReqTier}
                      onChange={(e) => setSponsorReqTier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Descripción</label>
                    <input
                      type="text"
                      value={sponsorDesc}
                      onChange={(e) => setSponsorDesc(e.target.value)}
                      placeholder="Sello oficial en camiseta"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button type="submit" className="py-2.5 bg-teal-600 rounded-xl text-xs font-bold text-white shadow-md shadow-teal-600/30">
                  Activar Patrocinador en Mercado
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {sponsorsList.map((spn) => (
                <div key={spn.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src={spn.icon_url} 
                      alt={spn.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-950" 
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{spn.name}</h4>
                      <p className="text-[10px] text-slate-400">{spn.category}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono">
                        <span className="text-emerald-400 font-bold">+{spn.signing_bonus.toLocaleString()} € firma</span>
                        <span className="text-amber-400">+{spn.match_bonus.toLocaleString()} €/partido</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSponsor(spn.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Codes Tab (Activar Códigos Premium & Monedas) */}
        {activeTab === 'codes' && (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleCreateCode} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Generador & Activador de Códigos</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  placeholder="Código (ej. VIP2026, DEVS)"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white uppercase font-mono tracking-wider"
                />
                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="coins">Monedas Gratis</option>
                  <option value="premium">Membresía VIP Premium</option>
                </select>
              </div>

              {newCodeType === 'coins' ? (
                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-semibold">Cantidad de Monedas</label>
                  <input
                    type="number"
                    value={newCodeVal}
                    onChange={(e) => setNewCodeVal(Number(e.target.value))}
                    placeholder="Cantidad de monedas"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white tabular-nums font-bold text-emerald-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-semibold">Duración VIP en Días</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newCodeDays}
                    onChange={(e) => setNewCodeDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white tabular-nums font-bold text-amber-400"
                  />
                </div>
              )}

              <button type="submit" className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30">
                Activar Código en Sistema
              </button>
            </form>

            {/* List of active codes */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Códigos Activos en Base de Datos:</span>
              
              {/* Premium Codes */}
              {codesList.premium_codes?.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-xs font-black text-amber-300">{c.code}</span>
                    <span className="text-[10px] text-slate-400 block">Suscripción VIP Premium ({c.duration_days} días)</span>
                  </div>
                  <button onClick={() => handleDeleteCode(c.id)} className="p-1 text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Reward Codes */}
              {codesList.reward_codes?.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-xs font-black text-emerald-400">{c.code}</span>
                    <span className="text-[10px] text-slate-400 block">+{c.reward_value?.toLocaleString()} Monedas</span>
                  </div>
                  <button onClick={() => handleDeleteCode(c.id)} className="p-1 text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Configuration & Favicon Tab */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1">
              Nombre de la Aplicación
              <input
                type="text"
                value={cfgName}
                onChange={(e) => setCfgName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </label>

            <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1">
              Favicon URL (Configuración dinámica)
              <input
                type="text"
                value={cfgFavicon}
                onChange={(e) => setCfgFavicon(e.target.value)}
                placeholder="/icon.svg o https://.../favicon.png"
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </label>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Modo Mantenimiento</span>
              <input
                type="checkbox"
                checked={cfgMaintenance}
                onChange={(e) => setCfgMaintenance(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
              />
            </div>

            <button type="submit" className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs mt-2 shadow-md shadow-emerald-600/30">
              Guardar Configuración Global
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
