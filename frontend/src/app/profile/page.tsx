"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  Heart,
  Home,
  Copy,
  Check,
  Settings,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  MapPin,
  Calendar,
  MessageCircle,
  Star,
  LogOut,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useFavorites } from "@/lib/favoritesContext";
import { roomService } from "@/lib/apiClient";
import { chatService } from "@/lib/chatService";
import { RoomCard } from "@/components/features/RoomCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { SettingsSection } from "@/components/profile/SettingsSection";
import { toast } from "sonner";
import type { Room } from "@/types/room";

/**
 * Page /profile — Profil utilisateur amélioré.
 * Design inspiré Airbnb avec la DA Roomshare.
 */
function ProfilePageContent() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { favorites } = useFavorites();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [publishedRooms, setPublishedRooms] = useState<Room[]>([]);
  const [searchedRooms, setSearchedRooms] = useState<Room[]>([]); // Annonces contactées par le locataire
  const [loading, setLoading] = useState(true);
  const [loadingPublished, setLoadingPublished] = useState(false);
  const [loadingSearched, setLoadingSearched] = useState(false);
  const [tab, setTab] = useState<"favorites" | "published" | "settings">("favorites");
  const [copied, setCopied] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  // Retour Stripe : afficher un toast et ouvrir l'onglet Paramètres
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "true") {
      setTab("settings");
      refreshUser?.();
      toast.success("Paiement réussi ! Votre Pass est actif.");
      router.replace("/profile", { scroll: false });
    } else if (canceled === "true") {
      setTab("settings");
      toast.info("Paiement annulé.");
      router.replace("/profile", { scroll: false });
    }
  }, [searchParams, router, refreshUser]);

  // Charger toutes les annonces pour les favoris
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomService.getAll();
        setRooms(response.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // Charger les annonces publiées par l'utilisateur (au mount pour le compteur)
  useEffect(() => {
    const fetchMyRooms = async () => {
      if (user) {
        try {
          setLoadingPublished(true);
          const response = await roomService.getMyRooms();
          setPublishedRooms(response.data);
        } catch (error) {
          console.error("Erreur chargement mes annonces:", error);
          setPublishedRooms([]);
        } finally {
          setLoadingPublished(false);
        }
      } else {
        setPublishedRooms([]);
      }
    };
    fetchMyRooms();
  }, [user]);

  // Charger les annonces contactées par le locataire (conversations)
  useEffect(() => {
    const fetchSearchedRooms = async () => {
      if (user?.role === "tenant") {
        try {
          setLoadingSearched(true);
          // Récupérer les conversations du locataire
          const conversationsResponse = await chatService.getConversations();
          const conversations = conversationsResponse.data;
          
          // Extraire les room_id uniques
          const roomIds = [...new Set(conversations.map((conv) => conv.room_id))];
          
          if (roomIds.length > 0) {
            // Charger les annonces correspondantes
            const allRoomsResponse = await roomService.getAll();
            const searched = allRoomsResponse.data.filter((room) =>
              roomIds.includes(room.id || room._id || "")
            );
            setSearchedRooms(searched);
          } else {
            setSearchedRooms([]);
          }
        } catch (error) {
          console.error("Erreur chargement mes recherches:", error);
          setSearchedRooms([]);
        } finally {
          setLoadingSearched(false);
        }
      } else {
        setSearchedRooms([]);
      }
    };
    fetchSearchedRooms();
  }, [user]);

  // Charger le nombre de messages non lus
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(null);
        return;
      }
      try {
        const response = await chatService.getUnreadCount();
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        // Ignorer silencieusement si l'utilisateur n'est pas authentifié
        setUnreadCount(null);
      }
    };
    fetchUnreadCount();
  }, [user]);

  const favoriteRooms = rooms.filter((r) => favorites.includes(r.id));

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success("ID copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Utiliser la couleur du logo Roomshare pour l'avatar (via CSS variable)
  const avatarColor = "var(--color-accent)"; // Couleur accent Roomshare depuis globals.css
  const userInitials = user ? user.name.substring(0, 2).toUpperCase() : "??";

  const tabs = [
    {
      id: "favorites" as const,
      label: "Favoris",
      icon: Heart,
      count: favoriteRooms.length,
    },
    {
      id: "published" as const,
      label: user?.role === "owner" ? "Mes annonces" : "Mes recherches",
      icon: user?.role === "owner" ? Home : Search,
      count: user?.role === "owner" ? publishedRooms.length : searchedRooms.length,
    },
    {
      id: "settings" as const,
      label: "Paramètres",
      icon: Settings,
      count: 0,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ─── Header amélioré ────────────────────────────────── */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Profil utilisateur */}
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground shadow-lg">
                {userInitials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user?.name || "Mon profil"}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 font-mono text-xs font-medium text-muted-foreground">
                    {user?.email || "Non connecté"}
                  </span>
                  {user?.is_pro && (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                      Pro
                    </span>
                  )}
                  {user?.pass_expires_at && new Date(user.pass_expires_at) > new Date() && !user?.is_pro && (
                    <span className="rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-accent-foreground">
                      Pass actif
                    </span>
                  )}
                  {user && (
                    <button
                      onClick={handleCopyId}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
                      title="Copier l'ID"
                    >
                      {copied ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Copy size={14} className="text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {user ? `Membre depuis ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}` : "Connectez-vous pour accéder à votre profil"}
                </p>
              </div>
            </div>

            {/* Actions rapides */}
            {user?.role === "owner" && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/create"
                  className="flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98]"
                >
                  <Plus size={16} />
                  <span>Publier une annonce</span>
                </Link>
              </div>
            )}
            {user?.role === "tenant" && (
              <div className="flex flex-wrap items-center gap-2">
                {user?.verification_status === "pending" ? (
                  <button
                    disabled
                    className="flex items-center gap-2 rounded-[var(--radius-button)] bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed"
                  >
                    <Plus size={16} />
                    <span>Vérification en cours...</span>
                  </button>
                ) : (
                  <Link
                    href="/profile/become-owner"
                    className="flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98]"
                  >
                    <Plus size={16} />
                    <span>Devenir propriétaire</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart size={16} />
                <span className="text-xs font-medium">Favoris</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{favoriteRooms.length}</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Home size={16} />
                <span className="text-xs font-medium">
                  {user?.role === "owner" ? "Annonces" : "Recherches"}
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {user?.role === "owner" ? publishedRooms.length : searchedRooms.length}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle size={16} />
                <span className="text-xs font-medium">Messages</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {unreadCount !== null ? unreadCount : "—"}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star size={16} />
                <span className="text-xs font-medium">Note</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">—</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Tabs améliorés ────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl">
          {tabs.map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <TabIcon size={18} />
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-accent text-white border-0 px-2 py-0.5 text-xs font-bold shadow-sm">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Contenu ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : tab === "favorites" ? (
          favoriteRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light">
                <Heart size={36} className="text-accent" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Aucun favori</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Appuyez sur le cœur d&apos;une annonce pour la sauvegarder dans vos favoris.
                </p>
              </div>
              <Link
                href="/"
                className="mt-4 rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gray-800"
              >
                Explorer les annonces
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {favoriteRooms.length} favori{favoriteRooms.length !== 1 ? "s" : ""}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vos annonces sauvegardées pour plus tard
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </>
          )
        ) : tab === "published" ? (
          user?.role === "owner" ? (
            // ─── Propriétaire : Mes annonces ────────────────────────
            loadingPublished ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] w-full rounded-[var(--radius-card)]" />
                ))}
              </div>
            ) : publishedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light">
                  <Home size={36} className="text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Aucune annonce publiée</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Publiez votre première annonce pour commencer à recevoir des messages.
                  </p>
                </div>
                <Link
                  href="/create"
                  className="mt-4 flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Plus size={16} />
                  Publier une annonce
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {publishedRooms.length} annonce{publishedRooms.length !== 1 ? "s" : ""} publiée
                      {publishedRooms.length !== 1 ? "s" : ""}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Gérez vos annonces et consultez les statistiques
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/pro/dashboard"
                      className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                    >
                      <TrendingUp size={16} />
                      Dashboard Pro
                    </Link>
                    <Link
                      href="/create"
                      className="flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                      <Plus size={16} />
                      Nouvelle annonce
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {publishedRooms.map((room) => (
                    <div key={room.id} className="relative">
                      <RoomCard room={room} />
                      <div className="absolute right-2 top-2 flex gap-2">
                        <Link
                          href="/pro/dashboard"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/90 backdrop-blur-sm text-accent-foreground shadow-md transition-colors hover:bg-accent"
                          title="Booster mon annonce"
                        >
                          <TrendingUp size={14} />
                        </Link>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-foreground shadow-md transition-colors hover:bg-background"
                          title="Modifier"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-error/90 backdrop-blur-sm text-error-foreground shadow-md transition-colors hover:bg-error"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            // ─── Locataire : Mes recherches (annonces contactées) ────
            loadingSearched ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] w-full rounded-[var(--radius-card)]" />
                ))}
              </div>
            ) : searchedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light">
                  <Search size={36} className="text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Aucune recherche</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Les annonces que vous contactez apparaîtront ici.
                  </p>
                </div>
                <Link
                  href="/"
                  className="mt-4 flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Search size={16} />
                  Explorer les annonces
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {searchedRooms.length} recherche{searchedRooms.length !== 1 ? "s" : ""}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Les annonces que vous avez contactées
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    <Search size={16} />
                    Continuer la recherche
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {searchedRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </>
            )
          )
        ) : (
          <SettingsSection />
        )}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
