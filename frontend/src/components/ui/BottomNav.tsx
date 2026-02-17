"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, MapPin, PlusCircle, MessageCircle, User } from "lucide-react";
import { useNotifications } from "@/lib/notificationContext";
import { useAuth } from "@/lib/authContext";
import { usePassModal } from "@/lib/passModalContext";

const navItems = [
  { href: "/", label: "Explorer", icon: Search },
  { href: "/map", label: "Carte", icon: MapPin },
  { href: "/create", label: "Publier", icon: PlusCircle, requiresOwner: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, hasBadge: true },
  { href: "/profile", label: "Profil", icon: User },
];

/**
 * Bottom Navigation Bar — aspect application native (mobile-first).
 * Barre flottante avec pastille rouge de notification sur l'onglet Messages.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const { isPassModalOpen } = usePassModal();

  // Masquer la BottomNav quand la modale d'achat Pass est ouverte
  if (isPassModalOpen) {
    return null;
  }

  // Masquer la BottomNav sur les pages d'authentification, légales, devenir propriétaire et détail d'annonce
  const hiddenRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/privacy",
    "/terms",
    "/profile/become-owner",
  ];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  // Masquer la BottomNav sur la page de conversation (chat avec un utilisateur)
  if (pathname.match(/^\/messages\/[^/]+$/)) {
    return null;
  }

  // Masquer la BottomNav sur les pages de détail d'annonce (/rooms/[id])
  if (pathname.startsWith("/rooms/") && pathname !== "/rooms") {
    return null;
  }

  // Filtrer les items selon le rôle de l'utilisateur
  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresOwner && user?.role !== "owner") {
      return false;
    }
    return true;
  });

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
      <div className="rounded-2xl border border-accent/30 bg-accent backdrop-blur-xl shadow-2xl px-1.5 py-1.5">
        <div className="flex items-center justify-center gap-0.5 pb-[env(safe-area-inset-bottom)]">
          {filteredNavItems.map(({ href, label, icon: Icon, hasBadge }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-xl text-[9px] font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className="transition-all"
                  />
                  {/* Pastille rouge de notification */}
                  {hasBadge && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-error px-1 text-[8px] font-bold text-white shadow-lg">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="leading-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
