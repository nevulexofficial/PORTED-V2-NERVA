import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { 
  X, Gift, Crown, Terminal, Shield, 
  LogOut, Bell, Moon, ChevronRight, CheckCircle2, User 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPremium: () => void;
  onOpenLabs: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenPremium,
  onOpenLabs,
}) => {
  const { user, club, logout, showToast, refreshUserData, updateUserCoinsLocally } = useAuth();
  const [code, setCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);

  if (!isOpen) return null;

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Introduce un código válido', 'error');
      return;
    }
    setLoadingCode(true);
    try {
      const res = await api.redeemCode(code.trim());
      showToast(res.message, 'success');
      if (res.coins !== undefined) {
        updateUserCoinsLocally(res.coins);
      }
      refreshUserData();
      setCode('');
    } catch (err: any) {
      showToast(err.message || 'Código inválido o ya utilizado', 'error');
    } finally {
      setLoadingCode(false);
    }
  };

  const isLabsAuthorized = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#121826] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            Ajustes de NERVA
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.display_name}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <h3 className="text-xs font-black text-white">{user?.display_name}</h3>
              <p className="text-[10px] text-slate-400">@{user?.username} · Club: {club?.name}</p>
              <span className="inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Rol: {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Section 19: Codes Redemption (DEV S / DEVS & Secret Owner Code) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Canjear Códigos & Recompensas
            </h3>
          </div>
          <p className="text-[10px] text-slate-400">
            Introduce un código de bonificación (ej. <strong>DEVS</strong> para 400.000 monedas) o código de autorización especial.
          </p>

          <form onSubmit={handleRedeemCode} className="flex gap-2 mt-1">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Escribe el código..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase tracking-widest font-mono"
            />
            <button
              type="submit"
              disabled={loadingCode}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition touch-press"
            >
              {loadingCode ? '...' : 'Canjear'}
            </button>
          </form>
        </div>

        {/* Navigation list */}
        <div className="flex flex-col gap-1.5">
          {/* Premium Page Button */}
          <button
            onClick={() => {
              onClose();
              onOpenPremium();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition touch-press"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Suscripción VIP Premium</span>
                <span className="text-[10px] text-slate-400">Ventajas, personalización y códigos</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Labs Admin Panel Trigger - Visible only for Admin & Owner per Section 21 */}
          {isLabsAuthorized && (
            <button
              onClick={() => {
                onClose();
                onOpenLabs();
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 transition touch-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-emerald-400 block">Labs (Panel de Administración)</span>
                  <span className="text-[10px] text-emerald-300/80">Gestión de usuarios, clubes, ligas y códigos</span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                {user?.role}
              </span>
            </button>
          )}

          {/* Notifications config */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300">Notificaciones de partidos</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Activas</span>
          </div>

          {/* Theme config */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-300">Tema Oscuro Deportivo</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Nerva Dark</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition touch-press mt-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
