"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, MousePointer, TrendingUp, Home } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { roomService } from "@/lib/apiClient";
import type { Room } from "@/types/room";

/** Données simulées pour le MVP (vues et clics par annonce) */
function useSimulatedStats(rooms: Room[]) {
  const [stats, setStats] = useState<Record<string, { views: number; contact_clicks: number }>>({});
  useEffect(() => {
    if (rooms.length === 0) return;
    const next: Record<string, { views: number; contact_clicks: number }> = {};
    rooms.forEach((r) => {
      const id = r.id || (r as { _id?: string })._id || "";
      next[id] = {
        views: Math.floor(Math.random() * 200) + 20,
        contact_clicks: Math.floor(Math.random() * 25) + 2,
      };
    });
    setStats(next);
  }, [rooms]);
  return stats;
}

function ProDashboardContent() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const stats = useSimulatedStats(rooms);

  useEffect(() => {
    const fetchRooms = async () => {
      if (user?.role !== "owner") return;
      try {
        const res = await roomService.getMyRooms();
        setRooms(res.data);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [user?.role]);

  const totalViews = Object.values(stats).reduce((a, s) => a + s.views, 0);
  const totalClicks = Object.values(stats).reduce((a, s) => a + s.contact_clicks, 0);

  if (user?.role !== "owner") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Réservé aux propriétaires.</p>
        <Link href="/profile" className="mt-4 inline-block text-accent hover:underline">
          Retour au profil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={18} />
              Retour au profil
            </Link>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              Dashboard Pro
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Récapitulatif de vos annonces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vues et clics sur le bouton &quot;Contacter&quot; (données simulées pour le MVP).
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Blocs récap globaux */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye size={20} />
              <span className="text-sm font-medium">Total vues</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{loading ? "—" : totalViews}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MousePointer size={20} />
              <span className="text-sm font-medium">Clics contact</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{loading ? "—" : totalClicks}</p>
          </div>
        </div>

        {/* Liste des annonces avec stats simulées */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Home size={20} />
            Par annonce
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-[var(--radius-card)] bg-muted"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-8 text-center text-muted-foreground">
              Aucune annonce. Publiez une annonce depuis votre profil pour voir les statistiques.
              <Link href="/profile" className="mt-2 block text-accent hover:underline">
                Aller au profil
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {rooms.map((room) => {
                const s = stats[room.id || (room as { _id?: string })._id || ""] ?? {
                  views: 0,
                  contact_clicks: 0,
                };
                return (
                  <li
                    key={room.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-background p-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{room.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.address?.city} — {room.budget} €/mois
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{s.views} vues</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointer size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{s.contact_clicks} clics</span>
                      </div>
                      <Link
                        href="/pro/dashboard"
                        className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-accent/90"
                      >
                        <TrendingUp size={14} />
                        Booster
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ProDashboardPage() {
  return (
    <ProtectedRoute>
      <ProDashboardContent />
    </ProtectedRoute>
  );
}
