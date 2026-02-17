"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import apiClient from "@/lib/apiClient";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: "tenant" | "owner";
  verification_status?: "none" | "pending" | "verified" | "rejected";
  is_pro?: boolean;
  pass_expires_at?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "tenant" | "owner", termsAccepted: boolean, privacyAccepted: boolean, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {}, // (name: string, email: string, password: string, role: "tenant" | "owner", termsAccepted: boolean, privacyAccepted: boolean) => {},
  logout: () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
});

const TOKEN_KEY = "roomshare_token";
const USER_KEY = "roomshare_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete apiClient.defaults.headers.common["Authorization"];
  }, []);

  // Restaurer la session et valider le token via /auth/me
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    apiClient.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    setToken(savedToken);

    apiClient
      .get("/auth/me")
      .then(({ data }) => {
        const me: AuthUser = data.data;
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clearSession]);

  const saveSession = useCallback((authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    saveSession(data.data.user, data.data.token);
  }, [saveSession]);

  const register = useCallback(async (name: string, email: string, password: string, role: "tenant" | "owner", termsAccepted: boolean, privacyAccepted: boolean, phone?: string) => {
    const payload: Record<string, unknown> = {
      name,
      email,
      password,
      password_confirmation: password,
      role,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
    };
    if (phone !== undefined && phone !== "") payload.phone = phone;
    const { data } = await apiClient.post("/auth/register", payload);
    saveSession(data.data.user, data.data.token);
  }, [saveSession]);

  const logout = useCallback(() => {
    apiClient.post("/auth/logout").catch(() => {});
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (data: { name?: string; email?: string }) => {
    const { data: response } = await apiClient.put("/auth/profile", data);
    const updatedUser: AuthUser = response.data;
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await apiClient.get("/auth/me");
    const me: AuthUser = data.data;
    setUser(me);
    localStorage.setItem(USER_KEY, JSON.stringify(me));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
