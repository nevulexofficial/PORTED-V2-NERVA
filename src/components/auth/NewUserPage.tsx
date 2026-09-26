import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Shield, User, Camera, Upload, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

interface NewUserPageProps {
  onSuccess?: () => void;
}

export const NewUserPage: React.FC<NewUserPageProps> = ({ onSuccess }) => {
  const { login, register, showToast } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...');

  // Register Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [clubName, setClubName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [crestPreview, setCrestPreview] = useState<string>('/src/assets/images/crest_titan_fc_1790393819091.jpg');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCrest, setUploadingCrest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Handle Real File Upload for Avatar
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('La imagen no debe superar los 10MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadImage(base64, file.name);
        setAvatarPreview(res.url);
        showToast('Foto de mánager subida con éxito', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error al subir la imagen', 'error');
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Real File Upload for Club Crest
  const handleCrestFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('La imagen no debe superar los 10MB', 'error');
      return;
    }

    setUploadingCrest(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadImage(base64, file.name);
        setCrestPreview(res.url);
        showToast('Escudo de club subido con éxito', 'success');
      } catch (err: any) {
        showToast(err.message || 'Error al subir escudo', 'error');
      } finally {
        setUploadingCrest(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Registration
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      showToast('Introduce usuario y nombre de mánager', 'error');
      return;
    }

    if (!password || password.length < 4) {
      showToast('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }

    setLoading(true);
    setLoadingText('Fundando club y registrando en la base de datos...');
    try {
      await register(
        username.trim().toLowerCase(), 
        password, 
        displayName.trim(), 
        clubName.trim() || undefined,
        avatarPreview,
        crestPreview
      );

      showToast('¡Cuenta y club fundados con éxito!', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error al registrar la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      showToast('Introduce tu nombre de usuario', 'error');
      return;
    }

    if (!loginPassword) {
      showToast('Introduce tu contraseña', 'error');
      return;
    }

    setLoading(true);
    setLoadingText('Verificando credenciales en base de datos...');
    try {
      await login(loginUsername.trim().toLowerCase(), loginPassword);
      showToast('Sesión iniciada con éxito', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Credenciales inválidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto relative select-none">
      {/* Background athletic glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-0.5 shadow-2xl shadow-emerald-500/20 mb-3 flex items-center justify-center">
          <div className="w-full h-full bg-[#0a0e17] rounded-[22px] flex items-center justify-center">
            <span className="font-sports text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-amber-300">
              N
            </span>
          </div>
        </div>

        <h1 className="font-sports text-3xl font-bold tracking-widest text-white">
          NERVA
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">
          Web Manager de Fútbol Oficial
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl p-5 shadow-2xl relative z-10 flex flex-col gap-4">
        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-950 border border-slate-800/80">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Crear Cuenta</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Iniciar Sesión</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-1" />
            <span className="text-xs font-bold text-white">{loadingText}</span>
            <span className="text-[10px] text-slate-400">Base de datos Firestore sincronizada</span>
          </div>
        )}

        {/* REGISTER FORM */}
        {!loading && mode === 'register' && (
          <form onSubmit={handleSubmitRegister} className="flex flex-col gap-3.5">
            {/* Real File Upload Avatar */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 p-0.5">
                  <img
                    src={avatarPreview}
                    alt="Avatar Mánager"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-emerald-500 transition">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white">Foto de Mánager</span>
                <span className="text-[10px] text-slate-400">
                  {uploadingAvatar ? 'Subiendo imagen real...' : 'Toca el icono para subir tu foto real'}
                </span>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Usuario Mánager (@handle)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. guardiola_26"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nombre del Director Técnico
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ej. Pep Guardiola"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nombre de tu Club
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="ej. Titans FC"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Club Crest Upload Preview */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 p-0.5 shrink-0">
                  <img src={crestPreview} alt="Escudo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Escudo Oficial</span>
                  <span className="text-[10px] text-slate-400">
                    {uploadingCrest ? 'Subiendo escudo...' : 'Sube tu logo o escudo propio'}
                  </span>
                </div>
              </div>

              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCrestFile}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition touch-press"
            >
              <span>Crear Cuenta & Fundar Club</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {!loading && mode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="flex flex-col gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="ej. guardiola_26"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition touch-press"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <p className="text-[10px] text-slate-500 text-center mt-6">
        NERVA Manager · Cuentas reales autenticadas y sincronizadas en la base de datos
      </p>
    </div>
  );
};
