"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * Splash Screen PWA — Affiché pendant 1.5s au premier chargement.
 * Logo Roomshare (Maison + Localisation) centré, fond blanc pur.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500">
      {/* Logo animé */}
      <div className="animate-[fadeIn_0.8s_ease-out]">
        <Logo size={120} className="text-primary" />
      </div>

      {/* Marque */}
      <h1 className="mt-4 animate-[fadeIn_0.8s_ease-out_0.3s_both] text-2xl font-bold tracking-tight text-foreground">
        room<span className="text-accent">share</span>
      </h1>

      <p className="mt-2 animate-[fadeIn_0.8s_ease-out_0.6s_both] text-sm text-muted-foreground">
        Colocation express a Reims
      </p>

      {/* Spinner */}
      <div className="mt-8 h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
