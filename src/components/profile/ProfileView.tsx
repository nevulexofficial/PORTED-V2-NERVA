import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import type { Trophy, Achievement, CosmeticItem } from '../../types/index.ts';
import { EditManagerModal } from './EditManagerModal.tsx';
import { 
  User, Crown, Award, Shield, Coins, 
  Settings, Sparkles, CheckCircle2, Lock, Gift, ExternalLink,
  Trophy as TrophyIcon, Edit2, Globe, Sliders
} from 'lucide-react';

interface ProfileViewProps {
  onOpenSettings: () => void;
  onOpenPremium: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenSettings, onOpenPremium }) => {
  const { user, club } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>([]);
  const [activeTab, setActiveTab] = useState<'achievements' | 'trophies' | 'cosmetics'>('achievements');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function loadProfileItems() {
      try {
        const [achRes, trpRes, cosRes] = await Promise.all([
          api.getAchievements(),
          api.getTrophies(),
          api.getCosmetics()
        ]);
        setAchievements(achRes.achievements);
        setTrophies(trpRes.trophies);
        setCosmetics(cosRes.cosmetics);
      } catch (err) {
        console.error('Error fetching profile assets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileItems();
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="flex flex-col gap-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-[#121826] border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/60 p-0.5">
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.display_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              {user?.role === 'owner' && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase shadow-md">
                  OWNER
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white">{user?.display_name}</h2>
              </div>
              <p className="text-xs text-slate-400">@{user?.username}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                <span>Club: <strong className="text-white">{club?.name}</strong></span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{user?.role}</span>
              </div>
              {user?.nationality && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-400">
                  🌍 {user.nationality} · {user.tactical_style || 'Táctica Ofensiva'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition touch-press"
              title="Editar Perfil del Mánager"
            >
              <Edit2 className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition touch-press"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Manager Bio if present */}
        {user?.bio && (
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 italic">
            "{user.bio}"
          </div>
        )}

        {/* Premium Status Pill */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${user?.premium_active ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Estado Premium</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${user?.premium_active ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                  {user?.premium_active ? 'ACTIVO' : 'FREE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {user?.premium_active && user?.premium_expires_at
                  ? `Expira el ${new Date(user.premium_expires_at).toLocaleDateString()}`
                  : 'Desbloquea escudos, banners e insignias VIP'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPremium}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition touch-press"
          >
            {user?.premium_active ? 'Gestionar' : 'Activar VIP'}
          </button>
        </div>

        {/* Color Personalizado en Premium */}
        {user?.premium_active && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Color de Acento Manager VIP
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {user.theme_color || '#10b981'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Personaliza el color de tu perfil, auras y distintivos exclusivos como miembro Premium:
            </p>
            <div className="flex items-center gap-2 pt-1">
              {[
                { hex: '#10b981', label: 'Esmeralda' },
                { hex: '#f59e0b', label: 'Oro VIP' },
                { hex: '#3b82f6', label: 'Azul Real' },
                { hex: '#8b5cf6', label: 'Púrpura' },
                { hex: '#ec4899', label: 'Neón Pink' },
                { hex: '#ef4444', label: 'Rojo Furia' },
                { hex: '#06b6d4', label: 'Cyber Cyan' }
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={async () => {
                    try {
                      await api.updateProfile(undefined, undefined, c.hex);
                      // Trigger user reload
                      window.location.reload();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={`w-7 h-7 rounded-xl transition border-2 ${
                    user.theme_color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-slate-700/80 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={user.theme_color || '#10b981'}
                onChange={async (e) => {
                  try {
                    await api.updateProfile(undefined, undefined, e.target.value);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-7 h-7 rounded-xl cursor-pointer bg-transparent border-0 ml-auto"
                title="Color personalizado"
              />
            </div>
          </div>
        )}

        {/* Currency & Trophies Summary */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between px-4">
            <span className="text-xs text-slate-400 font-medium">Monedas</span>
            <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
              <Coins className="w-4 h-4" />
              <span className="tabular-nums">{user?.coins.toLocaleString()}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between px-4">
            <span className="text-xs text-slate-400 font-medium">Trofeos</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
              <TrophyIcon className="w-4 h-4" />
              <span className="tabular-nums">{trophies.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Logros vs Trofeos vs Cosméticos */}
      <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'achievements'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Logros ({unlockedCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('trophies')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'trophies'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Vitrina ({trophies.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('cosmetics')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'cosmetics'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Cosméticos</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'achievements' && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] text-slate-400 px-1">
            Los logros desbloqueados son permanentes y no se pierden al expirar Premium.
          </p>

          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                ach.unlocked
                  ? 'bg-[#121826] border-slate-800'
                  : 'bg-slate-900/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ach.unlocked
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ach.description}</p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-2">
                {ach.unlocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <Lock className="w-3 h-3" />
                    Bloqueado
                  </span>
                )}
                <span className="text-[10px] text-amber-400 font-semibold tabular-nums mt-0.5">
                  +{ach.reward_coins.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trophies' && (
        <div className="grid grid-cols-2 gap-3">
          {trophies.map((trp) => (
            <div
              key={trp.id}
              className="p-3 rounded-2xl bg-[#121826] border border-slate-800 flex flex-col items-center text-center gap-2 shadow-md"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 p-2">
                <TrophyIcon className="w-8 h-8" />
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{trp.title}</h4>
              <p className="text-[10px] text-slate-400 line-clamp-2">{trp.condition}</p>
              <span className="text-[9px] text-amber-400 font-mono mt-1">{trp.season}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cosmetics' && (
        <div className="flex flex-col gap-2.5">
          {cosmetics.map((cos) => (
            <div
              key={cos.id}
              className="p-3 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                  <img src={cos.image_url} alt={cos.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate">{cos.name}</h4>
                    {cos.is_premium && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{cos.description}</p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                Obtenido
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit Manager Profile Modal */}
      <EditManagerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
