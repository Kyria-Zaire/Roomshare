"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { favoriteService } from "@/lib/apiClient";
import { useAuth } from "@/lib/authContext";

/**
 * FavoritesContext — Gestion des favoris (coups de cœur).
 *
 * Synchronise avec l'API backend MongoDB pour la persistance.
 * Fallback sur localStorage si l'utilisateur n'est pas connecté.
 */

interface FavoritesContextType {
  favorites: string[];
  isLoading: boolean;
  isFavorite: (roomId: string) => boolean;
  toggleFavorite: (roomId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isLoading: false,
  isFavorite: () => false,
  toggleFavorite: async () => {},
  refresh: async () => {},
});

const STORAGE_KEY = "roomshare_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  // Charger les favoris depuis l'API quand l'utilisateur est authentifié
  const loadFavoritesFromAPI = useCallback(async () => {
    if (!user || authLoading) {
      // Si non connecté, charger depuis localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await favoriteService.getAll();
      // Extraire les room_id depuis les favoris
      const roomIds = response.data.map((fav) => fav.room_id);
      setFavorites(roomIds);
      // Synchroniser localStorage aussi (pour fallback)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roomIds));
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
      // Fallback sur localStorage en cas d'erreur
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Charger les favoris au mount et quand l'utilisateur change
  useEffect(() => {
    loadFavoritesFromAPI();
  }, [loadFavoritesFromAPI]);

  const isFavorite = useCallback(
    (roomId: string) => favorites.includes(roomId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (roomId: string) => {
      const isCurrentlyFavorite = favorites.includes(roomId);

      // Optimistic update
      const newFavorites = isCurrentlyFavorite
        ? favorites.filter((id) => id !== roomId)
        : [...favorites, roomId];
      setFavorites(newFavorites);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));

      // Si l'utilisateur est connecté, synchroniser avec l'API
      if (user) {
        try {
          if (isCurrentlyFavorite) {
            await favoriteService.remove(roomId);
          } else {
            await favoriteService.add(roomId);
          }
        } catch (error) {
          console.error("Erreur synchronisation favori:", error);
          // Rollback en cas d'erreur
          setFavorites(favorites);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        }
      }
    },
    [favorites, user]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, isLoading, isFavorite, toggleFavorite, refresh: loadFavoritesFromAPI }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
