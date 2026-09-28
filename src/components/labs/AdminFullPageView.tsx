import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { 
  Profile, Club, Player, League, Trophy, Sponsor, AppSettings, BackgroundTrack 
} from '../../types/index.ts';
import { 
  Terminal, Shield, Users, Trophy as TrophyIcon, Sparkles, 
  Trash2, Edit, Plus, Upload, Link as LinkIcon, Save, RefreshCw, 
  ArrowLeft, Search, Music, Gift, Settings, CheckCircle2, AlertTriangle, Play, Pause, Flame,
  Sliders, X
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

  // Advanced Player Creator / Editor State
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [pfFirstName, setPfFirstName] = useState('');
  const [pfLastName, setPfLastName] = useState('');
  const [pfPosition, setPfPosition] = useState<string>('DC');
  const [pfAge, setPfAge] = useState<number>(24);
  const [pfNationality, setPfNationality] = useState<string>('Perú');
  const [pfRating, setPfRating] = useState<number>(82);
  const [pfPotential, setPfPotential] = useState<number>(88);
  const [pfPrice, setPfPrice] = useState<number>(2500000);
  const [pfSalary, setPfSalary] = useState<number>(45000);
  const [pfClubId, setPfClubId] = useState<string>('');
  const [pfAvatarUrl, setPfAvatarUrl] = useState<string>('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80');
  const [pfPace, setPfPace] = useState<number>(84);
  const [pfShooting, setPfShooting] = useState<number>(82);
  const [pfPassing, setPfPassing] = useState<number>(78);
  const [pfDribbling, setPfDribbling] = useState<number>(83);
  const [pfDefense, setPfDefense] = useState<number>(45);
  const [pfPhysical, setPfPhysical] = useState<number>(76);
  const [savingPlayer, setSavingPlayer] = useState(false);

  // League Creator / Editor State
  const [isLeagueFormOpen, setIsLeagueFormOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [lfTitle, setLfTitle] = useState('');
  const [lfDesc, setLfDesc] = useState('');
  const [lfTier, setLfTier] = useState<number>(1);
  const [lfLogoUrl, setLfLogoUrl] = useState('/src/assets/images/nerva_brand_logo_1790393799448.jpg');
  const [lfBannerUrl, setLfBannerUrl] = useState('/src/assets/images/stadium_banner_pitch_1790393808701.jpg');
  const [lfSeason, setLfSeason] = useState('2026/2027');

  // Sponsor Creator / Editor State
  const [isSponsorFormOpen, setIsSponsorFormOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sfName, setSfName] = useState('');
  const [sfCategory, setSfCategory] = useState('General');
  const [sfIconUrl, setSfIconUrl] = useState('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80');
  const [sfSigningBonus, setSfSigningBonus] = useState<number>(100000);
  const [sfMatchBonus, setSfMatchBonus] = useState<number>(25000);
  const [sfRequirementTier, setSfRequirementTier] = useState<number>(1);
  const [sfDesc, setSfDesc] = useState('');

  // Trophy Creator / Editor State
  const [isTrophyFormOpen, setIsTrophyFormOpen] = useState(false);
  const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
  const [tfName, setTfName] = useState('');
  const [tfDesc, setTfDesc] = useState('');
  const [tfIcon, setTfIcon] = useState('🏆');
  const [tfImageUrl, setTfImageUrl] = useState('/src/assets/images/nerva_brand_logo_1790393799448.jpg');
  const [tfTier, setTfTier] = useState<number>(1);
  const [tfSeason, setTfSeason] = useState('2026/2027');

  // Dual Image Upload Helper (Device File Picker + Server API upload)
  const handleDeviceUpload = (file: File, onDone: (url: string) => void) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('La imagen no debe superar los 10MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadImage(base64, file.name);
        onDone(res.url);
        showToast('¡Imagen subida correctamente desde tu dispositivo!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error al subir imagen', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPlayerForm = () => {
    setEditingPlayer(null);
    setPfFirstName('');
    setPfLastName('');
    setPfPosition('DC');
    setPfAge(24);
    setPfNationality('Perú');
    setPfRating(82);
    setPfPotential(88);
    setPfPrice(2500000);
    setPfSalary(45000);
    setPfClubId('');
    setPfAvatarUrl('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80');
    setPfPace(84);
    setPfShooting(82);
    setPfPassing(78);
    setPfDribbling(83);
    setPfDefense(45);
    setPfPhysical(76);
  };

  const handleEditPlayerClick = (p: Player) => {
    setEditingPlayer(p);
    setPfFirstName(p.first_name);
    setPfLastName(p.last_name);
    setPfPosition(p.position);
    setPfAge(p.age || 24);
    setPfNationality(p.nationality || 'Perú');
    setPfRating(p.rating || 80);
    setPfPotential(p.potential || 85);
    setPfPrice(p.price || 1500000);
    setPfSalary(p.salary || 30000);
    setPfClubId(p.club_id || '');
    setPfAvatarUrl(p.avatar_url || '');
    setPfPace(p.stats?.pace || 80);
    setPfShooting(p.stats?.shooting || 75);
    setPfPassing(p.stats?.passing || 75);
    setPfDribbling(p.stats?.dribbling || 78);
    setPfDefense(p.stats?.defense || 60);
    setPfPhysical(p.stats?.physical || 70);
    setIsPlayerFormOpen(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfFirstName.trim() || !pfLastName.trim()) {
      showToast('Introduce nombre y apellido del futbolista', 'error');
      return;
    }
    setSavingPlayer(true);
    try {
      const payload = {
        first_name: pfFirstName.trim(),
        last_name: pfLastName.trim(),
        position: pfPosition,
        age: Number(pfAge) || 24,
        nationality: pfNationality.trim() || 'Perú',
        rating: Number(pfRating) || 80,
        potential: Number(pfPotential) || 85,
        price: Number(pfPrice) || 2000000,
        salary: Number(pfSalary) || 35000,
        club_id: pfClubId || null,
        avatar_url: pfAvatarUrl,
        stats: {
          pace: Number(pfPace),
          shooting: Number(pfShooting),
          passing: Number(pfPassing),
          dribbling: Number(pfDribbling),
          defense: Number(pfDefense),
          physical: Number(pfPhysical)
        }
      };

      if (editingPlayer) {
        const res = await api.updateAdminPlayer(editingPlayer.id, payload);
        showToast(`Jugador "${pfFirstName} ${pfLastName}" actualizado con éxito`, 'success');
        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...res.player } : p));
      } else {
        const res = await api.createAdminPlayer(payload);
        showToast(`¡Futbolista "${pfFirstName} ${pfLastName}" creado en la base de datos!`, 'success');
        setPlayers(prev => [res.player, ...prev]);
      }
      setIsPlayerFormOpen(false);
      handleResetPlayerForm();
    } catch (err: any) {
      showToast(err.message || 'Error guardando jugador', 'error');
    } finally {
      setSavingPlayer(false);
    }
  };

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

  // League handlers
  const handleResetLeagueForm = () => {
    setEditingLeague(null);
    setLfTitle('');
    setLfDesc('');
    setLfTier(1);
    setLfLogoUrl('/src/assets/images/nerva_brand_logo_1790393799448.jpg');
    setLfBannerUrl('/src/assets/images/stadium_banner_pitch_1790393808701.jpg');
    setLfSeason('2026/2027');
  };

  const handleEditLeagueClick = (l: League) => {
    setEditingLeague(l);
    setLfTitle(l.title);
    setLfDesc(l.description || '');
    setLfTier(l.tier || 1);
    setLfLogoUrl(l.logo_url || '');
    setLfBannerUrl(l.banner_url || '');
    setLfSeason(l.season || '2026/2027');
    setIsLeagueFormOpen(true);
  };

  const handleSaveLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lfTitle.trim()) {
      showToast('Introduce el nombre de la liga', 'error');
      return;
    }
    try {
      const payload = {
        title: lfTitle.trim(),
        description: lfDesc.trim(),
        tier: Number(lfTier) || 1,
        logo_url: lfLogoUrl,
        banner_url: lfBannerUrl,
        season: lfSeason.trim() || '2026/2027'
      };
      if (editingLeague) {
        await api.updateAdminLeague(editingLeague.id, payload);
        showToast(`Liga "${lfTitle}" actualizada`, 'success');
        setLeagues(prev => prev.map(l => l.id === editingLeague.id ? { ...l, ...payload } : l));
      } else {
        const res = await api.createAdminLeague(payload);
        showToast(`Liga "${lfTitle}" creada con éxito`, 'success');
        setLeagues(prev => [...prev, res.league]);
      }
      setIsLeagueFormOpen(false);
      handleResetLeagueForm();
    } catch (err: any) {
      showToast(err.message || 'Error guardando liga', 'error');
    }
  };

  // Sponsor handlers
  const handleResetSponsorForm = () => {
    setEditingSponsor(null);
    setSfName('');
    setSfCategory('General');
    setSfIconUrl('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80');
    setSfSigningBonus(100000);
    setSfMatchBonus(25000);
    setSfRequirementTier(1);
    setSfDesc('');
  };

  const handleEditSponsorClick = (s: Sponsor) => {
    setEditingSponsor(s);
    setSfName(s.name);
    setSfCategory(s.category || 'General');
    setSfIconUrl(s.icon_url || '');
    setSfSigningBonus(s.signing_bonus || 100000);
    setSfMatchBonus(s.match_bonus || 25000);
    setSfRequirementTier(s.requirement_tier || 1);
    setSfDesc(s.description || '');
    setIsSponsorFormOpen(true);
  };

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sfName.trim()) {
      showToast('Introduce el nombre del sponsor', 'error');
      return;
    }
    try {
      const payload = {
        name: sfName.trim(),
        category: sfCategory.trim(),
        icon_url: sfIconUrl,
        signing_bonus: Number(sfSigningBonus) || 50000,
        match_bonus: Number(sfMatchBonus) || 15000,
        requirement_tier: Number(sfRequirementTier) || 1,
        description: sfDesc.trim() || 'Contrato oficial de patrocinio NERVA.'
      };
      if (editingSponsor) {
        await api.updateAdminSponsor(editingSponsor.id, payload);
        showToast(`Sponsor "${sfName}" actualizado`, 'success');
        setSponsors(prev => prev.map(s => s.id === editingSponsor.id ? { ...s, ...payload } : s));
      } else {
        const res = await api.createAdminSponsor(payload);
        showToast(`Sponsor "${sfName}" creado con éxito`, 'success');
        setSponsors(prev => [...prev, res.sponsor]);
      }
      setIsSponsorFormOpen(false);
      handleResetSponsorForm();
    } catch (err: any) {
      showToast(err.message || 'Error guardando sponsor', 'error');
    }
  };

  // Trophy handlers
  const handleResetTrophyForm = () => {
    setEditingTrophy(null);
    setTfName('');
    setTfDesc('');
    setTfIcon('🏆');
    setTfImageUrl('/src/assets/images/nerva_brand_logo_1790393799448.jpg');
    setTfTier(1);
    setTfSeason('2026/2027');
  };

  const handleEditTrophyClick = (t: Trophy) => {
    setEditingTrophy(t);
    setTfName(t.name || t.title);
    setTfDesc(t.description || '');
    setTfIcon(t.icon || '🏆');
    setTfImageUrl(t.image_url || '');
    setTfTier(t.tier || 1);
    setTfSeason(t.season || '2026/2027');
    setIsTrophyFormOpen(true);
  };

  const handleSaveTrophy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tfName.trim()) {
      showToast('Introduce el nombre del trofeo', 'error');
      return;
    }
    try {
      const payload = {
        name: tfName.trim(),
        title: tfName.trim(),
        description: tfDesc.trim(),
        icon: tfIcon.trim() || '🏆',
        image_url: tfImageUrl,
        tier: Number(tfTier) || 1,
        season: tfSeason.trim() || '2026/2027'
      };
      if (editingTrophy) {
        await api.updateAdminTrophy(editingTrophy.id, payload);
        showToast(`Trofeo "${tfName}" actualizado`, 'success');
        setTrophies(prev => prev.map(t => t.id === editingTrophy.id ? { ...t, ...payload } : t));
      } else {
        const res = await api.createAdminTrophy(payload);
        showToast(`Trofeo "${tfName}" creado con éxito`, 'success');
        setTrophies(prev => [...prev, res.trophy]);
      }
      setIsTrophyFormOpen(false);
      handleResetTrophyForm();
    } catch (err: any) {
      showToast(err.message || 'Error guardando trofeo', 'error');
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
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Editor de Jugadores & Generador IA ({players.length})</span>
                </h2>
                <p className="text-xs text-slate-400">Crea nuevos futbolistas con ficha técnica avanzada o genera rostros con IA</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isPlayerFormOpen && !editingPlayer) {
                      setIsPlayerFormOpen(false);
                    } else {
                      handleResetPlayerForm();
                      setIsPlayerFormOpen(true);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 touch-press shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isPlayerFormOpen && !editingPlayer ? 'Cerrar' : '+ Crear Jugador'}</span>
                </button>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Buscar por nombre, posición..."
                    className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* ADVANCED PLAYER CREATOR / EDITOR FORM */}
            {isPlayerFormOpen && (
              <form onSubmit={handleSavePlayer} className="p-4 sm:p-5 rounded-3xl bg-[#121826] border border-emerald-500/40 shadow-2xl flex flex-col gap-4 ring-1 ring-emerald-500/20 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sliders className="w-4 h-4" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {editingPlayer ? `Editar Jugador: ${editingPlayer.first_name} ${editingPlayer.last_name}` : 'Crear Nuevo Futbolista (Editor Avanzado)'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayerFormOpen(false);
                      handleResetPlayerForm();
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Section 1: Identidad & Demografía */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nombre</label>
                    <input
                      type="text"
                      value={pfFirstName}
                      onChange={(e) => setPfFirstName(e.target.value)}
                      placeholder="Ej. Christian, Paolo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Apellido</label>
                    <input
                      type="text"
                      value={pfLastName}
                      onChange={(e) => setPfLastName(e.target.value)}
                      placeholder="Ej. Cueva, Guerrero"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Posición</label>
                    <select
                      value={pfPosition}
                      onChange={(e) => setPfPosition(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none font-bold"
                    >
                      {['POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'].map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nacionalidad</label>
                    <input
                      type="text"
                      value={pfNationality}
                      onChange={(e) => setPfNationality(e.target.value)}
                      placeholder="Ej. Perú, Argentina"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Section 2: Rating, Economía y Club */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Edad</label>
                    <input
                      type="number"
                      min={16}
                      max={45}
                      value={pfAge}
                      onChange={(e) => setPfAge(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Valoración (OVR)</label>
                    <input
                      type="number"
                      min={40}
                      max={99}
                      value={pfRating}
                      onChange={(e) => setPfRating(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:border-emerald-500 outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Potencial MÁX</label>
                    <input
                      type="number"
                      min={40}
                      max={99}
                      value={pfPotential}
                      onChange={(e) => setPfPotential(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:border-emerald-500 outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Precio Traspaso (€)</label>
                    <input
                      type="number"
                      step={50000}
                      value={pfPrice}
                      onChange={(e) => setPfPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none tabular-nums"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Club Asignado</label>
                    <select
                      value={pfClubId}
                      onChange={(e) => setPfClubId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="">Agente Libre (Mercado)</option>
                      {clubs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 3: Avatar / Rostro con IA */}
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/40 shrink-0">
                    <img src={pfAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">URL Avatar / Rostro</label>
                    <input
                      type="text"
                      value={pfAvatarUrl}
                      onChange={(e) => setPfAvatarUrl(e.target.value)}
                      placeholder="https://... / avatar.jpg"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const faces = [
                        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
                      ];
                      const pick = faces[Math.floor(Math.random() * faces.length)];
                      setPfAvatarUrl(pick);
                      showToast('Rostro atlético asignado', 'info');
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rostro Aleatorio</span>
                  </button>
                </div>

                {/* Section 4: 6 Core FIFA/FC Attributes (Sliders & Inputs) */}
                <div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>Atributos Técnicos & Físicos Oficiales</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-400">PAC (Ritmo)</span>
                        <span className="text-emerald-400 tabular-nums">{pfPace}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={99}
                        value={pfPace}
                        onChange={(e) => setPfPace(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-400">SHO (Tiro)</span>
                        <span className="text-emerald-400 tabular-nums">{pfShooting}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={99}
                        value={pfShooting}
                        onChange={(e) => setPfShooting(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-400">PAS (Pase)</span>
                        <span className="text-emerald-400 tabular-nums">{pfPassing}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={99}
                        value={pfPassing}
                        onChange={(e) => setPfPassing(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-400">DRI (Regate)</span>
                        <span className="text-emerald-400 tabular-nums">{pfDribbling}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={99}
                        value={pfDribbling}
                        onChange={(e) => setPfDribbling(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-400">DEF (Defensa)</span>
                        <span className="text-emerald-400 tabular-nums">{pfDefense}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={99}
                        value={pfDefense}
                        onChange={(e) => setPfDefense(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-400">PHY (Físico)</span>
                        <span className="text-emerald-400 tabular-nums">{pfPhysical}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={99}
                        value={pfPhysical}
                        onChange={(e) => setPfPhysical(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayerFormOpen(false);
                      handleResetPlayerForm();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlayer}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/50 touch-press disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPlayer ? 'Guardando...' : editingPlayer ? 'Actualizar Jugador' : 'Crear Jugador Oficial'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {players
                .filter(p => `${p.first_name} ${p.last_name} ${p.position} ${p.club_name}`.toLowerCase().includes(playerSearch.toLowerCase()))
                .map((p) => {
                  const isGenerating = generatingPlayerId === p.id;
                  return (
                    <div key={p.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex flex-col gap-3 hover:border-slate-700 transition">
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

                        <div className="flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditPlayerClick(p)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            title="Editar Atributos del Jugador"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeletePlayer(p.id, `${p.first_name} ${p.last_name}`)}
                            className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 transition"
                            title="Eliminar de la base de datos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">Patrocinadores Oficiales ({sponsors.length})</h2>
                <p className="text-xs text-slate-400">Crea o edita acuerdos comerciales y bonificaciones de partido</p>
              </div>
              <button
                onClick={() => {
                  if (isSponsorFormOpen) {
                    setIsSponsorFormOpen(false);
                    handleResetSponsorForm();
                  } else {
                    handleResetSponsorForm();
                    setIsSponsorFormOpen(true);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSponsorFormOpen ? 'Cerrar Formulario' : 'Nuevo Sponsor'}</span>
              </button>
            </div>

            {/* Sponsor Form */}
            {isSponsorFormOpen && (
              <form onSubmit={handleSaveSponsor} className="p-4 rounded-3xl bg-[#141c2e] border-2 border-emerald-500/40 shadow-2xl flex flex-col gap-3.5">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  {editingSponsor ? `Editar Patrocinador: ${editingSponsor.name}` : 'Crear Nuevo Patrocinador'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nombre Comercial</label>
                    <input
                      type="text"
                      value={sfName}
                      onChange={(e) => setSfName(e.target.value)}
                      placeholder="Ej. Fly Emirates, Nike..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Categoría</label>
                    <input
                      type="text"
                      value={sfCategory}
                      onChange={(e) => setSfCategory(e.target.value)}
                      placeholder="Ej. Aerolínea, Indumentaria..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">División Mínima Requerida</label>
                    <select
                      value={sfRequirementTier}
                      onChange={(e) => setSfRequirementTier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value={1}>División 1 (Élite)</option>
                      <option value={2}>División 2 (Plata)</option>
                      <option value={3}>División 3 (Regional)</option>
                      <option value={4}>División 4 (Amateur)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Bono por Firma (€)</label>
                    <input
                      type="number"
                      step={10000}
                      value={sfSigningBonus}
                      onChange={(e) => setSfSigningBonus(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Bono por Partido Jugado (€)</label>
                    <input
                      type="number"
                      step={5000}
                      value={sfMatchBonus}
                      onChange={(e) => setSfMatchBonus(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Logo / Icono</label>
                      <label className="text-[9px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Subir archivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDeviceUpload(f, (url) => setSfIconUrl(url));
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={sfIconUrl}
                      onChange={(e) => setSfIconUrl(e.target.value)}
                      placeholder="https://... o sube desde dispositivo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Descripción del Contrato</label>
                    <input
                      type="text"
                      value={sfDesc}
                      onChange={(e) => setSfDesc(e.target.value)}
                      placeholder="Términos y beneficios del patrocinio..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSponsorFormOpen(false);
                      handleResetSponsorForm();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingSponsor ? 'Actualizar Sponsor' : 'Crear Sponsor'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sponsors.map((s) => (
                <div key={s.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img src={s.icon_url} alt={s.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate">{s.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-bold block">Firma: +{s.signing_bonus.toLocaleString()} €</span>
                      <span className="text-[9px] text-slate-500 block">+{s.match_bonus.toLocaleString()} €/partido · Div {s.requirement_tier}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditSponsorClick(s)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                      title="Editar Sponsor"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSponsor(s.id)}
                      className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                      title="Eliminar Sponsor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trophies' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">Vitrina de Trofeos ({trophies.length})</h2>
                <p className="text-xs text-slate-400">Diseña trofeos oficiales, copas de temporada y condecoraciones</p>
              </div>
              <button
                onClick={() => {
                  if (isTrophyFormOpen) {
                    setIsTrophyFormOpen(false);
                    handleResetTrophyForm();
                  } else {
                    handleResetTrophyForm();
                    setIsTrophyFormOpen(true);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isTrophyFormOpen ? 'Cerrar Formulario' : 'Nuevo Trofeo'}</span>
              </button>
            </div>

            {/* Trophy Form */}
            {isTrophyFormOpen && (
              <form onSubmit={handleSaveTrophy} className="p-4 rounded-3xl bg-[#141c2e] border-2 border-amber-500/40 shadow-2xl flex flex-col gap-3.5">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  {editingTrophy ? `Editar Trofeo: ${editingTrophy.name || editingTrophy.title}` : 'Crear Nuevo Trofeo Oficial'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nombre del Trofeo</label>
                    <input
                      type="text"
                      value={tfName}
                      onChange={(e) => setTfName(e.target.value)}
                      placeholder="Ej. Copa de Campeones, Balón Dorado..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Emoticono / Símbolo</label>
                    <input
                      type="text"
                      value={tfIcon}
                      onChange={(e) => setTfIcon(e.target.value)}
                      placeholder="🏆, 🥇, 👑, ⭐"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Temporada</label>
                    <input
                      type="text"
                      value={tfSeason}
                      onChange={(e) => setTfSeason(e.target.value)}
                      placeholder="2026/2027"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Imagen / Insignia</label>
                      <label className="text-[9px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Subir desde dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDeviceUpload(f, (url) => setTfImageUrl(url));
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={tfImageUrl}
                      onChange={(e) => setTfImageUrl(e.target.value)}
                      placeholder="https://... o archivo del dispositivo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nivel / Rango (Tier)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tfTier}
                      onChange={(e) => setTfTier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Condición / Mérito Deportivo</label>
                    <input
                      type="text"
                      value={tfDesc}
                      onChange={(e) => setTfDesc(e.target.value)}
                      placeholder="Condición de victoria para levantar la copa..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrophyFormOpen(false);
                      handleResetTrophyForm();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingTrophy ? 'Actualizar Trofeo' : 'Guardar Trofeo'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {trophies.map((t) => (
                <div key={t.id} className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-3xl shrink-0">{t.icon || '🏆'}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate">{t.name || t.title}</h4>
                      <span className="text-[10px] text-amber-400 font-bold block">{t.season || '2026/2027'} · Nivel {t.tier || 1}</span>
                      <span className="text-[9px] text-slate-400 truncate block">{t.description || 'Trofeo oficial'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditTrophyClick(t)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                      title="Editar Trofeo"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrophy(t.id)}
                      className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                      title="Eliminar Trofeo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leagues' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">Ligas & Competiciones ({leagues.length})</h2>
                <p className="text-xs text-slate-400">Crea divisiones, configura ascensos y personaliza logos y banners</p>
              </div>
              <button
                onClick={() => {
                  if (isLeagueFormOpen) {
                    setIsLeagueFormOpen(false);
                    handleResetLeagueForm();
                  } else {
                    handleResetLeagueForm();
                    setIsLeagueFormOpen(true);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isLeagueFormOpen ? 'Cerrar Formulario' : 'Nueva Liga'}</span>
              </button>
            </div>

            {/* League Form */}
            {isLeagueFormOpen && (
              <form onSubmit={handleSaveLeague} className="p-4 rounded-3xl bg-[#141c2e] border-2 border-purple-500/40 shadow-2xl flex flex-col gap-3.5">
                <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider">
                  {editingLeague ? `Editar Liga: ${editingLeague.title}` : 'Crear Nueva Liga Oficial'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Título de la Liga</label>
                    <input
                      type="text"
                      value={lfTitle}
                      onChange={(e) => setLfTitle(e.target.value)}
                      placeholder="Ej. Liga de Honor, Serie A..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nivel de División (Tier)</label>
                    <select
                      value={lfTier}
                      onChange={(e) => setLfTier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value={1}>Tier 1 (Máxima Categoría)</option>
                      <option value={2}>Tier 2 (Segunda División)</option>
                      <option value={3}>Tier 3 (Tercera División)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Temporada</label>
                    <input
                      type="text"
                      value={lfSeason}
                      onChange={(e) => setLfSeason(e.target.value)}
                      placeholder="2026/2027"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Descripción de la Competición</label>
                    <input
                      type="text"
                      value={lfDesc}
                      onChange={(e) => setLfDesc(e.target.value)}
                      placeholder="Detalles y prestigio del campeonato..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Logo de Liga</label>
                      <label className="text-[9px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDeviceUpload(f, (url) => setLfLogoUrl(url));
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={lfLogoUrl}
                      onChange={(e) => setLfLogoUrl(e.target.value)}
                      placeholder="URL o sube archivo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Banner del Estadio de la Liga</label>
                      <label className="text-[9px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Subir archivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDeviceUpload(f, (url) => setLfBannerUrl(url));
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={lfBannerUrl}
                      onChange={(e) => setLfBannerUrl(e.target.value)}
                      placeholder="https://... o sube desde dispositivo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLeagueFormOpen(false);
                      handleResetLeagueForm();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingLeague ? 'Actualizar Liga' : 'Crear Liga'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leagues.map((l) => (
                <div key={l.id} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <img src={l.logo_url || '/src/assets/images/nerva_brand_logo_1790393799448.jpg'} alt={l.title} className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white truncate">{l.title}</h4>
                      <span className="text-[10px] text-purple-400 font-bold block">División Tier {l.tier} · {l.season || '2026/2027'}</span>
                      <span className="text-[9px] text-slate-400 truncate block">{l.description || 'Competición oficial'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditLeagueClick(l)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                      title="Editar Liga"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLeague(l.id)}
                      className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40"
                      title="Eliminar Liga"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
