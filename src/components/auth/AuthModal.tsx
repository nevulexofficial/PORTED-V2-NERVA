import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Shield, Sparkles, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { NervaCloudIcon } from '../common/NervaCloudIcon.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, showToast } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Nombre de usuario obligatorio', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!displayName.trim()) {
          showToast('Nombre visible obligatorio', 'error');
          setLoading(false);
          return;
        }
        await register(username.trim(), displayName.trim(), clubName.trim());
      } else {
        await login(username.trim());
      }
      onClose();
    } catch (err) {
      // toast shown in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-slate-800 p-6 shadow-2xl flex flex-col gap-4">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center gap-1.5 pb-2">
          <NervaCloudIcon className="w-16 h-16 mb-1" glow={true} />
          <span className="font-sports text-3xl tracking-widest text-white font-bold">
            NERVA MANAGER
          </span>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Funda tu club e inicia tu carrera' : 'Inicia sesión para dirigir tu plantilla'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1">
            Nombre de usuario (único)
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ej. manager_crack"
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </label>

          {isRegister && (
            <>
              <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1">
                Tu nombre de entrenador
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ej. Carlos Ancelotti"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </label>

              <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1">
                Nombre de tu Club de Fútbol
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="ej. Valkiria FC"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition touch-press mt-1"
          >
            {loading ? 'Cargando...' : isRegister ? 'Fundar Mi Club' : 'Entrar al Club'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="flex items-center justify-center pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            {isRegister ? '¿Ya tienes un club? Inicia sesión' : '¿Nuevo director técnico? Regístrate gratis'}
          </button>
        </div>
      </div>
    </div>
  );
};
