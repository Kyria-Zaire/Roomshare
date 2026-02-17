"use client";

import Image from "next/image";
import Link from "next/link";
import { X, MapPin, Bed, Maximize, Calendar, Heart, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useFavorites } from "@/lib/favoritesContext";
import type { Room } from "@/types/room";

interface MapPreviewCardProps {
  room: Room;
  onClose: () => void;
}

/**
 * Preview Card — Affichée au clic sur un marker.
 * Design inspiré Airbnb avec la DA Roomshare.
 */
export function MapPreviewCard({ room, onClose }: MapPreviewCardProps) {
  const mainImage = room.images?.[0] || "/placeholder-room.jpg";
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(room.id);

  // Formater la disponibilité
  const formatAvailability = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Disponible maintenant";
    if (diffDays === 0) return "Disponible aujourd'hui";
    if (diffDays === 1) return "Disponible demain";
    if (diffDays <= 7) return `Dispo dans ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const availabilityText = formatAvailability(room.availability);

  return (
    <div className="absolute bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-[slideUp_0.25s_ease-out] overflow-hidden rounded-[var(--radius-card)] border border-border bg-background shadow-2xl sm:bottom-4">
      {/* Header avec bouton fermer et favori */}
      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={mainImage}
            alt={room.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            priority
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Boutons overlay */}
          <div className="absolute left-3 top-3 flex gap-2">
            {room.source_type === "manual" && (
              <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0 shadow-md text-xs px-2 py-1">
                Vérifié
              </Badge>
            )}
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(room.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-md transition-all hover:bg-background hover:scale-110"
            >
              <Heart
                size={16}
                className={`transition-colors ${liked ? "fill-error text-error" : "text-foreground"}`}
              />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-md transition-all hover:bg-background hover:scale-110"
            >
              <X size={14} />
            </button>
          </div>

          {/* Prix overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="rounded-[var(--radius-button)] bg-primary px-3 py-1.5 shadow-lg">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-primary-foreground">{room.budget}</span>
                <span className="text-xs font-medium text-primary-foreground/80">€/mois</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Titre et localisation */}
        <div className="mb-3">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground leading-snug">
            {room.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} className="text-accent shrink-0" />
            <span className="line-clamp-1">
              {room.address.street && `${room.address.street}, `}
              {room.address.city} {room.address.zip_code}
            </span>
          </div>
        </div>

        {/* Spécifications */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs">
            <Bed size={12} className="text-accent" />
            <span className="font-medium text-foreground">
              {room.rooms_count} chambre{room.rooms_count > 1 ? "s" : ""}
            </span>
          </div>
          {room.surface && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs">
              <Maximize size={12} className="text-accent" />
              <span className="font-medium text-foreground">{room.surface} m²</span>
            </div>
          )}
          {room.is_furnished && (
            <Badge variant="accent" className="text-xs px-2 py-0.5">
              Meublé
            </Badge>
          )}
          {availabilityText && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs">
              <Calendar size={12} className="text-accent" />
              <span className="font-medium text-accent">{availabilityText}</span>
            </div>
          )}
        </div>

        {/* Amenities (premiers) */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="muted" className="text-[10px] px-2 py-0.5 capitalize">
                {amenity.replace(/-/g, " ")}
              </Badge>
            ))}
            {room.amenities.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{room.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Bouton Voir les détails */}
        <Link
          href={`/rooms/${room.id}`}
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98]"
        >
          <span>Voir les détails</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
