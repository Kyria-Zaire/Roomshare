"use client";

import { AuthProvider } from "@/lib/authContext";
import { UserProvider } from "@/lib/userContext";
import { NotificationProvider } from "@/lib/notificationContext";
import { FavoritesProvider } from "@/lib/favoritesContext";
import { PassModalProvider } from "@/lib/passModalContext";
import type { ReactNode } from "react";

/**
 * Providers — Tous les contextes client de l'application.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <NotificationProvider>
          <FavoritesProvider>
            <PassModalProvider>
              {children}
            </PassModalProvider>
          </FavoritesProvider>
        </NotificationProvider>
      </UserProvider>
    </AuthProvider>
  );
}
