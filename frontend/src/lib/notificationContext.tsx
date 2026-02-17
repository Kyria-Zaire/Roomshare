"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { chatService } from "@/lib/chatService";
import { useAuth } from "@/lib/authContext";

/**
 * NotificationContext — Gère le compteur de messages non lus.
 * La pastille rouge sur l'onglet Messages du BottomNav.
 */

interface NotificationContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
  increment: () => void;
  reset: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: async () => {},
  increment: () => {},
  reset: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isLoading } = useAuth();

  const refresh = useCallback(async () => {
    // Ne pas appeler l'API si l'utilisateur n'est pas connecté
    if (!user || isLoading) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await chatService.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error: unknown) {
      // Ignorer les erreurs 401/403 (non authentifié) et autres erreurs
      const axiosErr = error as { response?: { status?: number } };
      if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
        setUnreadCount(0);
        return;
      }
      // Silently fail pour les autres erreurs
      setUnreadCount(0);
    }
  }, [user, isLoading]);

  const increment = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Poll toutes les 30s pour les notifications (seulement si connecté)
  useEffect(() => {
    if (!isLoading) {
      refresh();
      if (user) {
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [refresh, user, isLoading]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh, increment, reset }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
