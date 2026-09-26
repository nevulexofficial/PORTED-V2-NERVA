import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/common/Header.tsx';
import { BottomNav, TabType } from './components/common/BottomNav.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { HomeDashboard } from './components/home/HomeDashboard.tsx';
import { ClubView } from './components/club/ClubView.tsx';
import { MarketView } from './components/market/MarketView.tsx';
import { LeaguesView } from './components/leagues/LeaguesView.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { SettingsModal } from './components/settings/SettingsModal.tsx';
import { PremiumModal } from './components/premium/PremiumModal.tsx';
import { LabsAdminModal } from './components/labs/LabsAdminModal.tsx';
import { MatchSimulationModal } from './components/match/MatchSimulationModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { NewUserPage } from './components/auth/NewUserPage.tsx';

function MainApp() {
  const { user, isLoading, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isLabsOpen, setIsLabsOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center animate-pulse mb-4 shadow-xl shadow-emerald-950/50">
          <span className="font-sports text-3xl font-black text-slate-950">N</span>
        </div>
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

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col select-none">
      {/* Mobile-Only App Frame */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-slate-800/40 bg-[#0a0e17]">
        {/* Offline indicator banner */}
        <OfflineIndicator />

        {/* Global Toast notifications */}
        <ToastContainer />

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

          {activeTab === 'market' && (
            <MarketView />
          )}

          {activeTab === 'leagues' && (
            <LeaguesView onOpenMatchModal={() => setIsMatchModalOpen(true)} />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPremium={() => setIsPremiumOpen(true)}
            />
          )}
        </main>

        {/* Bottom 5-Tab Navigation Bar */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
      <MainApp />
    </AuthProvider>
  );
}
