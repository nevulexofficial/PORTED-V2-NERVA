import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { TransferListing, Auction, PlayerPosition, Player } from '../../types/index.ts';
import { 
  ShoppingBag, Flame, Search, Filter, 
  Coins, Clock, CheckCircle2, ChevronRight, Tag, X, PlusCircle 
} from 'lucide-react';

export const MarketView: React.FC = () => {
  const { user, showToast, updateUserCoinsLocally } = useAuth();
  const [activeTab, setActiveTab] = useState<'transfers' | 'auctions'>('transfers');
  const [listings, setListings] = useState<TransferListing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [minRating, setMinRating] = useState<number>(75);

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
      const [listRes, aucRes, squadRes] = await Promise.all([
        api.getMarketListings(),
        api.getAuctions(),
        api.getMyClub()
      ]);
      setListings(listRes.listings);
      setAuctions(aucRes.auctions);
      setMySquad(squadRes.squad.filter(p => p.status === 'active'));
    } catch (err) {
      console.error('Error fetching market:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuyPlayer = async (listing: TransferListing) => {
    if (!user) return;
    if (user.coins < listing.asking_price) {
      showToast(`Monedas insuficientes. Necesitas ${listing.asking_price.toLocaleString()}`, 'error');
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
      showToast(`La puja debe superar los ${activeAuctionForBid.current_bid.toLocaleString()}`, 'error');
      return;
    }
    if (user && user.coins < amount) {
      showToast('Saldo insuficiente para realizar esta puja', 'error');
      return;
    }

    try {
      const res = await api.placeBid(activeAuctionForBid.id, amount);
      showToast('¡Puja realizada con éxito! Eres el máximo postor.', 'success');
      updateUserCoinsLocally(res.userCoins);
      setAuctions(prev => prev.map(a => a.id === res.auction.id ? res.auction : a));
      setActiveAuctionForBid(null);
    } catch (err: any) {
      showToast(err.message || 'Error al pujar', 'error');
    }
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
    <div className="flex flex-col gap-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Top Header Bar & Sell Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            Mercado & Traspasos
          </h1>
          <p className="text-xs text-slate-400">Fichajes y subastas oficiales</p>
        </div>

        <button
          onClick={() => setIsSellModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition touch-press"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vender</span>
        </button>
      </div>

      {/* Tabs Switcher: Fichajes vs Subastas */}
      <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'transfers'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Mercado Abierto</span>
        </button>
        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'auctions'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Subastas en Vivo</span>
        </button>
      </div>

      {activeTab === 'transfers' ? (
        <>
          {/* Search & Position Filters */}
          <div className="flex flex-col gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o nacionalidad..."
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

          {/* Transfers Listings List */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>{filteredListings.length} Jugadores disponibles</span>
              <span>OVR mínimo: {minRating}</span>
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-3xl bg-[#121826] border border-slate-800 p-8 text-center text-xs text-slate-400">
                No hay jugadores que coincidan con los filtros aplicados.
              </div>
            ) : (
              filteredListings.map((listing) => {
                const p = listing.player;
                const canAfford = user && user.coins >= listing.asking_price;

                return (
                  <div
                    key={listing.id}
                    className="flex flex-col p-3.5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <img src={p.avatar_url} alt={p.last_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">
                              {p.first_name} {p.last_name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {p.position}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{p.nationality}</span>
                            <span aria-hidden="true">·</span>
                            <span>{p.age} años</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-300 font-semibold">{listing.seller_club_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ratings */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-emerald-400 tabular-nums">{p.rating}</span>
                          <span className="text-[10px] text-slate-500">OVR</span>
                        </div>
                        <span className="text-[10px] text-amber-400">POT {p.potential}</span>
                      </div>
                    </div>

                    {/* Stats summary row */}
                    <div className="grid grid-cols-6 gap-1 bg-slate-900/60 rounded-xl p-2 text-center text-[10px] border border-slate-800/60">
                      <div><span className="text-slate-500 block">PAC</span><strong className="text-white">{p.stats.pace}</strong></div>
                      <div><span className="text-slate-500 block">SHO</span><strong className="text-white">{p.stats.shooting}</strong></div>
                      <div><span className="text-slate-500 block">PAS</span><strong className="text-white">{p.stats.passing}</strong></div>
                      <div><span className="text-slate-500 block">DRI</span><strong className="text-white">{p.stats.dribbling}</strong></div>
                      <div><span className="text-slate-500 block">DEF</span><strong className="text-white">{p.stats.defense}</strong></div>
                      <div><span className="text-slate-500 block">PHY</span><strong className="text-white">{p.stats.physical}</strong></div>
                    </div>

                    {/* Purchase Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{listing.asking_price.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => handleBuyPlayer(listing)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition touch-press ${
                          canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Fichar Jugador' : 'Saldo Insuficiente'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Auctions View */
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <Flame className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Las subastas se adjudican automáticamente al cumplirse el tiempo límite.</span>
          </div>

          {auctions.map((auc) => (
            <div
              key={auc.id}
              className="flex flex-col p-4 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                    <img src={auc.player.avatar_url} alt={auc.player.last_name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {auc.player.first_name} {auc.player.last_name}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        {auc.player.position}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      OVR {auc.player.rating} · {auc.player.nationality} · {auc.player.age} años
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    En disputa
                  </span>
                </div>
              </div>

              {/* Bid Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">Puja Actual</span>
                  <span className="text-base font-black text-amber-400 tabular-nums">
                    {auc.current_bid.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-medium">Máximo Postor</span>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {auc.highest_bidder_club_name || 'Sin pujas'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveAuctionForBid(auc);
                  setBidAmountInput(String(auc.current_bid + 50000));
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md touch-press"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>Pujar por este Jugador</span>
              </button>
            </div>
          ))}
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

      {/* Place Bid Modal */}
      {activeAuctionForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#121826] border border-slate-800 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Confirmar Puja Oficial</h3>
              <button onClick={() => setActiveAuctionForBid(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <img
                src={activeAuctionForBid.player.avatar_url}
                alt={activeAuctionForBid.player.last_name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h4 className="text-xs font-bold text-white">
                  {activeAuctionForBid.player.first_name} {activeAuctionForBid.player.last_name}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Puja actual: <strong className="text-amber-400">{activeAuctionForBid.current_bid.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <label className="text-xs font-semibold text-slate-300 flex flex-col gap-1.5">
              Tu Nueva Oferta (Monedas)
              <input
                type="number"
                value={bidAmountInput}
                onChange={(e) => setBidAmountInput(e.target.value)}
                min={activeAuctionForBid.current_bid + 1000}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 tabular-nums"
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
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 shadow-md"
              >
                Enviar Puja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
