import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AudioProvider } from './context/AudioContext.tsx';
import { Header } from './components/common/Header.tsx';
import { BottomNav, TabType } from './components/common/BottomNav.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { HomeDashboard } from './components/home/HomeDashboard.tsx';
import { ClubView } from './components/club/ClubView.tsx';
import { MarketView } from './components/market/MarketView.tsx';
import { LeaguesView } from './components/leagues/LeaguesView.tsx';
import { MoreView } from './components/more/MoreView.tsx';
import { AdminFullPageView } from './components/labs/AdminFullPageView.tsx';
import { SettingsModal } from './components/settings/SettingsModal.tsx';
import { PremiumModal } from './components/premium/PremiumModal.tsx';
import { LabsAdminModal } from './components/labs/LabsAdminModal.tsx';
import { MatchSimulationModal } from './components/match/MatchSimulationModal.tsx';
import { LiveTransmissionsView } from './components/match/LiveTransmissionsView.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { NewUserPage } from './components/auth/NewUserPage.tsx';
import { NervaCloudIcon } from './components/common/NervaCloudIcon.tsx';
import { PushNotificationBanner, triggerPushNotification } from './components/common/PushNotificationBanner.tsx';
import { api } from './services/api.ts';

function MainApp() {
  const { user, isLoading, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isLabsOpen, setIsLabsOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminStandalone, setIsAdminStandalone] = useState<boolean>(() => {
    return window.location.pathname === '/directorioraizdenuestraygrandisimaownerv2' ||
      window.location.hash.includes('directorioraizdenuestraygrandisimaownerv2');
  });

  // Global Watchlist Auction Monitor (Simulated Push Notifications)
  useEffect(() => {
    if (!user) return;
    const notifiedAuctionIds = new Set<string>();

    const checkWatchlistAuctions = async () => {
      try {
        const savedWatchlist = localStorage.getItem('nerva_watchlist');
        const watchlist: string[] = savedWatchlist ? JSON.parse(savedWatchlist) : ['ply-16', 'ply-12'];
        if (watchlist.length === 0) return;

        const res = await api.getAuctions();
        if (!res.auctions) return;

        res.auctions.forEach((auc) => {
          if (auc.status === 'active' && watchlist.includes(auc.player_id) && !notifiedAuctionIds.has(auc.id)) {
            notifiedAuctionIds.add(auc.id);
            triggerPushNotification({
              title: `🔥 ¡Subasta en Vivo de tu Lista de Seguimiento!`,
              body: `${auc.player.first_name} ${auc.player.last_name} (${auc.player.position} · OVR ${auc.player.rating}) acaba de entrar en subasta oficial de 6 minutos. ¡Entra a pujar!`,
              player_id: auc.player_id,
              auction_id: auc.id,
              action_label: 'Pujar Inmediatamente'
            });
          }
        });
      } catch {
        // Background polling fallback
      }
    };

    checkWatchlistAuctions();
    const interval = setInterval(checkWatchlistAuctions, 8000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/directorioraizdenuestraygrandisimaownerv2' ||
          window.location.hash.includes('directorioraizdenuestraygrandisimaownerv2')) {
        setIsAdminStandalone(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-center p-4">
        <NervaCloudIcon className="w-20 h-20 mb-4 animate-pulse" glow={true} />
        <span className="font-sports text-2xl tracking-widest text-white font-bold">
          CARGANDO NERVA...
        </span>
        <p className="text-xs text-slate-500 mt-1">Conectando con la base de datos oficial</p>
      </div>
    );
  }

  // If unauthenticated or no user account exists, land directly on /newuser page
  if (!user || window.location.pathname === '/newuser') {
    return (
      <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col select-none">
        <ToastContainer />
        <NewUserPage onSuccess={() => refreshUserData()} />
      </div>
    );
  }

  // Standalone Root Admin Console View (/directorioraizdenuestraygrandisimaownerv2)
  if (isAdminStandalone) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col select-none">
        <ToastContainer />
        <AdminFullPageView
          onBackToApp={() => {
            setIsAdminStandalone(false);
            window.history.pushState({}, '', '/');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col select-none">
      {/* Mobile-Only App Frame */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-slate-800/40 bg-[#0a0e17]">
        {/* Offline indicator banner */}
        <OfflineIndicator />

        {/* Global Toast notifications */}
        <ToastContainer />

        {/* Global Simulated Push Notifications (Watchlist auctions, match alerts) */}
        <PushNotificationBanner onNavigateToAuction={() => setActiveTab('market')} />

        {/* Top Mobile App Bar */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPremium={() => setIsPremiumOpen(true)}
        />

        {/* Dynamic Mobile View Container */}
        <main className="flex-1 w-full overflow-y-auto">
          {activeTab === 'home' && (
            <HomeDashboard
              onNavigateTab={setActiveTab}
              onOpenMatchModal={() => setIsMatchModalOpen(true)}
            />
          )}

          {activeTab === 'club' && (
            <ClubView onOpenPremium={() => setIsPremiumOpen(true)} />
          )}

          {activeTab === 'tv' && (
            <LiveTransmissionsView />
          )}

          {activeTab === 'market' && (
            <MarketView />
          )}

          {activeTab === 'leagues' && (
            <LeaguesView onOpenMatchModal={() => setIsMatchModalOpen(true)} />
          )}

          {(activeTab === 'more' || activeTab === 'profile') && (
            <MoreView
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPremium={() => setIsPremiumOpen(true)}
              onOpenLabs={() => setIsLabsOpen(true)}
              onNavigateToAdminPage={() => {
                setIsAdminStandalone(true);
                window.history.pushState({}, '', '/directorioraizdenuestraygrandisimaownerv2');
              }}
            />
          )}
        </main>

        {/* Bottom 5-Tab Navigation Bar */}
        <BottomNav activeTab={activeTab === 'profile' ? 'more' : activeTab} onTabChange={setActiveTab} />

        {/* Interactive Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenPremium={() => setIsPremiumOpen(true)}
          onOpenLabs={() => setIsLabsOpen(true)}
        />

        <PremiumModal
          isOpen={isPremiumOpen}
          onClose={() => setIsPremiumOpen(false)}
        />

        <LabsAdminModal
          isOpen={isLabsOpen}
          onClose={() => setIsLabsOpen(false)}
        />

        <MatchSimulationModal
          isOpen={isMatchModalOpen}
          onClose={() => setIsMatchModalOpen(false)}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <MainApp />
      </AudioProvider>
    </AuthProvider>
  );
}
