import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { 
  X, Crown, CheckCircle2, Sparkles, Shield, 
  Palette, Flame, ArrowRight, Zap 
} from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  const { user, showToast, refreshUserData } = useAuth();
  const [premiumCode, setPremiumCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiumCode.trim()) {
      showToast('Introduce un código Premium válido', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.claimPremium(premiumCode.trim());
      showToast(res.message, 'success');
      refreshUserData();
      setPremiumCode('');
    } catch (err: any) {
      showToast(err.message || 'Código Premium inválido o ya utilizado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    { title: 'Personalización Total del Club', desc: 'Sube escudos y banners independientes de alta fidelidad sin restricciones.' },
    { title: 'Insignia VIP Dorada', desc: 'Emblema distintivo en clasificaciones, partidos y subastas.' },
    { title: 'Prioridad de Fichajes', desc: 'Alertas inmediatas de finalización de subastas y nuevos talentos en mercado.' },
    { title: 'Simulación Táctica Avanzada', desc: 'Desglose detallado del rendimiento por línea y estadísticas individuales.' },
    { title: 'Cosméticos y Banners Exclusivos', desc: 'Acceso al catálogo de texturas y banners dorados de élite.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#121826] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Suscripción Premium VIP</h2>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wide">Acceso de Élite a NERVA</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          user?.premium_active
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <div>
            <span className="text-xs font-bold block">
              {user?.premium_active ? '¡Tu cuenta es VIP Activa!' : 'Actualmente en Cuenta Estándar'}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {user?.premium_active && user?.premium_expires_at
                ? `Válido hasta el ${new Date(user.premium_expires_at).toLocaleDateString()} a las ${new Date(user.premium_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Canjea un código de 7 días para desbloquear todas las ventajas.'}
            </p>
          </div>
          <Crown className={`w-6 h-6 ${user?.premium_active ? 'text-amber-400' : 'text-slate-600'}`} />
        </div>

        {/* List of Perks */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Ventajas & Funciones Exclusivas
          </h3>
          {perks.map((p, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">{p.title}</h4>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section 18: Formulario Reclamar Premium */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Reclamar Premium
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Introduce tu código Premium para activar 7 días de suscripción completa.
            </p>
          </div>

          <form onSubmit={handleClaim} className="flex flex-col gap-2.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Código Premium:
              <input
                type="text"
                value={premiumCode}
                onChange={(e) => setPremiumCode(e.target.value)}
                placeholder="Ej. NERVAVIP7 o PROMANAGER7"
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase tracking-widest font-mono"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition touch-press"
            >
              {loading ? 'Validando en servidor...' : 'RECLAMAR PREMIUM'}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          *Al vencer el período Premium, tus logros, trofeos, cosméticos e historial permanecen intactos para siempre.
        </p>
      </div>
    </div>
  );
};
