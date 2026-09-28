import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { League, Standing, Match, Player } from '../../types/index.ts';
import { 
  Trophy, Calendar, Flame, ChevronRight, ArrowUpRight, ArrowDownRight, 
  BarChart3, Medal, Award, Shield, Target, Clock, Star, Users
} from 'lucide-react';

interface LeaguesViewProps {
  onOpenMatchModal: () => void;
}

export const LeaguesView: React.FC<LeaguesViewProps> = ({ onOpenMatchModal }) => {
  const { club } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'calendar' | 'stats'>('table');
  const [statsSubTab, setStatsSubTab] = useState<'scorers' | 'assists' | 'goalkeepers' | 'mvp' | 'teams'>('scorers');
  const [loading, setLoading] = useState(true);

  // Live Peru Time (PET / UTC-5)
  const [peruTime, setPeruTime] = useState<string>('');
  useEffect(() => {
    const updatePeruClock = () => {
      const now = new Date();
      setPeruTime(now.toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    };
    updatePeruClock();
    const interval = setInterval(updatePeruClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadLeagues() {
      try {
        const res = await api.getLeagues();
        setLeagues(res.leagues);
        const initialId = club?.league_id || res.leagues[0]?.id || '';
        setSelectedLeagueId(initialId);
      } catch (err) {
        console.error('Error fetching leagues:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeagues();
  }, [club]);

  useEffect(() => {
    if (!selectedLeagueId) return;
    async function loadLeagueDetails() {
      try {
        const [stdRes, mchRes, statsRes] = await Promise.all([
          api.getLeagueStandings(selectedLeagueId),
          api.getLeagueMatches(selectedLeagueId),
          api.getLeagueStats(selectedLeagueId).catch(() => ({ stats: null }))
        ]);
        setStandings(stdRes.standings);
        setMatches(mchRes.matches);
        if (statsRes && statsRes.stats) {
          setStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Error loading league data:', err);
      }
    }
    loadLeagueDetails();
  }, [selectedLeagueId]);

  const currentLeague = leagues.find(l => l.id === selectedLeagueId);

  return (
    <div className="flex flex-col gap-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* League Switcher Selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Competición Oficial
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">{currentLeague?.season || '2026/2027'}</span>
        </div>

        {/* Live Peru Clock Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Horario Oficial Perú:</span>
          </div>
          <span className="font-mono font-black text-amber-400 tabular-nums">
            {peruTime || '15:00:00'} (PET / UTC-5)
          </span>
        </div>

        {/* League Horizontal Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {leagues.map((leg) => (
            <button
              key={leg.id}
              onClick={() => setSelectedLeagueId(leg.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
                selectedLeagueId === leg.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                  : 'bg-[#121826] text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{leg.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* League Banner Info Card */}
      {currentLeague && (
        <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">División Nivel {currentLeague.tier}</span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              {currentLeague.promotion_league_id && (
                <span className="flex items-center text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3 h-3" /> Ascenso habilitado
                </span>
              )}
              {currentLeague.relegation_league_id && (
                <span className="flex items-center text-rose-400 font-medium">
                  <ArrowDownRight className="w-3 h-3" /> Descenso activo
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{currentLeague.description}</p>
        </div>
      )}

      {/* 3-Tab Selector: Clasificación, Calendario, Estadísticas */}
      <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'table'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Tabla</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'calendar'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Partidos</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'stats'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Estadísticas</span>
        </button>
      </div>

      {/* TAB 1: CLASIFICACIÓN */}
      {activeTab === 'table' && (
        <div className="rounded-3xl bg-[#121826] border border-slate-800 overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-12 py-3 px-3.5 bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            <span className="col-span-1 text-left">#</span>
            <span className="col-span-5 text-left">Club</span>
            <span className="col-span-2">PJ</span>
            <span className="col-span-2">DIF</span>
            <span className="col-span-2 font-black text-emerald-400">PTS</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {standings.map((st, idx) => {
              const isMyClub = club && club.id === st.club_id;
              const isChampionZone = idx === 0;
              const isPromotionZone = idx > 0 && idx < 3;
              const isRelegationZone = idx >= standings.length - 1 && standings.length > 2;

              return (
                <div
                  key={st.id}
                  className={`grid grid-cols-12 py-3 px-3.5 items-center text-xs transition ${
                    isMyClub
                      ? 'bg-emerald-500/15 font-bold border-l-2 border-emerald-400'
                      : 'hover:bg-slate-900/40 text-slate-200'
                  }`}
                >
                  {/* Position */}
                  <div className="col-span-1 flex items-center">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                        isChampionZone
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : isPromotionZone
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isRelegationZone
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Club info */}
                  <div className="col-span-5 flex items-center gap-2 min-w-0 pr-1">
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700/60">
                      <img src={st.crest_url || '/src/assets/images/crest_titan_fc_1790393819091.jpg'} alt={st.club_name} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate text-xs font-semibold text-white flex items-center gap-1 min-w-0">
                      <span className="truncate">{st.club_name}</span>
                      {isMyClub && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shrink-0">
                          TÚ
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Played */}
                  <span className="col-span-2 text-center text-slate-400 tabular-nums">
                    {st.played}
                  </span>

                  {/* Goal Diff */}
                  <span className={`col-span-2 text-center tabular-nums text-[11px] ${
                    st.goal_diff > 0 ? 'text-emerald-400' : st.goal_diff < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {st.goal_diff > 0 ? `+${st.goal_diff}` : st.goal_diff}
                  </span>

                  {/* Points */}
                  <span className="col-span-2 text-center font-black text-sm text-white tabular-nums">
                    {st.points}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Table Legend */}
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-around">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Líder / Campeón
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ascenso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Descenso
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: JORNADAS & PARTIDOS (TIEMPO REAL / HORARIO PERÚ) */}
      {activeTab === 'calendar' && (
        <div className="flex flex-col gap-2.5">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Turnos Oficiales en Vivo</span>
                <span className="text-[10px] text-slate-400">11:00 PET · 15:00 PET · 20:00 PET</span>
              </div>
            </div>
            <button
              onClick={onOpenMatchModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md touch-press"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>Ver en Vivo</span>
            </button>
          </div>

          {matches.map((m, idx) => {
            const isFinished = m.status === 'finished';
            const isLive = m.status === 'live';
            const slots = ['11:00 PET', '15:00 PET', '20:00 PET'];
            const assignedSlot = slots[idx % slots.length];

            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl bg-[#121826] border flex items-center justify-between transition ${
                  isLive ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'
                }`}
              >
                {/* Home */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                    <img src={m.home_crest} alt={m.home_club_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-white truncate">{m.home_club_name}</span>
                </div>

                {/* Score / Status */}
                <div className="flex flex-col items-center px-3 shrink-0">
                  {isFinished ? (
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                      <span className="text-sm font-black text-white tabular-nums">{m.home_score}</span>
                      <span className="text-xs text-slate-500">-</span>
                      <span className="text-sm font-black text-white tabular-nums">{m.away_score}</span>
                    </div>
                  ) : isLive ? (
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 animate-pulse">
                      <span>🔴 EN DIRECTO</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      🇵🇪 {assignedSlot}
                    </div>
                  )}
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {isFinished ? 'Finalizado' : isLive ? 'Disputándose 1:1' : `Jornada ${m.matchday}`}
                  </span>
                </div>

                {/* Away */}
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                  <span className="text-xs font-bold text-white truncate">{m.away_club_name}</span>
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                    <img src={m.away_crest} alt={m.away_club_name} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: ESTADÍSTICAS DE LA LIGA */}
      {activeTab === 'stats' && (
        <div className="flex flex-col gap-3">
          {/* Sub Navigation */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setStatsSubTab('scorers')}
              className={`py-1.5 rounded-lg transition ${
                statsSubTab === 'scorers' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Goleadores
            </button>
            <button
              onClick={() => setStatsSubTab('assists')}
              className={`py-1.5 rounded-lg transition ${
                statsSubTab === 'assists' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Asistencias
            </button>
            <button
              onClick={() => setStatsSubTab('goalkeepers')}
              className={`py-1.5 rounded-lg transition ${
                statsSubTab === 'goalkeepers' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Zamora
            </button>
            <button
              onClick={() => setStatsSubTab('teams')}
              className={`py-1.5 rounded-lg transition ${
                statsSubTab === 'teams' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Equipos
            </button>
          </div>

          {/* Quick League Overview Card */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-[#121826] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Goles Totales</span>
              <span className="text-base font-black text-amber-400 tabular-nums">
                {stats?.totalGoals || 68}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#121826] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Promedio/Partido</span>
              <span className="text-base font-black text-emerald-400 tabular-nums">
                {stats?.avgGoals || '2.83'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#121826] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Mejor Ataque</span>
              <span className="text-xs font-black text-white truncate block">
                {stats?.bestAttack?.club_name || 'Titan FC'}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">
                {stats?.bestAttack?.goals || 28} goles
              </span>
            </div>
          </div>

          {/* Sub Tab: Goleadores (Pichichi) */}
          {statsSubTab === 'scorers' && (
            <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Tabla de Goleadores (Trofeo Pichichi)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Goles / Partidos</span>
              </div>

              <div className="flex flex-col divide-y divide-slate-800/60">
                {(stats?.topScorers || []).slice(0, 10).map((p: any, idx: number) => {
                  const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 font-black text-sm text-center ${medalColors[idx] || 'text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&auto=format&fit=crop&q=80'}
                          alt={p.last_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{p.first_name} {p.last_name}</span>
                            <span className="text-[9px] font-black px-1 rounded bg-slate-800 text-emerald-400">
                              {p.position}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {p.club_name || 'Club de Liga'} · OVR {p.rating}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-400 tabular-nums">
                          {p.goals || 0}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {(p.matches_played || 12)} PJ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub Tab: Asistencias */}
          {statsSubTab === 'assists' && (
            <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Líderes en Asistencias (Visión de Juego)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Asistencias</span>
              </div>

              <div className="flex flex-col divide-y divide-slate-800/60">
                {(stats?.topAssists || []).slice(0, 10).map((p: any, idx: number) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-black text-sm text-center text-slate-400">
                        {idx + 1}
                      </span>
                      <img
                        src={p.avatar_url}
                        alt={p.last_name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{p.first_name} {p.last_name}</span>
                          <span className="text-[9px] font-black px-1 rounded bg-slate-800 text-teal-400">
                            {p.position}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{p.club_name || 'Club'} · OVR {p.rating}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-teal-400 tabular-nums">
                        {p.assists || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block">pases de gol</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub Tab: Porteros (Zamora) */}
          {statsSubTab === 'goalkeepers' && (
            <div className="rounded-3xl bg-[#121826] border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Trofeo Zamora (Mejores Guardametas)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Valla Invicta</span>
              </div>

              <div className="flex flex-col divide-y divide-slate-800/60">
                {(stats?.topGoalkeepers || []).map((p: any, idx: number) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-black text-sm text-center text-slate-400">
                        {idx + 1}
                      </span>
                      <img
                        src={p.avatar_url}
                        alt={p.last_name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{p.first_name} {p.last_name}</span>
                          <span className="text-[9px] font-black px-1 rounded bg-slate-800 text-amber-400">
                            POR
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{p.club_name || 'Club'} · OVR {p.rating}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 tabular-nums block">
                        {p.clean_sheets || 4} imbatidos
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {p.goals_conceded || 8} recibidos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub Tab: Equipos */}
          {statsSubTab === 'teams' && (
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Rendimiento Colectivo de la Liga
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Mejor Ataque</span>
                    <span className="text-sm font-black text-white block mt-0.5">
                      {stats?.bestAttack?.club_name || 'Titan FC'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      +{stats?.bestAttack?.goals || 28} goles anotados
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Mejor Defensa</span>
                    <span className="text-sm font-black text-white block mt-0.5">
                      {stats?.bestDefense?.club_name || 'Vanguard CF'}
                    </span>
                    <span className="text-xs font-bold text-teal-400">
                      {stats?.bestDefense?.goals_conceded || 8} goles concedidos
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Equipos Registrados</span>
                      <span className="text-[10px] text-slate-400">Competencia 100% activa en vivo</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white tabular-nums">
                    {standings.length} clubes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
