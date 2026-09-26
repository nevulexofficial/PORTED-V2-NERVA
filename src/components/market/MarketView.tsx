import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { TransferListing, Auction, PlayerPosition, Player } from '../../types/index.ts';
import { 
  ShoppingBag, Flame, Search, Filter, 
  Coins, Clock, CheckCircle2, ChevronRight, Tag, X, PlusCircle,
  Star, Bell, Sparkles, Award, Shield, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { triggerPushNotification } from '../common/PushNotificationBanner.tsx';

export const MarketView: React.FC = () => {
  const { user, showToast, updateUserCoinsLocally } = useAuth();
  const [activeTab, setActiveTab] = useState<'transfers' | 'auctions' | 'watchlist'>('transfers');
  const [listings, setListings] = useState<TransferListing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nerva_watchlist');
      return saved ? JSON.parse(saved) : ['ply-16', 'ply-12'];
    } catch {
      return ['ply-16', 'ply-12'];
    }
  });

  // Track notified auctions in this session to prevent spamming
  const [notifiedAuctions, setNotifiedAuctions] = useState<Set<string>>(new Set());

  // Real-time ticking timer for the 6-minute countdown
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('nerva_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [minRating, setMinRating] = useState<number>(70);

  // Sell Player modal
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [mySquad, setMySquad] = useState<Player[]>([]);
  const [selectedPlayerToSell, setSelectedPlayerToSell] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('1500000');

  // Place Bid modal
  const [activeAuctionForBid, setActiveAuctionForBid] = useState<Auction | null>(null);
  const [bidAmountInput, setBidAmountInput] = useState<string>('');

  const positions: (PlayerPosition | 'ALL')[] = [
    'ALL', 'POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'
  ];

  const loadData = async () => {
    try {
      const [listRes, aucRes, squadRes, playersRes] = await Promise.all([
        api.getMarketListings(),
        api.getAuctions(),
        api.getMyClub(),
        fetch('/api/players').then(r => r.json()).catch(() => ({ players: [] }))
      ]);
      setListings(listRes.listings || []);
      setAuctions(aucRes.auctions || []);
      setMySquad(squadRes.squad ? squadRes.squad.filter(p => p.status === 'active') : []);
      if (playersRes.players) setAllPlayers(playersRes.players);

      // Check if any player in watchlist is in active auction and hasn't notified yet
      aucRes.auctions.forEach((auc: Auction) => {
        if (auc.status === 'active' && watchlist.includes(auc.player_id) && !notifiedAuctions.has(auc.id)) {
          triggerPushNotification({
            title: `🔥 ¡Subasta en Vivo de tu Lista de Seguimiento!`,
            body: `${auc.player.first_name} ${auc.player.last_name} (${auc.player.position} · OVR ${auc.player.rating}) está en subasta de 6 minutos. ¡Entra a pujar!`,
            player_id: auc.player_id,
            auction_id: auc.id,
            action_label: 'Ir a la Subasta'
          });
          setNotifiedAuctions(prev => new Set(prev).add(auc.id));
        }
      });
    } catch (err) {
      console.error('Error fetching market:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 8 seconds for real-time auction synchronization
    const poll = setInterval(() => {
      loadData();
    }, 8000);
    return () => clearInterval(poll);
  }, [watchlist]);

  const toggleWatchlist = (playerId: string, player?: Player) => {
    if (watchlist.includes(playerId)) {
      setWatchlist(prev => prev.filter(id => id !== playerId));
      showToast('Jugador retirado de tu lista de seguimiento', 'info');
    } else {
      setWatchlist(prev => [...prev, playerId]);
      showToast('⭐ ¡Jugador agregado a tu lista de seguimiento! Recibirás alertas push cuando entre en subasta.', 'success');
      
      // If currently in auction, fire push notification preview
      const inAuction = auctions.find(a => a.player_id === playerId && a.status === 'active');
      if (inAuction && player) {
        triggerPushNotification({
          title: `🔥 ¡Subasta Activa de tu Lista!`,
          body: `${player.first_name} ${player.last_name} ya está en subasta de 6 minutos.`,
          player_id: player.id,
          auction_id: inAuction.id,
          action_label: 'Pujar Ahora'
        });
      }
    }
  };

  // Launch a watched player into an active 6-minute auction
  const handleLaunchToAuction = async (player: Player) => {
    try {
      const res = await api.startAuctionForPlayer(player.id);
      showToast(`¡Subasta oficial de 6 minutos iniciada para ${player.first_name} ${player.last_name}!`, 'success');
      
      // Trigger push notification banner
      triggerPushNotification({
        title: `🔥 ¡Subasta en Vivo de tu Lista de Seguimiento!`,
        body: `${player.first_name} ${player.last_name} (${player.position} · OVR ${player.rating}) acaba de entrar en subasta de 6 minutos. ¡Encabeza la puja para ficharlo!`,
        player_id: player.id,
        auction_id: res.auction.id,
        action_label: 'Pujar Inmediatamente'
      });

      await loadData();
      setActiveTab('auctions');
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar subasta', 'error');
    }
  };

  const handleBuyPlayer = async (listing: TransferListing) => {
    if (!user) return;
    if (user.coins < listing.asking_price) {
      showToast(`Monedas insuficientes. Necesitas ${listing.asking_price.toLocaleString()} €`, 'error');
      return;
    }

    try {
      const res = await api.buyPlayer(listing.id);
      showToast(`¡Fichaje de ${res.player.first_name} ${res.player.last_name} completado con éxito!`, 'success');
      updateUserCoinsLocally(res.coins);
      setListings(prev => prev.filter(l => l.id !== listing.id));
    } catch (err: any) {
      showToast(err.message || 'Error al completar el fichaje', 'error');
    }
  };

  const handleSellPlayer = async () => {
    if (!selectedPlayerToSell) {
      showToast('Selecciona un jugador para transferir', 'error');
      return;
    }
    const price = Number(sellPrice);
    if (!price || price <= 0) {
      showToast('Introduce un precio válido', 'error');
      return;
    }

    try {
      const res = await api.listPlayerOnMarket(selectedPlayerToSell, price);
      showToast('Jugador puesto a la venta en el mercado oficial', 'success');
      setListings(prev => [res.listing, ...prev]);
      setIsSellModalOpen(false);
      setSelectedPlayerToSell('');
    } catch (err: any) {
      showToast(err.message || 'Error al listar jugador', 'error');
    }
  };

  const handlePlaceBid = async () => {
    if (!activeAuctionForBid) return;
    const amount = Number(bidAmountInput);
    if (!amount || amount <= activeAuctionForBid.current_bid) {
      showToast(`La puja debe superar los ${activeAuctionForBid.current_bid.toLocaleString()} €`, 'error');
      return;
    }
    if (user && user.coins < amount) {
      showToast('Saldo insuficiente para realizar esta puja', 'error');
      return;
    }

    try {
      const res = await api.placeBid(activeAuctionForBid.id, amount);
      showToast('¡Puja realizada con éxito! Ahora estás encabezando la subasta.', 'success');
      updateUserCoinsLocally(res.userCoins);
      setAuctions(prev => prev.map(a => a.id === res.auction.id ? res.auction : a));
      setActiveAuctionForBid(null);
    } catch (err: any) {
      showToast(err.message || 'Error al pujar', 'error');
    }
  };

  // Helper to format remaining time
  const formatTimeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - now;
    if (diff <= 0) return '00:00';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredListings = listings.filter(l => {
    const p = l.player;
    if (!p) return false;
    const matchPos = selectedPos === 'ALL' || p.position === selectedPos;
    const matchRating = p.rating >= minRating;
    const matchSearch = `${p.first_name} ${p.last_name} ${p.nationality}`.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchRating && matchSearch;
  });

  const watchlistPlayers = allPlayers.filter(p => watchlist.includes(p.id));

  return (
    <div className="flex flex-col gap-4 pb-24 pt-2 px-4 max-w-md mx-auto select-none">
      {/* Top Header Bar & Sell Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            Mercado & Fichajes
          </h1>
          <p className="text-xs text-slate-400">Traspasos, subastas y alertas push</p>
        </div>

        <button
          onClick={() => setIsSellModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition touch-press shadow-md"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vender</span>
        </button>
      </div>

      {/* Tabs Switcher: Fichajes vs Subastas vs Seguimiento */}
      <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'transfers'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Mercado</span>
        </button>
        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'auctions'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Subastas (6m)</span>
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition relative ${
            activeTab === 'watchlist'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Seguimiento</span>
          {watchlist.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center -ml-0.5">
              {watchlist.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MERCADO ABIERTO                                         */}
      {/* ============================================================== */}
      {activeTab === 'transfers' && (
        <>
          {/* Search & Position Filters */}
          <div className="flex flex-col gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar futbolista o nacionalidad..."
                className="w-full bg-[#121826] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Position filter pill scroller */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setSelectedPos(pos)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedPos === pos
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Listings */}
          <div className="flex flex-col gap-3">
            {filteredListings.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#121826] border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <Search className="w-8 h-8 text-slate-600" />
                <span className="text-xs text-slate-400 font-medium">No se encontraron jugadores disponibles con esos filtros.</span>
              </div>
            ) : (
              filteredListings.map((listing) => {
                const p = listing.player;
                const isWatched = watchlist.includes(p.id);
                return (
                  <div
                    key={listing.id}
                    className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 hover:border-slate-700 transition flex flex-col gap-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={p.avatar_url}
                            alt={p.last_name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md"
                          />
                          <span className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500 text-slate-950">
                            {p.position}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-white">
                              {p.first_name} {p.last_name}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            OVR {p.rating} · Pot {p.potential} · {p.nationality} ({p.age} años)
                          </span>
                          <span className="text-[9px] text-slate-500">Club vendedor: {listing.seller_club_name}</span>
                        </div>
                      </div>

                      {/* Watchlist Star Toggle */}
                      <button
                        onClick={() => toggleWatchlist(p.id, p)}
                        className={`p-2 rounded-xl border transition ${
                          isWatched
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                        title={isWatched ? 'En lista de seguimiento' : 'Añadir a lista de seguimiento'}
                      >
                        <Star className={`w-4 h-4 ${isWatched ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-6 gap-1 bg-slate-900/60 p-2 rounded-xl text-center text-[9px] text-slate-400 font-mono">
                      <div>PAC <span className="text-white block font-bold">{p.stats.pace}</span></div>
                      <div>SHO <span className="text-white block font-bold">{p.stats.shooting}</span></div>
                      <div>PAS <span className="text-white block font-bold">{p.stats.passing}</span></div>
                      <div>DRI <span className="text-white block font-bold">{p.stats.dribbling}</span></div>
                      <div>DEF <span className="text-white block font-bold">{p.stats.defense}</span></div>
                      <div>PHY <span className="text-white block font-bold">{p.stats.physical}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400">Precio de traspaso</span>
                        <span className="text-sm font-black text-emerald-400 tabular-nums">
                          {listing.asking_price.toLocaleString()} €
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyPlayer(listing)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/40 touch-press"
                      >
                        Fichar Jugador
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SUBASTAS EN VIVO (LÍMITE 6 MINUTOS)                     */}
      {/* ============================================================== */}
      {activeTab === 'auctions' && (
        <div className="flex flex-col gap-3.5">
          {/* Rules Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-orange-500/10 border border-amber-500/30 flex flex-col gap-1.5 shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wide">
              <Clock className="w-4 h-4" />
              <span>Reglas de Subasta Oficial (6 Minutos)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              ⚡ <strong>Límite de tiempo:</strong> Cada subasta dura exactamente <strong>6 minutos</strong>. El mánager que esté <strong>encabezando la puja</strong> al expirar el cronómetro se queda con el jugador inmediatamente.
            </p>
          </div>

          {auctions.map((auc) => {
            const timeLeft = formatTimeLeft(auc.ends_at);
            const isFinished = timeLeft === '00:00' || auc.status === 'completed';
            const isWinning = user && auc.highest_bidder_id === user.id;
            const isWatched = watchlist.includes(auc.player_id);

            return (
              <div
                key={auc.id}
                className={`p-4 rounded-3xl bg-[#121826] border transition flex flex-col gap-3 shadow-xl ${
                  isWinning
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SUBASTA PRO
                    </span>
                    {isWatched && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1 border border-purple-500/30">
                        <Star className="w-3 h-3 fill-purple-300" />
                        EN TU SEGUIMIENTO
                      </span>
                    )}
                  </div>

                  {/* 6-Minute Countdown Timer */}
                  <div className={`flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                    isFinished
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isFinished ? 'FINALIZADA' : timeLeft}</span>
                  </div>
                </div>

                {/* Player Header */}
                <div className="flex items-center gap-3">
                  <img
                    src={auc.player.avatar_url}
                    alt={auc.player.last_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-white truncate">
                        {auc.player.first_name} {auc.player.last_name}
                      </h4>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                        {auc.player.position}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      OVR {auc.player.rating} · Pot {auc.player.potential} · {auc.player.nationality} ({auc.player.age} años)
                    </span>
                  </div>

                  <button
                    onClick={() => toggleWatchlist(auc.player_id, auc.player)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400"
                  >
                    <Star className={`w-4 h-4 ${isWatched ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Live Leader Status Card */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Puja Más Alta</span>
                    <span className="text-base font-black text-amber-400 tabular-nums">
                      {auc.current_bid.toLocaleString()} €
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">
                      👑 Encabezando Subasta
                    </span>
                    <span className={`text-xs font-black truncate max-w-[130px] block ${
                      isWinning ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {isWinning ? '¡TÚ (LIDERANDO)!' : (auc.highest_bidder_club_name || 'Sin ofertas')}
                    </span>
                  </div>
                </div>

                {/* Bid Button */}
                {!isFinished ? (
                  <button
                    onClick={() => {
                      setActiveAuctionForBid(auc);
                      setBidAmountInput(String(auc.current_bid + 50000));
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 touch-press"
                  >
                    <Flame className="w-4 h-4 fill-slate-950" />
                    <span>Pujar Ahora (+50.000 €)</span>
                  </button>
                ) : (
                  <div className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs font-bold text-slate-400">
                    🏆 Subasta concluida. El jugador ha sido asignado a <strong className="text-white">{auc.highest_bidder_club_name || 'Comprador'}</strong>.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: LISTA DE SEGUIMIENTO (ALERTAS PUSH SIMULADAS)           */}
      {/* ============================================================== */}
      {activeTab === 'watchlist' && (
        <div className="flex flex-col gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/15 via-slate-900 to-indigo-500/10 border border-purple-500/30 flex flex-col gap-1.5 shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-300 uppercase tracking-wide">
              <Bell className="w-4 h-4 text-purple-400" />
              <span>Notificaciones Push de Jugadores Favoritos</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Los jugadores que agregues a esta lista dispararán una <strong>notificación push flotante</strong> en tu pantalla en el momento exacto en que ingresen a la subasta en vivo de 6 minutos.
            </p>
          </div>

          {watchlistPlayers.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#121826] border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
              <Star className="w-8 h-8 text-slate-600" />
              <span className="text-xs text-slate-400 font-medium">
                No tienes futbolistas en seguimiento. Toca la estrella ⭐ en cualquier jugador del mercado para agregarlo.
              </span>
            </div>
          ) : (
            watchlistPlayers.map((p) => {
              const liveAuction = auctions.find(a => a.player_id === p.id && a.status === 'active');
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-3xl bg-[#121826] border border-slate-800 flex flex-col gap-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar_url}
                        alt={p.last_name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-white">{p.first_name} {p.last_name}</h4>
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                            {p.position}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          OVR {p.rating} · Pot {p.potential} · {p.nationality}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-mono">
                          Valor: {(p.price / 1000000).toFixed(1)}M €
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleWatchlist(p.id, p)}
                      className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      title="Dejar de seguir"
                    >
                      <Star className="w-4 h-4 fill-purple-300" />
                    </button>
                  </div>

                  {liveAuction ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        ¡EN SUBASTA AHORA ({formatTimeLeft(liveAuction.ends_at)})!
                      </span>
                      <button
                        onClick={() => setActiveTab('auctions')}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase"
                      >
                        Pujar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleLaunchToAuction(p)}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lanzar a Subasta de 6 Minutos (Probar Notificación Push)</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Place Bid Modal */}
      {activeAuctionForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-amber-500/40 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Pujar por {activeAuctionForBid.player.first_name} {activeAuctionForBid.player.last_name}
              </h3>
              <button onClick={() => setActiveAuctionForBid(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Puja actual:</span>
              <span className="font-black text-amber-400 text-sm">
                {activeAuctionForBid.current_bid.toLocaleString()} €
              </span>
            </div>

            <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1.5">
              Tu Oferta (Debe ser superior):
              <input
                type="number"
                value={bidAmountInput}
                onChange={(e) => setBidAmountInput(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveAuctionForBid(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handlePlaceBid}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md"
              >
                Confirmar Puja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Player Modal */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-slate-800 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Poner Jugador en el Mercado</h3>
              <button onClick={() => setIsSellModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1.5">
              Seleccionar Jugador de tu Plantilla
              <select
                value={selectedPlayerToSell}
                onChange={(e) => setSelectedPlayerToSell(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Elige un jugador --</option>
                {mySquad.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.position} · {p.rating} OVR)
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1.5">
              Precio de Venta Solicitado (Monedas)
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsSellModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSellPlayer}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md"
              >
                Publicar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
