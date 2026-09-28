import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Match } from '../../types/index.ts';
import { 
  Tv, Clock, Play, Flame, Shield, Users, Radio, 
  Sparkles, AlertCircle, CheckCircle2, ChevronRight, Activity, 
  Volume2, VolumeX, EyeOff, Lock
} from 'lucide-react';

interface LiveEvent {
  minute: number;
  second: number;
  text: string;
  type: 'goal' | 'card' | 'shot' | 'corner' | 'foul' | 'tactic' | 'info';
}

export const LiveTransmissionsView: React.FC = () => {
  const { club, user, showToast, refreshUserData } = useAuth();
  
  // Real-time Peru Clock (PET UTC-5)
  const [peruTimeStr, setPeruTimeStr] = useState<string>('');
  const [peruDate, setPeruDate] = useState<Date>(new Date());

  // Matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // Sound effects
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live in-game simulation state (1:1 4-minute full match = 240 seconds total)
  const [isMatchLive, setIsMatchLive] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [gameMinute, setGameMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [ballX, setBallX] = useState(50);
  const [ballY, setBallY] = useState(50);
  const [possessionSide, setPossessionSide] = useState<'home' | 'away'>('home');

  // Tactics in live play
  const [mentality, setMentality] = useState<'equilibrada' | 'ofensiva' | 'defensiva' | 'contragolpe'>('equilibrada');
  const [formation, setFormation] = useState('4-3-3');
  const [applyingTactics, setApplyingTactics] = useState(false);

  // Scheduled Slots in Peru Time
  const SCHEDULED_SLOTS = [
    { label: 'Turno Mañana', timeString: '11:00:00', hour: 11, minute: 0 },
    { label: 'Turno Tarde', timeString: '15:00:00', hour: 15, minute: 0 },
    { label: 'Turno Noche', timeString: '20:00:00', hour: 20, minute: 0 },
  ];

  // Whistle Audio Synthesis
  const playWhistleSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2600, audioCtx.currentTime);
      osc.frequency.setValueAtTime(3200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio fallback
    }
  };

  // Play Goal Cheering Chime
  const playGoalSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch {
      // Audio fallback
    }
  };

  // Peru Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPeruDate(now);
      const str = now.toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setPeruTimeStr(str);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Daily Matches
  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await api.getDailyMatches();
      const list = res.matches || [];
      setMatches(list);
      if (list.length > 0) {
        setSelectedMatch(list[0]);
      }
    } catch (err) {
      console.error('Error fetching matches for TV:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  // Compute countdown to kickoff or determine if time is currently inside live window
  const activeSlot = SCHEDULED_SLOTS[1]; // default 15:00 PET
  const [secondsUntilKickoff, setSecondsUntilKickoff] = useState<number>(300);

  useEffect(() => {
    if (!peruTimeStr) return;
    const parts = peruTimeStr.split(':').map(Number);
    if (parts.length < 3) return;
    const currentSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    const targetSeconds = activeSlot.hour * 3600 + activeSlot.minute * 60;

    let diff = targetSeconds - currentSeconds;
    if (diff < -240) {
      // Finished today or tomorrow
      diff = 180;
    }
    setSecondsUntilKickoff(diff);

    // AUTO-KICKOFF RULE: "cuando estes en el horario asignado se jugara el partido automáticamente"
    if (diff <= 0 && diff >= -240 && !isMatchLive) {
      startLiveBroadcast();
    }
  }, [peruTimeStr]);

  // Start Live 1:1 Broadcast
  const startLiveBroadcast = () => {
    setIsMatchLive(true);
    setElapsedSec(0);
    setGameMinute(1);
    setHomeScore(0);
    setAwayScore(0);
    playWhistleSound();

    setEvents([
      { minute: 1, second: 1, text: `¡PITA EL ÁRBITRO! Arranca el partido oficial en horario estipulado de Perú.`, type: 'info' }
    ]);
  };

  // 1:1 Real-Time Match Engine (runs every second during live broadcast)
  useEffect(() => {
    if (!isMatchLive) return;

    const timer = setInterval(() => {
      setElapsedSec(prev => {
        const nextSec = prev + 1;
        // Total match duration: 240 real seconds (4 minutes total = 90 game minutes)
        const computedMinute = Math.min(90, Math.floor((nextSec / 240) * 90) + 1);
        setGameMinute(computedMinute);

        // Animated Ball Movement
        const side = Math.random() > 0.5 ? 'home' : 'away';
        setPossessionSide(side);
        setBallX(Math.floor(20 + Math.random() * 60));
        setBallY(Math.floor(20 + Math.random() * 60));

        // Periodic Live Events
        if (nextSec % 25 === 0 && computedMinute < 90) {
          const homeTeam = selectedMatch?.home_club_name || 'Local';
          const awayTeam = selectedMatch?.away_club_name || 'Visitante';
          const isHomeEvent = Math.random() > 0.45;
          const attackingTeam = isHomeEvent ? homeTeam : awayTeam;

          const rand = Math.random();
          if (rand < 0.25) {
            // GOAL EVENT!
            if (isHomeEvent) {
              setHomeScore(h => h + 1);
            } else {
              setAwayScore(a => a + 1);
            }
            playGoalSound();
            setEvents(evts => [
              {
                minute: computedMinute,
                second: nextSec,
                text: `⚽ ¡GOOOOOOL DE ${attackingTeam.toUpperCase()}! Remate impecable tras asistencia al hueco. (${isHomeEvent ? homeScore + 1 : homeScore} - ${!isHomeEvent ? awayScore + 1 : awayScore})`,
                type: 'goal'
              },
              ...evts
            ]);
          } else if (rand < 0.5) {
            // Shot on target
            setEvents(evts => [
              {
                minute: computedMinute,
                second: nextSec,
                text: `⚡ ¡Disparo peligroso de ${attackingTeam}! El guardameta se estira y desvía al tiro de esquina.`,
                type: 'shot'
              },
              ...evts
            ]);
          } else if (rand < 0.75) {
            // Card or Foul
            setEvents(evts => [
              {
                minute: computedMinute,
                second: nextSec,
                text: `🟨 Tarjeta amarilla por entrada a destiempo en tres cuartos de cancha para ${attackingTeam}.`,
                type: 'card'
              },
              ...evts
            ]);
          } else {
            // Corner
            setEvents(evts => [
              {
                minute: computedMinute,
                second: nextSec,
                text: `🚩 Tiro de esquina favorable a ${attackingTeam}. Todos al área rival.`,
                type: 'corner'
              },
              ...evts
            ]);
          }
        }

        // Half-Time at 120s
        if (nextSec === 120) {
          playWhistleSound();
          setEvents(evts => [
            { minute: 45, second: 120, text: `⏸️ FINAL DEL PRIMER TIEMPO. Los jugadores van al descanso.`, type: 'info' },
            ...evts
          ]);
        }

        // Full-Time at 240s
        if (nextSec >= 240) {
          clearInterval(timer);
          setIsMatchLive(false);
          playWhistleSound();
          setEvents(evts => [
            { minute: 90, second: 240, text: `🏁 ¡FINAL DEL PARTIDO! Silbatazo definitivo. Gran despliegue en horario oficial.`, type: 'info' },
            ...evts
          ]);
          showToast('¡Partido finalizado! Se han sumado puntos de liga y experiencia.', 'success');
          refreshUserData();
          return 240;
        }

        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatchLive, selectedMatch, homeScore, awayScore]);

  // Apply Live In-Game Tactics
  const handleApplyTactics = async () => {
    if (!selectedMatch) return;
    setApplyingTactics(true);
    try {
      await api.updateMatchTactics(selectedMatch.id, mentality, formation);
      showToast(`¡Táctica aplicada en vivo! Estrategia: ${mentality.toUpperCase()} (${formation})`, 'success');
      setEvents(prev => [
        {
          minute: gameMinute,
          second: elapsedSec,
          text: `📋 [ORDEN DEL MÁNAGER] Cambio táctico a mentalidad ${mentality.toUpperCase()} con esquema ${formation}.`,
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

  // Formatting seconds to MM:SS
  const formatCountdown = (totalSeconds: number) => {
    const s = Math.max(0, totalSeconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPreMatchLocked = !isMatchLive && secondsUntilKickoff > 0;

  return (
    <div className="flex flex-col gap-3.5 pb-28 pt-2 px-3.5 max-w-md mx-auto select-none">
      
      {/* Official Broadcast Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Tv className="w-5 h-5 text-rose-500 animate-pulse" />
            Transmisiones en Vivo
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">
            Partidos en Tiempo Real · Señal Oficial NERVA Sports TV
          </span>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl border transition ${
            soundEnabled ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={soundEnabled ? 'Silenciar Efectos de Audio' : 'Activar Audio del Partido'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Official Peru Live Clock Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🇵🇪 HORA OFICIAL PERÚ (PET):</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Sincronización horaria nacional UTC-5
            </span>
          </div>
        </div>

        <span className="font-mono text-base font-black text-amber-400 tabular-nums">
          {peruTimeStr || '15:00:00'} PET
        </span>
      </div>

      {/* Scheduled Shifts Selector */}
      <div className="grid grid-cols-3 gap-2">
        {SCHEDULED_SLOTS.map((slot, idx) => (
          <div
            key={slot.label}
            className={`p-2.5 rounded-2xl border text-center flex flex-col gap-0.5 transition ${
              idx === 1
                ? 'bg-rose-500/10 border-rose-500/50 shadow-md'
                : 'bg-slate-900/80 border-slate-800 opacity-75'
            }`}
          >
            <span className="text-[9px] font-bold uppercase text-slate-400">{slot.label}</span>
            <span className="text-xs font-black text-white font-mono">{slot.timeString.slice(0, 5)} PET</span>
            <span className={`text-[8px] font-bold ${isMatchLive && idx === 1 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
              {isMatchLive && idx === 1 ? '● EN JUEGO' : 'OFICIAL'}
            </span>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* CASE A: PREVIA / BLOQUEADA ("mientras el tiempo pasa no podras ver el partido") */}
      {/* ============================================================== */}
      {isPreMatchLocked && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121826] border border-rose-500/40 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
          {/* Faint TV scanlines background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

          {/* TV Lock Status Badge */}
          <div className="flex items-center justify-between z-10">
            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Señal en Previa · Esperando Horario Oficial
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Turno Tarde: 15:00 PET</span>
          </div>

          {/* Big Television Countdown */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Tiempo Restante para el Pitazo Inicial
            </span>
            <span className="font-mono text-3xl sm:text-4xl font-black text-rose-400 tracking-wider tabular-nums animate-pulse drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)]">
              {formatCountdown(secondsUntilKickoff)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              La señal se desbloqueará de forma automática a las 15:00:00 PET
            </span>
          </div>

          {/* Explanation Banner required by user: "mientras el tiempo pasa no podras ver el partido" */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed z-10 flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">Transmisión Protegida por Cronograma Oficial:</strong>
              <span>
                Mientras transcurre el tiempo previo, la simulación y las jugadas permanecen ocultas. En cuanto el reloj marque el horario asignado, el partido arrancará automáticamente en tiempo real.
              </span>
            </div>
          </div>

          {/* Lineups / Pre-match Preview */}
          <div className="grid grid-cols-2 gap-3 z-10">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 p-1 mb-2 border border-slate-700">
                <img src={selectedMatch?.home_crest || '/src/assets/images/crest_titan_fc_1790393819091.jpg'} alt="Home" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-black text-white truncate max-w-full">
                {selectedMatch?.home_club_name || club?.name || 'Local'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold mt-0.5">Táctica 4-3-3</span>
              <span className="text-[9px] text-slate-500">Local · Uniforme Titular</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 p-1 mb-2 border border-slate-700">
                <img src={selectedMatch?.away_crest || '/src/assets/images/crest_vanguard_cf_1790393833910.jpg'} alt="Away" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-black text-white truncate max-w-full">
                {selectedMatch?.away_club_name || 'Rival Oficial'}
              </span>
              <span className="text-[10px] text-amber-400 font-bold mt-0.5">Táctica 4-4-2</span>
              <span className="text-[9px] text-slate-500">Visitante · Uniforme Alternativo</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CASE B: PARTIDO EN VIVO (AUTOMATIC REAL-TIME BROADCAST ENGINE)  */}
      {/* ============================================================== */}
      {isMatchLive && (
        <div className="flex flex-col gap-3">
          
          {/* Main Television Pitch Canvas & Radar */}
          <div className="p-4 rounded-3xl bg-[#0f172a] border-2 border-rose-500 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
            
            {/* Top Television Scoreboard */}
            <div className="flex items-center justify-between bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-black truncate">{selectedMatch?.home_club_name || 'Local'}</span>
              </div>

              {/* Live Score & Game Minute */}
              <div className="flex flex-col items-center px-3">
                <div className="flex items-center gap-2 font-mono text-xl font-black text-amber-300">
                  <span className="tabular-nums">{homeScore}</span>
                  <span className="text-slate-500">:</span>
                  <span className="tabular-nums">{awayScore}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-mono text-[10px] font-black text-rose-400 tabular-nums">
                    {gameMinute}' MIN
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                <span className="text-xs font-black truncate">{selectedMatch?.away_club_name || 'Visitante'}</span>
              </div>
            </div>

            {/* 2D Animated Football Pitch with Radar Ball and Players */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-emerald-500/50 bg-gradient-to-b from-[#064e3b] to-[#022c22] shadow-inner select-none">
              
              {/* Pitch Stripes */}
              <div className="absolute inset-0 grid grid-cols-6 pointer-events-none opacity-25">
                <div className="bg-white/5" />
                <div className="bg-black/10" />
                <div className="bg-white/5" />
                <div className="bg-black/10" />
                <div className="bg-white/5" />
                <div className="bg-black/10" />
              </div>

              {/* Pitch Lines */}
              <svg className="absolute inset-0 w-full h-full stroke-white/40 fill-none" strokeWidth="1.2">
                <rect x="4%" y="4%" width="92%" height="92%" rx="4" />
                <line x1="50%" y1="4%" x2="50%" y2="96%" />
                <circle cx="50%" cy="50%" r="18%" />
                <rect x="4%" y="25%" width="14%" height="50%" />
                <rect x="82%" y="25%" width="14%" height="50%" />
              </svg>

              {/* Ball Radar Indicator */}
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 border border-white shadow-lg shadow-amber-400/80 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20 flex items-center justify-center"
                style={{ left: `${ballX}%`, top: `${ballY}%` }}
              >
                <span className="w-1 h-1 rounded-full bg-slate-950" />
              </div>

              {/* TV Broadcast Watermark */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[8px] font-black text-white/80">
                NERVA SPORTS HD 1080p
              </div>
            </div>

            {/* Real-Time Tactician Controls (In-Game Changes) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estrategia en Vivo:</span>
              <div className="flex items-center gap-1">
                {(['defensiva', 'equilibrada', 'ofensiva', 'contragolpe'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMentality(m); handleApplyTactics(); }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition ${
                      mentality === m ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Commentary Feed */}
          <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-2.5 max-h-72 overflow-y-auto">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-800">
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              Relato Minuto a Minuto Oficial
            </h4>

            <div className="flex flex-col divide-y divide-slate-800/60">
              {events.map((evt, idx) => (
                <div key={idx} className="py-2 flex items-start gap-2.5 text-xs animate-in fade-in duration-300">
                  <span className="font-mono text-[10px] font-black text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                    {evt.minute}'
                  </span>
                  <span className={`leading-relaxed ${
                    evt.type === 'goal' ? 'font-black text-emerald-300' :
                    evt.type === 'card' ? 'font-bold text-amber-300' :
                    evt.type === 'shot' ? 'font-medium text-rose-300' : 'text-slate-300'
                  }`}>
                    {evt.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CASE C: FINISHED ENCOUNTER                                     */}
      {/* ============================================================== */}
      {!isPreMatchLocked && !isMatchLive && (
        <div className="p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Transmisión Completada
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Marcador Final Oficial</span>
          </div>

          <div className="flex items-center justify-around py-3 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="text-center">
              <span className="text-xs font-bold text-white block">{selectedMatch?.home_club_name || 'Local'}</span>
              <span className="text-2xl font-black text-white tabular-nums">{homeScore}</span>
            </div>
            <span className="text-sm font-black text-slate-500">-</span>
            <div className="text-center">
              <span className="text-xs font-bold text-white block">{selectedMatch?.away_club_name || 'Visitante'}</span>
              <span className="text-2xl font-black text-white tabular-nums">{awayScore}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400">
              El encuentro oficial ha finalizado. Consulta la tabla de posiciones y estadísticas en la sección Liga.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
