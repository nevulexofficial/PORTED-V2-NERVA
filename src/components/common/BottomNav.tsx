import React from 'react';
import { Home, Shield, ShoppingBag, Trophy, LayoutGrid, Tv } from 'lucide-react';

export type TabType = 'home' | 'club' | 'tv' | 'market' | 'leagues' | 'more' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { 
      id: 'home' as TabType, 
      label: 'Inicio', 
      icon: Home,
      activeColor: 'text-sky-400',
      activeBg: 'bg-sky-500/20 border-sky-500/40 shadow-sky-500/10',
      dotColor: 'bg-sky-400'
    },
    { 
      id: 'club' as TabType, 
      label: 'Club', 
      icon: Shield,
      activeColor: 'text-amber-400',
      activeBg: 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/10',
      dotColor: 'bg-amber-400'
    },
    { 
      id: 'tv' as TabType, 
      label: 'En Vivo', 
      icon: Tv,
      activeColor: 'text-rose-400',
      activeBg: 'bg-rose-500/20 border-rose-500/40 shadow-rose-500/10',
      dotColor: 'bg-rose-500 animate-ping'
    },
    { 
      id: 'market' as TabType, 
      label: 'Mercado', 
      icon: ShoppingBag,
      activeColor: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 border-emerald-500/40 shadow-emerald-500/10',
      dotColor: 'bg-emerald-400'
    },
    { 
      id: 'leagues' as TabType, 
      label: 'Ligas', 
      icon: Trophy,
      activeColor: 'text-purple-400',
      activeBg: 'bg-purple-500/20 border-purple-500/40 shadow-purple-500/10',
      dotColor: 'bg-purple-400'
    },
    { 
      id: 'more' as TabType, 
      label: 'Más', 
      icon: LayoutGrid,
      activeColor: 'text-fuchsia-400',
      activeBg: 'bg-fuchsia-500/20 border-fuchsia-500/40 shadow-fuchsia-500/10',
      dotColor: 'bg-fuchsia-400'
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-t border-slate-800/90 pb-[max(env(safe-area-inset-bottom),6px)]">
      <div className="max-w-md mx-auto grid grid-cols-6 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[38px] touch-press relative group"
            >
              <div
                className={`p-1.5 rounded-xl border transition-all duration-200 shadow-sm ${
                  isActive
                    ? `${tab.activeColor} ${tab.activeBg} scale-105`
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[9.5px] tracking-tight font-medium mt-0.5 transition-colors ${
                  isActive ? `${tab.activeColor} font-bold` : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${tab.dotColor}`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
