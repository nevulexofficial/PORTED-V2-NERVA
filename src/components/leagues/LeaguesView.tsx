import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { League, Standing, Match } from '../../types/index.ts';
import { Trophy, Calendar, Flame, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LeaguesViewProps {
  onOpenMatchModal: () => void;
}

export const LeaguesView: React.FC<LeaguesViewProps> = ({ onOpenMatchModal }) => {
  const { club } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'table' | 'calendar'>('table');
  const [loading, setLoading] = useState(true);

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
        const [stdRes, mchRes] = await Promise.all([
          api.getLeagueStandings(selectedLeagueId),
          api.getLeagueMatches(selectedLeagueId)
        ]);
        setStandings(stdRes.standings);
        setMatches(mchRes.matches);
      } catch (err) {
        console.error('Error loading league standings:', err);
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

      {/* Table vs Calendar Toggle */}
      <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'table'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Clasificación</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'calendar'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Jornadas & Partidos</span>
        </button>
      </div>

      {activeTab === 'table' ? (
        /* Standings Table */
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
                      ? 'bg-emerald-500/10 font-bold'
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
                    <span className="truncate text-xs font-semibold text-white">
                      {st.club_name}
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
      ) : (
        /* Matches Calendar & Results */
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onOpenMatchModal}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg touch-press mb-1"
          >
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>Simular Siguiente Jornada Oficial</span>
          </button>

          {matches.map((m) => {
            const isFinished = m.status === 'finished';

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-between"
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
                  ) : (
                    <div className="text-[10px] font-bold text-amber-400 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      Jornada {m.matchday}
                    </div>
                  )}
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    {isFinished ? 'Finalizado' : 'Por disputar'}
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
    </div>
  );
};
