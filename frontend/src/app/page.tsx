"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, MapPin, Grid3x3, List as ListIcon, ArrowUpDown } from "lucide-react";
import { RoomList } from "@/components/features/RoomList";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

/**
 * Landing Page "Explorer" — Roomshare
 *
 * Design inspiré Airbnb avec la DA Roomshare.
 * Filtres fonctionnels, recherche, tri et vue améliorée.
 */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [budgetMin, setBudgetMin] = useState<number | undefined>();
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [sourceType, setSourceType] = useState<"manual" | "scraped" | "all">("all");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "newest" | "default">("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (budgetMin !== undefined) count++;
    if (budgetMax !== undefined) count++;
    if (sourceType !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [budgetMin, budgetMax, sourceType, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setBudgetMin(undefined);
    setBudgetMax(undefined);
    setSourceType("all");
    setSortBy("default");
  };

  return (
    <div className="flex flex-col">
      {/* ─── Header sticky amélioré ──────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Logo et navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Logo size={56} />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                room<span className="text-accent">share</span>
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/map"
                className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:flex"
              >
                <MapPin size={16} />
                <span>Carte</span>
              </Link>
              <span className="text-xs font-medium text-muted-foreground">
                Reims
              </span>
            </div>
          </div>

          {/* Barre de recherche améliorée */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-button)] border border-border bg-muted px-4 py-3 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Rechercher un quartier, une adresse, un type de logement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-muted"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-12 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 py-3 text-sm font-medium transition-all hover:bg-muted ${
                showFilters || activeFiltersCount > 0
                  ? "bg-accent-light text-accent border-accent"
                  : "bg-background"
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filtres</span>
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 bg-accent text-accent-foreground border-0 px-1.5 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </button>
          </div>

          {/* Panel de filtres */}
          {showFilters && (
            <div className="mt-4 animate-[slideUp_0.2s_ease-out] rounded-[var(--radius-card)] border border-border bg-background p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Filtres</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-accent hover:underline"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Budget */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Budget minimum (€/mois)
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={budgetMin || ""}
                    onChange={(e) =>
                      setBudgetMin(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-[var(--radius-button)] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Budget maximum (€/mois)
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={budgetMax || ""}
                    onChange={(e) =>
                      setBudgetMax(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full rounded-[var(--radius-button)] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                {/* Type de source */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Type d'annonce
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as typeof sourceType)}
                    className="w-full rounded-[var(--radius-button)] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="all">Toutes</option>
                    <option value="manual">Vérifiées</option>
                    <option value="scraped">Autres</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── Contenu principal ──────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-6">
        {/* Barre d'outils (tri, vue, compteur) */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Colocations disponibles
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Trouvez votre logement express à Reims
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Compteur d'annonces (desktop) - sera mis à jour par RoomList */}
            <div className="hidden text-sm text-muted-foreground sm:block" id="room-count">
              —
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-[var(--radius-button)] border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="default">Par défaut</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="newest">Plus récentes</option>
              </select>
            </div>

            {/* Vue (grid/list) */}
            <div className="flex items-center gap-1 rounded-[var(--radius-button)] border border-border bg-background p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded px-2 py-1 transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label="Vue grille"
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded px-2 py-1 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label="Vue liste"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Liste avec filtres intégrés */}
        <RoomList
          searchQuery={searchQuery}
          budgetMin={budgetMin}
          budgetMax={budgetMax}
          sourceType={sourceType}
          sortBy={sortBy}
          viewMode={viewMode}
        />
      </section>
    </div>
  );
}
