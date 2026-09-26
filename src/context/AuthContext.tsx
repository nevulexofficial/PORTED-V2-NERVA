import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, Club } from '../types/index.ts';
import { api } from '../services/api.ts';
import { syncProfileToFirestore, syncClubToFirestore, ensureFirebaseAuth } from '../lib/firestoreSync.ts';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  user: Profile | null;
  club: Club | null;
  isLoading: boolean;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  login: (username: string) => Promise<void>;
  register: (username: string, displayName: string, clubName?: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  updateUserCoinsLocally: (coins: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setClub(data.club);
      if (data.user) syncProfileToFirestore(data.user);
      if (data.club) syncClubToFirestore(data.club);
    } catch (err) {
      console.error('Failed to load user state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureFirebaseAuth().catch(console.warn);
    refreshUserData();
  }, [refreshUserData]);

  const login = async (username: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(username);
      setUser(data.user);
      setClub(data.club);
      if (data.user) syncProfileToFirestore(data.user);
      if (data.club) syncClubToFirestore(data.club);
      showToast(`¡Bienvenido de nuevo, ${data.user.display_name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar sesión', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, displayName: string, clubName?: string) => {
    setIsLoading(true);
    try {
      const data = await api.register(username, displayName, clubName);
      setUser(data.user);
      setClub(data.club);
      if (data.user) syncProfileToFirestore(data.user);
      if (data.club) syncClubToFirestore(data.club);
      showToast(`¡Club ${data.club.name} fundado con éxito!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error en el registro', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setClub(null);
    showToast('Sesión cerrada correctamente', 'info');
  };

  const updateUserCoinsLocally = (coins: number) => {
    if (user) {
      setUser({ ...user, coins });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        club,
        isLoading,
        toasts,
        showToast,
        removeToast,
        login,
        register,
        logout,
        refreshUserData,
        updateUserCoinsLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
