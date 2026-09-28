import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Match, Auction, Standing } from '../../types/index.ts';
import { 
  Trophy, Flame, ShoppingBag, ArrowRight, 
  ChevronRight, Calendar, Sparkles, AlertCircle, Tv, Shield
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';

interface HomeDashboardProps {
  onNavigateTab: (tab: any) => void;
  onOpenMatchModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigateTab, onOpenMatchModal }) => {
  const { club, user, showToast } = useAuth();
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [featuredAuctions, setFeaturedAuctions] = useState<Auction[]>([]);
  const [myStanding, setMyStanding] = useState<Standing | null>(null);
  const [loading, setLoading] = useState(true);
  const [peruTime, setPeruTime] = useState<string>('');

  useEffect(() => {
    const updatePeruClock = () => {
      setPeruTime(new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }));
    };
    updatePeruClock();
    const interval = setInterval(updatePeruClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        if (!club) return;
        const [leaguesRes, auctionsRes] = await Promise.all([
          api.getLeagues(),
          api.getAuctions()
        ]);

        const leagueId = club.league_id || leaguesRes.leagues[0]?.id;
        if (leagueId) {
          const [standingsRes, matchesRes] = await Promise.all([
            api.getLeagueStandings(leagueId),
            api.getLeagueMatches(leagueId)
          ]);
          const currentStanding = standingsRes.standings.find(s => s.club_id === club.id);
          setMyStanding(currentStanding || null);

          const scheduled = matchesRes.matches.find(m => 
            (m.home_club_id === club.id || m.away_club_id === club.id) && m.status === 'scheduled'
          );
          setNextMatch(scheduled || matchesRes.matches[0] || null);
        }

        setFeaturedAuctions(auctionsRes.auctions.slice(0, 2));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [club]);

  return (
    <div className="flex flex-col gap-4 pb-20 pt-2 px-4 max-w-md mx-auto">
      {/* PWA In-App Install Prompt Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">App Oficial NERVA</h4>
            <p className="text-[10px] text-slate-400 truncate">Instala en tu teléfono para jugar a pantalla completa</p>
          </div>
        </div>
        <PWAInstallButton />
      </div>

      {/* Hero Club Banner & Stadium */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#121826] shadow-xl">
        <div className="h-36 w-full relative">
          <img
            src={club?.banner_url || '/src/assets/images/stadium_banner_pitch_1790393808701.jpg'}
            alt="Estadio del Club"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121826] via-[#121826]/60 to-transparent" />
        </div>

        <div className="relative px-5 pb-5 -mt-10 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-slate-900 shadow-2xl shrink-0 p-1">
                <img
                  src={club?.crest_url || '/src/assets/images/crest_titan_fc_1790393819091.jpg'}
                  alt={club?.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-white tracking-tight truncate">
                  {club?.name || 'Mi Club'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="text-emerald-400 font-semibold">{club?.formation || '4-3-3'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Nivel {club?.division_tier || 1}</span>
                  <span aria-hidden="true">·</span>
                  <span>{club?.matches_won || 0}V - {club?.matches_drawn || 0}E - {club?.matches_lost || 0}D</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex flex-col bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 font-medium">Presupuesto</span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {user ? (user.coins >= 1000000 ? `${(user.coins / 1000000).toFixed(2)}M` : `${(user.coins / 1000).toFixed(0)}K`) : '0'}
              </span>
            </div>
            <div className="flex flex-col bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 font-medium">Valoración</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                {club ? `${(club.valuation / 1000000).toFixed(1)}M` : '0M'}
              </span>
            </div>
            <div className="flex flex-col bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/50">
              <span className="text-[10px] text-slate-400 font-medium">Posición Liga</span>
              <span className="text-sm font-bold text-white tabular-nums">
                #{myStanding ? (myStanding.points > 25 ? '1' : '2') : '1'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Match Card / Matchday CTA */}
      <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Próximo Partido Oficial
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold border border-slate-700">
              🇵🇪 {peruTime || '15:00:00'} PET
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              Jornada {nextMatch?.matchday || 15}
            </span>
          </div>
        </div>

        {nextMatch ? (
          <div className="flex items-center justify-between bg-slate-900/80 rounded-2xl p-4 border border-slate-800/80">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-800/90 p-1.5 border border-slate-700">
                <img
                  src={nextMatch.home_crest || '/src/assets/images/crest_titan_fc_1790393819091.jpg'}
                  alt={nextMatch.home_club_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-black text-white truncate max-w-full text-center">
                {nextMatch.home_club_name}
              </span>
              <span className="text-[10px] text-slate-400">Local</span>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center justify-center px-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                <span className="font-sports text-sm font-bold text-amber-400">VS</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-mono tabular-nums">90 MIN</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-800/90 p-1.5 border border-slate-700">
                <img
                  src={nextMatch.away_crest || '/src/assets/images/crest_vanguard_cf_1790393833910.jpg'}
                  alt={nextMatch.away_club_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-black text-white truncate max-w-full text-center">
                {nextMatch.away_club_name}
              </span>
              <span className="text-[10px] text-slate-400">Visitante</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            Cargando calendario oficial...
          </div>
        )}

        <button
          onClick={() => onNavigateTab('tv')}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 touch-press"
        >
          <Tv className="w-4 h-4 text-white animate-pulse" />
          <span>Sintonizar Transmisión en Vivo (Horario Perú)</span>
        </button>
      </div>

      {/* Quick Navigation Cards with Varied Colorful Section Icons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateTab('tv')}
          className="flex flex-col p-3.5 rounded-2xl bg-[#121826] border border-rose-500/20 hover:border-rose-500/40 text-left transition touch-press"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
            <Tv className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-white">Transmisión TV</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Partidos oficiales en vivo</span>
        </button>

        <button
          onClick={() => onNavigateTab('market')}
          className="flex flex-col p-3.5 rounded-2xl bg-[#121826] border border-emerald-500/20 hover:border-emerald-500/40 text-left transition touch-press"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">Mercado & IA</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Fichajes y subastas 6m</span>
        </button>

        <button
          onClick={() => onNavigateTab('club')}
          className="flex flex-col p-3.5 rounded-2xl bg-[#121826] border border-amber-500/20 hover:border-amber-500/40 text-left transition touch-press"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">Sede del Club</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Nivel 0-80 y Estadio</span>
        </button>

        <button
          onClick={() => onNavigateTab('leagues')}
          className="flex flex-col p-3.5 rounded-2xl bg-[#121826] border border-purple-500/20 hover:border-purple-500/40 text-left transition touch-press"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">Ligas & Estadísticas</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Pichichi y tabla oficial</span>
        </button>
      </div>

      {/* Live Auctions Section */}
      <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Subastas en Vivo
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('market')}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredAuctions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {featuredAuctions.map((auc) => (
              <div
                key={auc.id}
                onClick={() => onNavigateTab('market')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer touch-press"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={auc.player.avatar_url}
                      alt={auc.player.first_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {auc.player.first_name} {auc.player.last_name}
                      </span>
                      <span className="text-[10px] font-extrabold px-1 rounded bg-slate-800 text-emerald-400">
                        {auc.player.position}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      OVR <strong className="text-white font-semibold">{auc.player.rating}</strong> · Potencial {auc.player.potential}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="text-xs font-extrabold text-amber-400 tabular-nums">
                    {auc.current_bid.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Puja actual</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No hay subastas activas en este momento.
          </div>
        )}
      </div>
    </div>
  );
};
