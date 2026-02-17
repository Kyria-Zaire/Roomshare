"use client";

import { useEffect, useState, useMemo } from "react";
import { roomService } from "@/lib/apiClient";
import { RoomCard } from "@/components/features/RoomCard";
import { RoomCardSkeleton } from "@/components/features/RoomCardSkeleton";
import type { Room } from "@/types/room";

interface RoomListProps {
  searchQuery?: string;
  budgetMin?: number;
  budgetMax?: number;
  sourceType?: "manual" | "scraped" | "all";
  sortBy?: "price-asc" | "price-desc" | "newest" | "default";
  viewMode?: "grid" | "list";
  onCountChange?: (count: number) => void;
}

/**
 * Molécule Feature — Liste des annonces de colocation.
 * Gère le data fetching, le loading state, les filtres et le tri.
 */
export function RoomList({
  searchQuery = "",
  budgetMin,
  budgetMax,
  sourceType = "all",
  sortBy = "default",
  viewMode = "grid",
  onCountChange,
}: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les annonces
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const filters: {
          budget_min?: number;
          budget_max?: number;
          source_type?: "manual" | "scraped";
        } = {};

        if (budgetMin !== undefined) filters.budget_min = budgetMin;
        if (budgetMax !== undefined) filters.budget_max = budgetMax;
        if (sourceType !== "all") filters.source_type = sourceType;

        const response = await roomService.getAll(Object.keys(filters).length > 0 ? filters : undefined);
        setRooms(response.data);
      } catch {
        setError("Impossible de charger les annonces. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [budgetMin, budgetMax, sourceType]);

  // Filtrer et trier les annonces
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms];

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (room) =>
          room.title.toLowerCase().includes(query) ||
          room.description?.toLowerCase().includes(query) ||
          room.address.city.toLowerCase().includes(query) ||
          room.address.street?.toLowerCase().includes(query) ||
          room.amenities.some((a) => a.toLowerCase().includes(query))
      );
    }

    // Trier
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.budget - b.budget);
        break;
      case "price-desc":
        result.sort((a, b) => b.budget - a.budget);
        break;
      case "newest":
        result.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        break;
      default:
        // Par défaut : garder l'ordre du serveur
        break;
    }

    return result;
  }, [rooms, searchQuery, sortBy]);

  // Mettre à jour le compteur d'annonces dans le header
  useEffect(() => {
    const countElement = document.getElementById("room-count");
    if (countElement) {
      countElement.textContent = `${filteredAndSortedRooms.length} logement${filteredAndSortedRooms.length !== 1 ? "s" : ""}`;
    }
    onCountChange?.(filteredAndSortedRooms.length);
  }, [filteredAndSortedRooms.length, onCountChange]);

  // ─── Skeleton loading state ─────────────────────────────
  if (loading) {
    return (
      <>
        <div className="mb-4 text-sm text-muted-foreground sm:hidden">
          Chargement...
        </div>
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  // ─── Erreur ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ─── État vide ──────────────────────────────────────────
  if (filteredAndSortedRooms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-foreground">
          {searchQuery || budgetMin || budgetMax || sourceType !== "all"
            ? "Aucun résultat trouvé"
            : "Aucune annonce pour le moment"}
        </p>
        <p className="text-sm text-muted-foreground">
          {searchQuery || budgetMin || budgetMax || sourceType !== "all"
            ? "Essayez de modifier vos critères de recherche"
            : "Les premières colocations arrivent bientôt sur Roomshare !"}
        </p>
      </div>
    );
  }

  // ─── Liste ──────────────────────────────────────────────
  return (
    <>
      {/* Compteur d'annonces (mobile) */}
      <div className="mb-4 text-sm text-muted-foreground sm:hidden">
        {filteredAndSortedRooms.length} logement{filteredAndSortedRooms.length !== 1 ? "s" : ""} disponible
        {filteredAndSortedRooms.length !== 1 ? "s" : ""}
      </div>

      {/* Grille ou liste */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-4"
        }
      >
        {filteredAndSortedRooms.map((room, index) => (
          <RoomCard key={room.id} room={room} priority={index === 0 && viewMode === "grid"} />
        ))}
      </div>
    </>
  );
}
