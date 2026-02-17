"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * UserContext — Gestion simplifiée de l'identité utilisateur (MVP).
 *
 * Chaque onglet de navigateur reçoit un userId unique stocké en localStorage.
 * Permet de tester le chat entre deux onglets.
 * En production : remplacé par Sanctum/JWT auth.
 */

interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
}

const UserContext = createContext<UserContextType>({
  userId: "",
  setUserId: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string>("");

  useEffect(() => {
    // Récupérer ou générer un userId (pour compatibilité avec favoris localStorage)
    let stored = localStorage.getItem("roomshare_user_id");
    if (!stored) {
      stored = `user-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("roomshare_user_id", stored);
    }
    setUserIdState(stored);
  }, []);

  const setUserId = (id: string) => {
    localStorage.setItem("roomshare_user_id", id);
    setUserIdState(id);
  };

  if (!userId) return null; // Attendre l'hydratation

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
