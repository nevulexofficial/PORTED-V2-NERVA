import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { TransferListing, Auction, PlayerPosition, Player } from '../../types/index.ts';
import { 
  ShoppingBag, Flame, Search, Filter, 
  Coins, Clock, CheckCircle2, ChevronRight, Tag, X, PlusCircle,
  Star, Bell, Sparkles, Award, Shield, AlertCircle, ArrowUpRight, Eye
} from 'lucide-react';
import { triggerPushNotification } from '../common/PushNotificationBanner.tsx';
import { PlayerPositionPitch } from '../common/PlayerPositionPitch.tsx';

export const MarketView: React.FC = () => {
  const { user, showToast, updateUserCoinsLocally } = useAuth();
  const [activeTab, setActiveTab] = useState<'transfers' | 'auctions'>('transfers');
  const [listings, setListings] = useState<TransferListing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Player for Detailed Inspection & Mini Football Pitch
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<Player | null>(null);

  // Real-time ticking timer for the 6-minute countdown
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
  }, []);

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

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSellModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition touch-press shadow-md"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vender</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Fichajes vs Subastas */}
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
          <span>Fichajes Directos</span>
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
          <span>Subastas en Vivo (6m)</span>
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

                      {(p.status === 'injured' || ((p.injury_matches_remaining ?? 0) > 0)) && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          🏥 Lesionado ({p.injury_matches_remaining || 1}j)
                        </span>
                      )}
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPlayerForDetails(p)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition touch-press"
                          title="Ver Ficha y Cancha"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cancha</span>
                        </button>

                        <button
                          onClick={() => handleBuyPlayer(listing)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/40 touch-press"
                        >
                          Fichar
                        </button>
                      </div>
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
                    {(auc.player.status === 'injured' || ((auc.player.injury_matches_remaining ?? 0) > 0)) && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        🏥 Lesionado
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPlayerForDetails(auc.player)}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition touch-press"
                      title="Ver Ficha y Cancha del Jugador"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cancha</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveAuctionForBid(auc);
                        setBidAmountInput(String(auc.current_bid + 50000));
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 touch-press"
                    >
                      <Flame className="w-4 h-4 fill-slate-950" />
                      <span>Pujar (+50.000 €)</span>
                    </button>
                  </div>
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

      {/* Interactive Player Detail Modal with Mini Football Pitch */}
      {selectedPlayerForDetails && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none">
          <div className="w-full max-w-sm bg-[#121826] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto sm:hidden -mt-1" />

            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPlayerForDetails.avatar_url}
                  alt={selectedPlayerForDetails.last_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-white">
                      {selectedPlayerForDetails.first_name} {selectedPlayerForDetails.last_name}
                    </h3>
                    <span className="text-xs font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      {selectedPlayerForDetails.position}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {selectedPlayerForDetails.nationality} · {selectedPlayerForDetails.age} años · Salario: {selectedPlayerForDetails.salary?.toLocaleString()} €/sem
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlayerForDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Injury Status Banner */}
            {(selectedPlayerForDetails.status === 'injured' || ((selectedPlayerForDetails.injury_matches_remaining ?? 0) > 0)) && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2.5">
                <span className="text-xl">🏥</span>
                <div>
                  <strong className="block font-black text-rose-200 uppercase tracking-wide">
                    Lesionado ({selectedPlayerForDetails.injury_name || 'Sobrecarga muscular'})
                  </strong>
                  <span className="text-[10px] text-rose-300/80">
                    Baja médica por {selectedPlayerForDetails.injury_matches_remaining || 1} jornada(s). No disponible para disputar partidos.
                  </span>
                </div>
              </div>
            )}

            {/* Experience / Match Progression Bar */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Progreso por Experiencia de Partido
                </span>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">
                  {(selectedPlayerForDetails.xp || 0)} / 300 XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (((selectedPlayerForDetails.xp || 0)) / 300) * 100)}%` }}
                />
              </div>
              <span className="text-[9.5px] text-slate-500">
                Al jugar partidos oficiales acumula XP y sube +1 OVR (hasta su potencial máx: {selectedPlayerForDetails.potential})
              </span>
            </div>

            {/* Mini Football Pitch Tactical Position Component */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Demarcación Táctica en Cancha
              </span>
              <PlayerPositionPitch position={selectedPlayerForDetails.position} />
            </div>

            {/* Ratings Bar */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Valoración OVR</span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">
                  {selectedPlayerForDetails.rating}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Potencial Máx</span>
                <span className="text-lg font-black text-amber-400 tabular-nums">
                  {selectedPlayerForDetails.potential}
                </span>
              </div>
            </div>

            {/* 6 Key Stats Grid */}
            <div className="grid grid-cols-6 gap-1 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 text-center font-mono text-[10px]">
              <div><span className="text-slate-400 block text-[9px]">PAC</span><span className="font-bold text-white">{selectedPlayerForDetails.stats?.pace || 75}</span></div>
              <div><span className="text-slate-400 block text-[9px]">SHO</span><span className="font-bold text-white">{selectedPlayerForDetails.stats?.shooting || 75}</span></div>
              <div><span className="text-slate-400 block text-[9px]">PAS</span><span className="font-bold text-white">{selectedPlayerForDetails.stats?.passing || 75}</span></div>
              <div><span className="text-slate-400 block text-[9px]">DRI</span><span className="font-bold text-white">{selectedPlayerForDetails.stats?.dribbling || 75}</span></div>
              <div><span className="text-slate-400 block text-[9px]">DEF</span><span className="font-bold text-white">{selectedPlayerForDetails.stats?.defense || 75}</span></div>
              <div><span className="text-slate-400 block text-[9px]">PHY</span><span className="font-bold text-white">{selectedPlayerForDetails.stats?.physical || 75}</span></div>
            </div>

            <button
              onClick={() => setSelectedPlayerForDetails(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
