"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Search, User, Loader2 } from "lucide-react";
import { chatService } from "@/lib/chatService";
import { userService, type UserSearchResult } from "@/lib/userService";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import type { Conversation } from "@/types/chat";

/** Ne jamais afficher ces comptes dans les suggestions (proprio = Freeway.jr, locataire = Jérôme). */
const EXCLUDED_NAMES = ["test", "alice"];

function normalizeName(name: unknown): string {
  if (name == null) return "";
  return String(name).replace(/\s+/g, " ").replace(/\u00a0/g, "").trim().toLowerCase();
}

function isExcludedUser(u: UserSearchResult | null | undefined): boolean {
  if (!u) return false;
  const n = normalizeName(u.name);
  const firstWord = n.split(" ")[0] || "";
  return EXCLUDED_NAMES.includes(n) || EXCLUDED_NAMES.includes(firstWord);
}

function filterOutDemoUsers(list: UserSearchResult[]): UserSearchResult[] {
  if (!Array.isArray(list)) return [];
  return list.filter((u) => !isExcludedUser(u));
}

/**
 * Page /messages — Liste des conversations améliorée.
 * Design inspiré Airbnb avec la DA Roomshare.
 */
function MessagesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await chatService.getConversations();
        setConversations(response.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Charger les suggestions si aucune conversation
  useEffect(() => {
    if (!loading && conversations.length === 0 && !searchQuery) {
      const fetchSuggestions = async () => {
        try {
          setLoadingSuggestions(true);
          const res = await userService.getSuggestions();
          const raw = res?.data;
          const list = Array.isArray(raw) ? raw : [];
          setSuggestions(filterOutDemoUsers(list));
        } catch {
          // silently fail
        } finally {
          setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    }
  }, [loading, conversations.length, searchQuery]);

  // Recherche d'utilisateurs avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await userService.search(searchQuery.trim());
          setSearchResults(filterOutDemoUsers(res.data ?? []));
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContactUser = useCallback(
    async (userId: string, userName: string) => {
      try {
        // Générer le message initial personnalisé selon le rôle
        let initialMessage: string | undefined;
        if (user?.role === "owner") {
          // Propriétaire contacte locataire : message personnalisé
          const firstName = userName.split(" ")[0];
          initialMessage = `Bonjour ${firstName}, j'ai vu que vous cherchiez un logement à Reims, mon annonce pourrait vous intéresser !`;
        }
        // Si tenant contacte owner, pas de message automatique (comportement actuel)

        const res = await chatService.createConversation(
          userId,
          "direct",
          `Contact direct - ${userName}`,
          initialMessage
        );
        const conversationId = res.data.id || res.data._id;
        router.push(`/messages/${conversationId}`);
        toast.success("Conversation ouverte");
      } catch (error) {
        console.error("Erreur création conversation:", error);
        toast.error("Impossible de contacter cet utilisateur.");
      }
    },
    [router, user?.role]
  );

  // Formater la date de manière relative
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const otherUser = conv.participants.find((p) => p !== user?.id) || "";
    return (
      otherUser.toLowerCase().includes(query) ||
      conv.room_title.toLowerCase().includes(query) ||
      conv.last_message?.toLowerCase().includes(query)
    );
  });

  // Trier par dernière activité
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const dateA = new Date(a.last_message_at || a.created_at).getTime();
    const dateB = new Date(b.last_message_at || b.created_at).getTime();
    return dateB - dateA;
  });

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col">
      {/* ─── Header amélioré ────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Discussions</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Barre de recherche avec dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher une conversation ou un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-muted"
                >
                  ×
                </button>
              )}
              {searching && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
            </div>

            {/* Dropdown résultats de recherche */}
            {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-[var(--radius-card)] border border-border bg-background shadow-lg"
              >
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleContactUser(result.id, result.name)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                  >
                    {result.avatar_url ? (
                      <img
                        src={result.avatar_url}
                        alt={result.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {result.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{result.name}</p>
                      {result.bio && (
                        <p className="truncate text-xs text-muted-foreground">{result.bio}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Liste des conversations ───────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl">
          {/* Loading state */}
          {loading && (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aucune conversation : liste simple des suggestions (style WhatsApp) */}
          {!loading && sortedConversations.length === 0 && !searchQuery && (
            <>
              <div className="px-4 py-4 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">Aucune conversation</p>
                <p className="text-xs text-muted-foreground">Suggestions ci-dessous</p>
              </div>
              {loadingSuggestions ? (
                <div className="divide-y divide-border">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filterOutDemoUsers(suggestions)
                    .filter((s) => !isExcludedUser(s))
                    .map((suggestion) => {
                      const nameNorm = String(suggestion?.name ?? "").trim().toLowerCase();
                      if (nameNorm === "test" || nameNorm === "alice") return null;
                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleContactUser(suggestion.id, suggestion.name)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 active:bg-muted"
                        >
                          {suggestion.avatar_url ? (
                            <img src={suggestion.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                              {suggestion.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate text-[15px] font-medium text-foreground">{suggestion.name}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {suggestion.role === "owner" ? "Propriétaire" : "Locataire"}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-accent">Contacter</span>
                        </button>
                      );
                    })}
                </div>
              )}
              {!loadingSuggestions && filterOutDemoUsers(suggestions).filter((s) => !isExcludedUser(s)).length === 0 && (
                <p className="px-4 py-4 text-center text-sm text-muted-foreground">Aucune suggestion.</p>
              )}
            </>
          )}

          {/* Recherche sans résultat */}
          {!loading && sortedConversations.length === 0 && searchQuery && searchResults.length === 0 && !searching && (
            <div className="px-4 py-12 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Aucun résultat</p>
              <p className="text-xs text-muted-foreground">Essayez un autre terme.</p>
            </div>
          )}

          {/* Liste des discussions — 1 ligne par conversation (style WhatsApp) */}
          {!loading && sortedConversations.length > 0 && (
            <div className="divide-y divide-border">
              {sortedConversations.map((conv) => {
                const otherUserId = conv.participants.find((p) => p !== user?.id) || "";
                const displayName = conv.other_participant_name || conv.room_title || otherUserId || "Discussion";
                const isUnread = conv.last_sender_id !== user?.id && !!conv.last_message;
                const timeAgo = conv.last_message_at
                  ? formatTimeAgo(conv.last_message_at)
                  : "";
                const lastPreview = conv.last_message?.trim() || "Nouvelle conversation";

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
                  >
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                      {displayName.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Ligne 1 : nom + heure | Ligne 2 : aperçu */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[15px] font-medium text-foreground">
                          {displayName}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={`flex-1 truncate text-sm ${
                            isUnread ? "font-medium text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {lastPreview}
                        </p>
                        {isUnread && (
                          <span className="shrink-0 h-2.5 w-2.5 rounded-full bg-accent" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesPageContent />
    </ProtectedRoute>
  );
}
