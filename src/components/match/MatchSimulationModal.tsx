import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Match } from '../../types/index.ts';
import { syncMatchToFirestore } from '../../lib/firestoreSync.ts';
import { 
  Flame, Trophy, Coins, CheckCircle, X, Shield, 
  Activity, Play, Pause, FastForward, Clock, Award, Sparkles, 
  Sliders, Lock, RefreshCw, Calendar, ChevronRight 
} from 'lucide-react';

interface MatchSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationFinished?: () => void;
}

export const MatchSimulationModal: React.FC<MatchSimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationFinished
}) => {
  const { club, showToast, refreshUserData, updateUserCoinsLocally } = useAuth();
  
  // Daily Matches State
  const [dailyMatches, setDailyMatches] = useState<(Match & { current_elapsed_seconds: number; current_live_minute: number })[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<(Match & { current_elapsed_seconds: number; current_live_minute: number }) | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);

  // In-Game Live State
  const [currentElapsed, setCurrentElapsed] = useState<number>(0);
  const [gameMinute, setGameMinute] = useState<number>(0);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [liveEvents, setLiveEvents] = useState<{ minute: number; second: number; text: string; type: string }[]>([]);
  const [isHalfTime, setIsHalfTime] = useState<boolean>(false);

  // In-Game Tactical Adjustments
  const [mentality, setMentality] = useState<'defensive' | 'balanced' | 'attacking' | 'all_out_attack'>('balanced');
  const [formation, setFormation] = useState<string>('4-3-3');
  const [applyingTactics, setApplyingTactics] = useState(false);

  // Replay Mode Speed (Only active for finished matches)
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [replayElapsed, setReplayElapsed] = useState<number>(0);
  const [peruTime, setPeruTime] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const update = () => {
      setPeruTime(new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Daily Matches (2 per user per day)
  const loadDailyMatches = async () => {
    setLoadingDaily(true);
    try {
      const res = await api.getDailyMatches();
      setDailyMatches(res.matches || []);
      if (res.matches && res.matches.length > 0) {
        // Select live match first, or the first daily match
        const liveMatch = res.matches.find(m => m.status === 'live') || res.matches[0];
        selectMatchToView(liveMatch);
      }
    } catch (err) {
      console.error('Error fetching daily matches:', err);
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDailyMatches();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Switch between matches
  const selectMatchToView = (m: Match & { current_elapsed_seconds: number; current_live_minute: number }) => {
    setSelectedMatch(m);
    if (timerRef.current) clearInterval(timerRef.current);

    if (m.tactics?.mentality) {
      setMentality(m.tactics.mentality as any);
    }
    if (m.tactics?.formation) {
      setFormation(m.tactics.formation);
    }

    if (m.status === 'live') {
      // LIVE MATCH: Runs at real 1:1 speed, no fast-forwarding permitted
      startLiveTracking(m);
    } else if (m.status === 'finished') {
      // FINISHED MATCH: Replay mode allows fast-forwarding & full commentary review
      setHomeScore(m.home_score || 0);
      setAwayScore(m.away_score || 0);
      setReplayElapsed(240);
      setGameMinute(90);
      setLiveEvents(m.detailed_events || []);
      setIsHalfTime(false);
    } else {
      // SCHEDULED
      setHomeScore(0);
      setAwayScore(0);
      setCurrentElapsed(0);
      setGameMinute(0);
      setLiveEvents([]);
      setIsHalfTime(false);
    }
  };

  // Live Tracking for Ongoing Match (4 minutes duration = 240 seconds)
  const startLiveTracking = (match: Match & { current_elapsed_seconds: number; current_live_minute: number }) => {
    let sec = match.current_elapsed_seconds;
    setCurrentElapsed(sec);

    // Initial score and events up to current elapsed seconds
    const allEvents = match.detailed_events || [];
    const revealedEvents = allEvents.filter(e => e.second <= sec);
    setLiveEvents(revealedEvents);

    // Calculate score up to current second
    let hScore = 0;
    let aScore = 0;
    allEvents.forEach(e => {
      if (e.second <= sec && e.type === 'goal') {
        if (e.text.includes(match.home_club_name)) hScore += 1;
        else aScore += 1;
      }
    });
    setHomeScore(hScore);
    setAwayScore(aScore);

    // Check if at half-time (between 120s and 125s)
    if (sec >= 120 && sec < 125) {
      setIsHalfTime(true);
    } else {
      setIsHalfTime(false);
    }

    timerRef.current = setInterval(() => {
      sec += 1;
      setCurrentElapsed(sec);

      // Game minute calculation
      let min = 1;
      if (sec <= 120) {
        min = Math.min(45, Math.max(1, Math.floor((sec / 120) * 45)));
      } else {
        min = Math.min(90, 45 + Math.floor(((sec - 120) / 120) * 45));
      }
      setGameMinute(min);

      // Check for half-time at 120s (2:00)
      if (sec === 120) {
        setIsHalfTime(true);
      } else if (sec === 130) {
        setIsHalfTime(false);
      }

      // Reveal new events in real time
      allEvents.forEach(e => {
        if (e.second === sec) {
          setLiveEvents(prev => [e, ...prev]);
          if (e.type === 'goal') {
            if (e.text.includes(match.home_club_name)) setHomeScore(prev => prev + 1);
            else setAwayScore(prev => prev + 1);
          }
        }
      });

      // Match finished at 240s (4:00)
      if (sec >= 240) {
        if (timerRef.current) clearInterval(timerRef.current);
        match.status = 'finished';
        setSelectedMatch({ ...match, status: 'finished' });
        showToast('¡Pitido final! Partido concluido con resultado oficial.', 'success');
        syncMatchToFirestore(match);
        refreshUserData();
        if (onSimulationFinished) onSimulationFinished();
      }
    }, 1000);
  };

  // Replay Mode Fast-Forwarding (Allowed exclusively for finished matches)
  const handleReplayScrub = (targetSec: number) => {
    if (!selectedMatch || selectedMatch.status !== 'finished') return;
    setReplayElapsed(targetSec);
    const min = targetSec <= 120 ? Math.floor((targetSec / 120) * 45) : 45 + Math.floor(((targetSec - 120) / 120) * 45);
    setGameMinute(min);

    const allEvents = selectedMatch.detailed_events || [];
    setLiveEvents(allEvents.filter(e => e.second <= targetSec));

    let hScore = 0;
    let aScore = 0;
    allEvents.forEach(e => {
      if (e.second <= targetSec && e.type === 'goal') {
        if (e.text.includes(selectedMatch.home_club_name)) hScore += 1;
        else aScore += 1;
      }
    });
    setHomeScore(hScore);
    setAwayScore(aScore);
  };

  // Apply Live In-Game Tactics
  const handleApplyTactics = async () => {
    if (!selectedMatch) return;
    setApplyingTactics(true);
    try {
      const res = await api.updateMatchTactics(selectedMatch.id, mentality, formation);
      showToast(`¡Táctica aplicada! El equipo pasa a mentalidad ${mentality.toUpperCase()}`, 'success');
      
      // Add visual event immediately
      setLiveEvents(prev => [
        { 
          minute: gameMinute || 1, 
          second: currentElapsed, 
          text: `[TÁCTICA EN VIVO] El mánager ajusta la estrategia a Mentalidad ${mentality.toUpperCase()} (${formation}).`, 
          type: 'tactic' 
        }, 
        ...prev
      ]);
    } catch (err: any) {
      showToast(err.message || 'Error al aplicar táctica', 'error');
    } finally {
      setApplyingTactics(false);
    }
  };

  // Schedule an instant match (starts in 4 seconds) to test live play from 00:00
  const handleInstantLive = async () => {
    try {
      const res = await api.scheduleInstantMatch();
      showToast('¡Partido programado! Iniciando transmisión en vivo en 4 segundos...', 'info');
      await loadDailyMatches();
    } catch (err: any) {
      showToast(err.message || 'Error al programar partido', 'error');
    }
  };

  const isLive = selectedMatch?.status === 'live';
  const isFinished = selectedMatch?.status === 'finished';
  const isScheduled = selectedMatch?.status === 'scheduled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 max-h-[96vh] overflow-y-auto">
        
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                Partidos Oficiales Diarios
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  2 / DÍA
                </span>
              </h3>
              <span className="text-[10px] text-slate-400">
                4 minutos reales (2 min 1er T + 2 min 2do T)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Peru Clock Status */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-medium">🇵🇪 Horario Oficial Perú:</span>
          <span className="font-mono font-bold text-amber-400 tabular-nums">{peruTime || '15:00:00'} (PET / UTC-5)</span>
        </div>

        {/* 2 Daily Matches Selector Tabs */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {dailyMatches.map((m, idx) => {
              const active = selectedMatch?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMatchToView(m)}
                  className={`flex-1 p-2.5 rounded-2xl border text-left transition flex flex-col gap-1 ${
                    active
                      ? 'bg-slate-900 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Jornada {m.daily_slot || idx + 1}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                      m.status === 'live' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' :
                      m.status === 'finished' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {m.status === 'live' ? '● EN VIVO' : m.status === 'finished' ? 'FINAL' : 'EN ESPERA'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white truncate block">
                    vs {m.home_club_id === club?.id ? m.away_club_name : m.home_club_name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Schedule Button if both matches completed or want to test live right now */}
          <button
            onClick={handleInstantLive}
            className="py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Disputar Partido En Vivo Ahora Mismo (00:00)</span>
          </button>
        </div>

        {/* Selected Match Scoreboard */}
        {selectedMatch && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center justify-between">
              {/* Clock Display */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white text-xs">
                  {formatTime(isFinished ? replayElapsed : currentElapsed)}
                </span>
                <span>/ 04:00</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-emerald-400 font-bold border border-slate-800">
                <span className={`w-2 h-2 rounded-full ${
                  isLive ? 'bg-rose-500 animate-pulse' :
                  isHalfTime ? 'bg-amber-400 animate-bounce' : 'bg-slate-500'
                }`} />
                <span>
                  {isLive ? `EN VIVO · ${gameMinute}'` :
                   isFinished ? 'FINALIZADO' : 'PROGRAMADO'}
                </span>
              </div>
            </div>

            {/* 4-Minute Timeline Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 relative">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((isFinished ? replayElapsed : currentElapsed) / 240) * 100)}%` }}
              />
              {/* Halftime Marker at 2:00 (120s) */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400" title="Medio Tiempo" />
            </div>

            {/* Teams & Score */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 p-1 border border-slate-700 shadow-md">
                  <img src={selectedMatch.home_crest} alt={selectedMatch.home_club_name} className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] font-black text-white truncate max-w-full">
                  {selectedMatch.home_club_name}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3">
                <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">
                  {homeScore}
                </span>
                <span className="text-base text-slate-500 font-bold">-</span>
                <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">
                  {awayScore}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 p-1 border border-slate-700 shadow-md">
                  <img src={selectedMatch.away_crest} alt={selectedMatch.away_club_name} className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] font-black text-white truncate max-w-full">
                  {selectedMatch.away_club_name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODE A: LIVE MATCH (NO FAST FORWARD ALLOWED + LIVE TACTICS PANEL) */}
        {isLive && (
          <div className="flex flex-col gap-3">
            {/* Live Restrictions Banner */}
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-[10px] text-rose-300">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Partido en Directo: No es posible adelantar</span>
              </div>
              <span className="font-mono">4 MIN</span>
            </div>

            {/* Half-Time Intermission Alert */}
            {isHalfTime && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center animate-in fade-in">
                <span className="text-xs font-black text-amber-300 block">
                  ⏸️ DESCANSO DEL MEDIO TIEMPO
                </span>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Han concluido los primeros 2 minutos (45'). Ajusta las tácticas para la segunda parte.
                </p>
              </div>
            )}

            {/* Live Tactics Adjustment Console */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Pizarra Táctica en Vivo
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">
                  Instrucciones Inmediatas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-semibold block mb-1">Mentalidad</label>
                  <select
                    value={mentality}
                    onChange={(e) => setMentality(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value="defensive">🛡️ Defensiva / Contra</option>
                    <option value="balanced">⚖️ Equilibrada</option>
                    <option value="attacking">⚡ Ofensiva / Presión</option>
                    <option value="all_out_attack">🔥 Asedio Total</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-semibold block mb-1">Formación</label>
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value="4-3-3">4-3-3</option>
                    <option value="4-4-2">4-4-2</option>
                    <option value="3-5-2">3-5-2</option>
                    <option value="4-2-3-1">4-2-3-1</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyTactics}
                disabled={applyingTactics}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition touch-press"
              >
                {applyingTactics ? 'Transmitiendo orden...' : 'Aplicar Táctica al Equipo'}
              </button>
            </div>
          </div>
        )}

        {/* MODE B: FINISHED MATCH (FULL NARRATION & SCRUBBING / FAST-FORWARDING ALLOWED) */}
        {isFinished && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Repetición Oficial & Narración</span>
                <span className="text-[10px] text-slate-400">Puedes adelantar libremente</span>
              </div>

              {/* Fast Forward Slider (Scrubber) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>00:00 (Inicio)</span>
                  <span className="text-white font-mono">{formatTime(replayElapsed)}</span>
                  <span>04:00 (Final)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="240"
                  step="5"
                  value={replayElapsed}
                  onChange={(e) => handleReplayScrub(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
              </div>

              {/* Fast Forward Quick Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-bold">Adelantar:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleReplayScrub(60)}
                    className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-300 hover:text-white"
                  >
                    1 min
                  </button>
                  <button
                    onClick={() => handleReplayScrub(120)}
                    className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-amber-300 hover:text-white"
                  >
                    Medio T
                  </button>
                  <button
                    onClick={() => handleReplayScrub(180)}
                    className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-300 hover:text-white"
                  >
                    3 min
                  </button>
                  <button
                    onClick={() => handleReplayScrub(240)}
                    className="px-2 py-0.5 rounded bg-emerald-600 text-[10px] text-white font-bold"
                  >
                    Final
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live / Replay Commentary Log */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center justify-between">
            <span>Narración & Crónica Minuto a Minuto</span>
            <span className="font-mono text-[9px] text-emerald-400">{liveEvents.length} eventos</span>
          </span>

          {liveEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-2 text-center">Esperando el pitido inicial...</p>
          ) : (
            liveEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-snug border-b border-slate-900/60 pb-1">
                <span className="text-emerald-400 font-mono font-bold shrink-0">{evt.minute}'</span>
                <span className={
                  evt.type === 'goal' ? 'text-amber-300 font-bold' :
                  evt.type === 'tactic' ? 'text-cyan-300 font-semibold' :
                  evt.type === 'whistle' ? 'text-slate-200 font-bold' : 'text-slate-400'
                }>
                  {evt.text}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
