import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useBackgroundAudio } from '../../context/AudioContext.tsx';
import { api } from '../../services/api.ts';
import { 
  User, Shield, Key, Gift, MessageSquare, Volume2, VolumeX, 
  Play, Pause, Heart, Image, Upload, Link as LinkIcon, 
  Send, ExternalLink, Sparkles, Trophy, Flame, AlertCircle, 
  Clock, CheckCircle2, XCircle, Sliders, ChevronRight
} from 'lucide-react';
import { EditManagerModal } from '../profile/EditManagerModal.tsx';
import { ClubPost, SponsorOffer, NotificationItem } from '../../types/index.ts';

interface MoreViewProps {
  onOpenSettings: () => void;
  onOpenPremium: () => void;
  onOpenLabs: () => void;
  onNavigateToAdminPage?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  onOpenSettings,
  onOpenPremium,
  onOpenLabs,
  onNavigateToAdminPage
}) => {
  const { user, club, refreshUserData, showToast } = useAuth();
  const { isPlaying, volume, currentTrack, tracks, togglePlay, setVolume, selectTrack } = useBackgroundAudio();

  // Sub-navigation in "Más"
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'social' | 'sound' | 'sponsors'>('account');
  const [accountSubSection, setAccountSubSection] = useState<'panel' | 'codes'>('panel');

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Codes State
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // Social / Fans State
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'match' | 'transfer' | 'statement'>('statement');
  const [postImageSource, setPostImageSource] = useState<'device' | 'url'>('device');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Sponsors & Notifications State
  const [sponsorOffers, setSponsorOffers] = useState<SponsorOffer[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);

  // Audio Upload from Device State
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadTitle, setAudioUploadTitle] = useState('');
  const [audioUploadArtist, setAudioUploadArtist] = useState('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState('');

  // Load Initial Data
  useEffect(() => {
    loadSocialPosts();
    loadSponsorsAndNotifications();
  }, [club]);

  const loadSocialPosts = async () => {
    try {
      const res = await api.getSocialPosts();
      if (res && res.posts) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.warn('Error loading social posts:', err);
    }
  };

  const loadSponsorsAndNotifications = async () => {
    setLoadingSponsors(true);
    try {
      const [spnRes, notifRes] = await Promise.all([
        api.getSponsorOffers().catch(() => ({ offers: [] })),
        api.getNotifications().catch(() => ({ notifications: [] }))
      ]);
      if (spnRes.offers) setSponsorOffers(spnRes.offers);
      if (notifRes.notifications) setNotifications(notifRes.notifications);
    } catch (err) {
      console.warn('Error loading sponsors/notifications:', err);
    } finally {
      setLoadingSponsors(false);
    }
  };

  // Code Redeem Handler
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCodeInput.trim()) {
      showToast('Por favor introduce un código de canje', 'error');
      return;
    }
    setRedeeming(true);
    try {
      const res = await api.redeemCode(redeemCodeInput.trim());
      showToast(res.message || '¡Código canjeado con éxito!', 'success');
      setRedeemCodeInput('');
      await refreshUserData();
      if ((res as any).isAdminElevated || (res as any).user?.role === 'owner' || (res as any).user?.role === 'admin') {
        setAccountSubSection('panel');
        setTimeout(() => {
          showToast('👑 ¡Modo Administrador Supremo activado! Ya tienes permisos para gestionar todo el sistema.', 'success');
        }, 500);
      }
    } catch (err: any) {
      showToast(err.message || 'Código inválido o ya utilizado', 'error');
    } finally {
      setRedeeming(false);
    }
  };

  // Image File Handling for Post
  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('La imagen no debe superar los 8MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPostImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Create Social Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      showToast('Escribe algo en tu publicación', 'error');
      return;
    }

    setSubmittingPost(true);
    try {
      let finalImg = '';
      if (postImageSource === 'device' && postImagePreview) {
        // Upload image to server
        const upRes = await api.uploadImage(postImagePreview, 'post-img.jpg');
        finalImg = upRes.url;
      } else if (postImageSource === 'url' && postImageUrl.trim()) {
        finalImg = postImageUrl.trim();
      }

      const res = await api.createSocialPost({
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
        type: postType,
        image_url: finalImg || undefined
      });

      showToast('¡Publicación compartida con los aficionados!', 'success');
      setPostTitle('');
      setPostContent('');
      setPostImageUrl('');
      setPostImagePreview(null);
      loadSocialPosts();
      refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Error al publicar', 'error');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Like Social Post
  const handleLikePost = async (id: string) => {
    try {
      const res = await api.likeSocialPost(id);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: res.likes } : p));
    } catch (err) {
      console.warn('Error liking post:', err);
    }
  };

  // Sponsor Actions
  const handleAcceptSponsor = async (id: string) => {
    try {
      await api.acceptSponsorOffer(id);
      showToast('¡Contrato de patrocinio aceptado! Bonos acreditados a tu club.', 'success');
      loadSponsorsAndNotifications();
      refreshUserData();
    } catch (err: any) {
      showToast(err.message || 'Error al aceptar patrocinador', 'error');
    }
  };

  const handleRejectSponsor = async (id: string) => {
    try {
      await api.rejectSponsorOffer(id);
      showToast('Oferta de patrocinio rechazada', 'info');
      loadSponsorsAndNotifications();
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar patrocinador', 'error');
    }
  };

  // Audio Upload from Device
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAudioTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBase64) {
      showToast('Selecciona un archivo de audio', 'error');
      return;
    }
    setIsUploadingAudio(true);
    try {
      await api.uploadAudio({
        title: audioUploadTitle.trim() || audioFileName.replace(/\.[^/.]+$/, ""),
        artist: audioUploadArtist.trim() || user?.display_name || 'Admin',
        dataUrl: audioBase64
      });
      showToast('¡Pista de audio subida y agregada al reproductor!', 'success');
      setAudioUploadTitle('');
      setAudioUploadArtist('');
      setAudioBase64(null);
      setAudioFileName('');
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || 'Error al subir pista de audio', 'error');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28 pt-2 px-3.5 max-w-md mx-auto select-none">
      {/* Top Banner Navigation Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Centro & Opciones
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">
            Cuenta, Red Social, Música y Patrocinios oficiales
          </span>
        </div>

        {(user?.role === 'admin' || user?.role === 'owner') && (
          <button
            onClick={() => {
              if (onNavigateToAdminPage) {
                onNavigateToAdminPage();
              } else {
                window.location.href = '/directorioraizdenuestraygrandisimaownerv2';
              }
            }}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-1.5 shadow-lg shadow-amber-950/20 touch-press"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ROOT ADMIN</span>
          </button>
        )}
      </div>

      {/* 4 Main Sub-Tabs with Varied Section Colors */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
        {[
          { id: 'account', label: 'Cuenta', icon: User, color: 'text-sky-400', activeBg: 'bg-sky-600' },
          { id: 'social', label: 'Fans', icon: MessageSquare, color: 'text-pink-400', activeBg: 'bg-pink-600' },
          { id: 'sound', label: 'Sonido', icon: Volume2, color: 'text-amber-400', activeBg: 'bg-amber-600' },
          { id: 'sponsors', label: 'Sponsors', icon: Shield, color: 'text-emerald-400', activeBg: 'bg-emerald-600' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                isActive
                  ? `${tab.activeBg} text-white shadow-md`
                  : `${tab.color} hover:bg-slate-800/60`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className={`text-[10px] ${isActive ? 'text-white' : 'text-slate-400'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. SECCIÓN CUENTA (SEPARADO PANEL Y CODES)                     */}
      {/* ============================================================== */}
      {activeSubTab === 'account' && (
        <div className="flex flex-col gap-4">
          {/* Sub-Switch: Panel vs Códigos */}
          <div className="flex p-1 rounded-xl bg-[#121826] border border-slate-800">
            <button
              onClick={() => setAccountSubSection('panel')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                accountSubSection === 'panel'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Panel de Cuenta
            </button>
            <button
              onClick={() => setAccountSubSection('codes')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                accountSubSection === 'codes'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Códigos de Canje
            </button>
          </div>

          {accountSubSection === 'panel' ? (
            /* Manager Profile Card */
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={user?.display_name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 uppercase">
                      {user?.role}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-white truncate">{user?.display_name}</h2>
                    <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {user?.nationality || 'Nacional'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {user?.tactical_style || 'Equilibrado'}
                      </span>
                    </div>
                  </div>
                </div>

                {user?.bio && (
                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    "{user.bio}"
                  </p>
                )}

                {/* Account Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Reputación</span>
                    <span className="text-sm font-black text-amber-400">{club?.reputation || 1000} pts</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Seguidores</span>
                    <span className="text-sm font-black text-emerald-400">{(club?.fans || 5000).toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Estadio</span>
                    <span className="text-sm font-black text-white">Nivel {club?.stadium_level || 0}</span>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 touch-press"
                >
                  <User className="w-4 h-4" />
                  <span>Editar Perfil & Foto de Mánager</span>
                </button>
              </div>

              {/* Admin Panel Direct Access Card */}
              {(user?.role === 'admin' || user?.role === 'owner') && (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-orange-500/10 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Directorio Raíz Owner / Admin
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      RUTA DEDICADA
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Accede a la página completa de administración sin límites para editar clubes, jugadores con IA, usuarios, monedas y música.
                  </p>
                  <button
                    onClick={() => {
                      if (onNavigateToAdminPage) {
                        onNavigateToAdminPage();
                      } else {
                        window.location.href = '/directorioraizdenuestraygrandisimaownerv2';
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 mt-1"
                  >
                    <span>Abrir Panel Completo /directorioraizdenuestraygrandisimaownerv2</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Promo & Reward Codes Section */
            <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Gift className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Canje de Códigos Oficiales
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ingresa códigos promocionales autorizados por NERVA para recibir monedas o beneficios
                  </p>
                </div>
              </div>

              <form onSubmit={handleRedeemCode} className="flex flex-col gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    value={redeemCodeInput}
                    onChange={(e) => setRedeemCodeInput(e.target.value)}
                    placeholder="Ej. DEVS, NERVAVIP7..."
                    className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-3 text-sm text-white font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal focus:border-emerald-500 outline-none"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                </div>

                <button
                  type="submit"
                  disabled={redeeming}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition disabled:opacity-50"
                >
                  {redeeming ? 'Validando...' : 'Canjear Código en Base de Datos'}
                </button>
              </form>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1.5">
                <span className="font-bold text-slate-300">Códigos Activos Disponibles:</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-400">DEVS</span>
                  <span>400.000 Monedas</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-400">NERVA2026</span>
                  <span>250.000 Monedas</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RED SOCIAL DEL CLUB & FANS (LÍMITE 8 BILLONES)             */}
      {/* ============================================================== */}
      {activeSubTab === 'social' && (
        <div className="flex flex-col gap-4">
          {/* Club Social Header & Follower Count */}
          <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden shrink-0">
                  <img src={club?.crest_url || '/src/assets/images/crest_titan_fc_1790393819091.jpg'} alt="Club" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{club?.name}</h3>
                  <span className="text-[10px] text-emerald-400 font-semibold">Cuenta Oficial de Club</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-white block tabular-nums">
                  {(club?.fans || 5000).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400">Aficionados / Fans</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
              ⭐ <strong>Sistema de Crecimiento de Fans:</strong> Tu hinchada crece lentamente conforme ganas partidos (+10 pts reputación) y conquistas trofeos. Límite máximo mundial: <strong>8 Billones</strong> de seguidores.
            </div>
          </div>

          {/* New Post Creator (Device File OR URL) */}
          <form onSubmit={handleCreatePost} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Nueva Publicación del Club
            </h4>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'statement', label: 'Comunicado' },
                { id: 'match', label: 'Partido' },
                { id: 'transfer', label: 'Fichaje' },
              ].map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setPostType(t.id as any)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                    postType === t.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Título opcional del post..."
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />

            <textarea
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Escribe el mensaje para la afición, crónica de victoria o anuncio de fichaje..."
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 resize-none"
            />

            {/* Image attachment: Device File OR URL */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Adjuntar Imagen:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPostImageSource('device')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      postImageSource === 'device' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    Dispositivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostImageSource('url')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      postImageSource === 'url' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    URL Web
                  </button>
                </div>
              </div>

              {postImageSource === 'device' ? (
                <div>
                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/60 cursor-pointer text-xs text-slate-300">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Seleccionar foto desde galería o cámara</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePostFileChange}
                      className="hidden"
                    />
                  </label>
                  {postImagePreview && (
                    <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-emerald-500/40">
                      <img src={postImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPostImagePreview(null)}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="url"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingPost}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 touch-press transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingPost ? 'Publicando...' : 'Publicar en NERVA Social'}</span>
            </button>
          </form>

          {/* Social Posts Feed */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Muro Oficial de la Comunidad ({posts.length})
            </h4>

            {posts.map((post) => (
              <div key={post.id} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-lg flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.club_crest || '/src/assets/images/crest_titan_fc_1790393819091.jpg'}
                      alt={post.club_name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">{post.club_name}</span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(post.created_at).toLocaleDateString()} · {post.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Oficial
                  </span>
                </div>

                {post.title && (
                  <h5 className="text-sm font-black text-white">{post.title}</h5>
                )}

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {post.image_url && (
                  <div className="rounded-2xl overflow-hidden max-h-48 border border-slate-800 bg-black/40">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Real-time Dynamic Fan Growth based on 10-Minute Threshold and Club Reputation */}
                {(() => {
                  const elapsedMs = Date.now() - new Date(post.created_at).getTime();
                  const elapsedMins = Math.floor(elapsedMs / 60000);
                  const isUnder10 = elapsedMins < 10;
                  const minsLeft = Math.max(1, 10 - elapsedMins);
                  const clubRep = club?.reputation || 1000;
                  const fansGained = (post as any).fans_gained ?? (isUnder10 ? 0 : Math.floor((clubRep / 100) * (elapsedMins - 10) * 18));

                  return isUnder10 ? (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Primeros minutos: <strong className="text-white">0 fans ganados</strong></span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold">
                        Aumentará en {minsLeft} min según reputación ({clubRep} pts)
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Afición impulsada por reputación ({clubRep} pts):</span>
                      </div>
                      <span className="font-black text-emerald-300 text-xs tabular-nums">
                        +{fansGained.toLocaleString()} fans ({elapsedMins} min)
                      </span>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                    <span className="font-bold tabular-nums">{post.likes}</span>
                    <span className="text-[10px] text-slate-500">Aficionados apoyaron</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MÚSICA & SONIDO (CONTROL DE VOLUMEN / APAGAR / SUBIR AUDIO) */}
      {/* ============================================================== */}
      {activeSubTab === 'sound' && (
        <div className="flex flex-col gap-4">
          {/* Main Sound Console */}
          <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Audio & Música de Fondo
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Control maestro del sonido ambiental de la plataforma
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isPlaying
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isPlaying ? 'EN REPRODUCCIÓN' : 'PAUSADO'}
              </span>
            </div>

            {/* Currently Playing Track */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                  Pista Activa
                </span>
                <h4 className="text-xs font-black text-white truncate">
                  {currentTrack?.title || 'Tema de Campeones NERVA'}
                </h4>
                <span className="text-[10px] text-slate-400 truncate block">
                  {currentTrack?.artist || 'Nerva Sound Lab'}
                </span>
              </div>

              <button
                onClick={togglePlay}
                className="w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 touch-press"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  Volumen Maestro
                </span>
                <span className="tabular-nums text-emerald-400">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <p className="text-[10px] text-slate-400 italic">
                * La música continuará sonando de fondo mientras navegas por toda la web. La única forma de apagarla o bajar el volumen es desde este panel de sonido.
              </p>
            </div>

            {/* Track Playlist */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300">Lista de Pistas Disponibles:</span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {tracks.map((t) => {
                  const isCurrent = currentTrack?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => selectTrack(t.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{t.title}</span>
                        <span className="text-[9px] text-slate-500">{t.artist}</span>
                      </div>
                      {isCurrent && isPlaying && (
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 h-3 bg-emerald-400 animate-pulse" />
                          <span className="w-0.5 h-2 bg-emerald-400 animate-pulse delay-75" />
                          <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse delay-150" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upload Music from Device (Admin Access) */}
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <form onSubmit={handleUploadAudioTrack} className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Subir Nueva Música desde tu Dispositivo (Admin)
              </h4>

              <input
                type="text"
                value={audioUploadTitle}
                onChange={(e) => setAudioUploadTitle(e.target.value)}
                placeholder="Título de la canción..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />

              <input
                type="text"
                value={audioUploadArtist}
                onChange={(e) => setAudioUploadArtist(e.target.value)}
                placeholder="Artista o compositor..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />

              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer text-xs text-amber-200">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{audioFileName || 'Seleccionar archivo de audio (.mp3, .wav, .ogg)'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={isUploadingAudio || !audioBase64}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{isUploadingAudio ? 'Subiendo Pista...' : 'Guardar y Activar Pista Oficial'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PATROCINADORES & NOTIFICACIONES DE PARTIDOS (TURNOS)        */}
      {/* ============================================================== */}
      {activeSubTab === 'sponsors' && (
        <div className="flex flex-col gap-4">
          {/* Rules & Requirements Card */}
          <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Reglamento Oficial de Sponsors
              </span>
              <span className="text-[10px] font-bold text-amber-400">
                {club?.reputation || 1000} / 1200 pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Requisito Mínimo</span>
                <span className="text-xs font-bold text-white">1.200 pts Reputación</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Antes no podrás ser ni visto por ellos</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Reputación x Partido</span>
                <span className="text-xs font-bold text-emerald-400">+10 Win · +2 Emp · -5 Der</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Calculado al pitido final</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex flex-col gap-1.5">
              <span>
                🏟️ <strong>Capacidad de Sponsors por Estadio:</strong> Inicias con máximo <strong>1 sponsor</strong>. Conforme amplías tu estadio de nivel 0 a <strong>Nivel 10 (MONUMENTAL)</strong> podrás tener hasta <strong>20 sponsors</strong> simultáneos.
              </span>
              <span className="text-amber-300 text-[10px]">
                ⚡ <em>El Monumental requiere 50 Millones de costo, 1.500 de reputación, 20 Millones de fans y 2 semanas de construcción.</em>
              </span>
            </div>
          </div>

          {/* Pending Sponsor Offers Received */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
              <span>Ofertas de Patrocinio Recibidas</span>
              <span className="text-[10px] text-slate-500">
                {sponsorOffers.filter(o => o.status === 'pending').length} pendientes
              </span>
            </h4>

            {sponsorOffers.filter(o => o.status === 'pending').length === 0 ? (
              <div className="p-6 rounded-3xl bg-[#121826] border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-600" />
                <span className="text-xs text-slate-400 font-medium">
                  {(club?.reputation || 0) < 1200
                    ? `Tu club necesita al menos 1.200 pts de reputación para que los patrocinadores te puedan elegir (tienes ${club?.reputation || 0} pts).`
                    : 'Aún no has recibido nuevas ofertas. Los patrocinadores eligen clubes de manera aleatoria al finalizar los partidos.'}
                </span>
              </div>
            ) : (
              sponsorOffers.filter(o => o.status === 'pending').map((off) => (
                <div key={off.id} className="p-4 rounded-3xl bg-[#121826] border border-emerald-500/30 shadow-xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img src={off.sponsor_icon} alt={off.sponsor_name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                    <div>
                      <h5 className="text-sm font-black text-white">{off.sponsor_name}</h5>
                      <span className="text-[10px] text-slate-400">{off.category}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-medium">Bono de Firma</span>
                      <span className="font-bold text-emerald-400">+{off.signing_bonus.toLocaleString()} €</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-medium">Bono x Partido</span>
                      <span className="font-bold text-emerald-400">+{off.match_bonus.toLocaleString()} €</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleRejectSponsor(off.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 text-xs font-bold"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleAcceptSponsor(off.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-950/40"
                    >
                      Aceptar Patrocinio
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Match Scheduling Shifts Notifications */}
          <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Turnos Oficiales de Notificación de Partidos
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-400 uppercase">Turno Día</span>
                <span className="text-sm font-bold text-white tracking-wide">3:00 AM · 8:00 AM · 11:00 AM</span>
                <span className="text-[9px] text-slate-500">Horarios matutinos aleatorios</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] font-black text-teal-400 uppercase">Turno Tarde</span>
                <span className="text-sm font-bold text-white tracking-wide">3:00 PM · 7:00 PM · 11:00 PM</span>
                <span className="text-[9px] text-slate-500">Horarios vespertinos estelares</span>
              </div>
            </div>

            {/* Notification items */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[11px] font-bold text-slate-400">Historial de Notificaciones:</span>
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col gap-0.5">
                  <span className="font-bold text-white text-[11px]">{n.title}</span>
                  <span className="text-[10px] text-slate-400">{n.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditManagerModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
};
