"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Bed, Maximize, Heart, Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useFavorites } from "@/lib/favoritesContext";
import type { Room } from "@/types/room";

interface RoomCardProps {
  room: Room;
  priority?: boolean; // Pour la première image (LCP)
}

/**
 * Molécule Feature — Carte d'une annonce de colocation.
 * Design inspiré Airbnb avec l'identité visuelle Roomshare.
 */
export function RoomCard({ room, priority = false }: RoomCardProps) {
  const mainImage = room.images?.[0] || "/placeholder-room.jpg";
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(room.id);

  // Calculer si l'annonce est récente (< 7 jours)
  const isNew = (() => {
    if (!room.created_at) return false;
    const createdDate = new Date(room.created_at);
    const daysSinceCreation = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation < 7;
  })();

  // Formater la date de disponibilité
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
  const imageCount = room.images?.length || 0;

  return (
    <Link href={`/rooms/${room.id}`} className="block group">
      <Card className="overflow-hidden p-0 transition-all duration-300 hover:shadow-xl cursor-pointer border-border/50 hover:border-border">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={mainImage}
            alt={room.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />

          {/* Overlay gradient pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badge "Nouveau" en haut à gauche */}
          {isNew && (
            <div className="absolute left-3 top-3 z-10">
              <Badge className="bg-accent text-accent-foreground border-0 shadow-md px-2.5 py-1">
                <span className="text-xs font-semibold">Nouveau</span>
              </Badge>
            </div>
          )}

          {/* Badge "Vérifié" si annonce manuelle */}
          {room.source_type === "manual" && (
            <div className="absolute left-3 top-3 z-10">
              <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0 shadow-md flex items-center gap-1 px-2.5 py-1">
                <CheckCircle2 size={12} className="text-accent" />
                <span className="text-xs font-medium">Vérifié</span>
              </Badge>
            </div>
          )}

          {/* Compteur d'images */}
          {imageCount > 1 && (
            <div className="absolute right-3 top-3 z-10 rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground shadow-md">
              {imageCount} photos
            </div>
          )}

          {/* Prix en bas à gauche avec style premium */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="rounded-[var(--radius-button)] bg-primary px-2.5 py-1.5 shadow-xl">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-primary-foreground">
                  {room.budget}
                </span>
                <span className="text-[10px] font-medium text-primary-foreground/80">
                  €/mois
                </span>
              </div>
            </div>
          </div>

          {/* Bouton Favori amélioré */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(room.id).catch((err) => {
                console.error("Erreur toggle favori:", err);
              });
            }}
            className="absolute right-3 bottom-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-all hover:bg-background hover:scale-110 active:scale-95 shadow-lg"
            aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              size={20}
              className={`transition-all duration-200 ${
                liked
                  ? "fill-error text-error scale-110"
                  : "text-foreground group-hover:text-error"
              }`}
            />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-3 p-4">
          {/* En-tête avec titre et localisation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-base font-semibold text-foreground leading-snug flex-1">
                {room.title}
              </h3>
            </div>

            {/* Localisation avec icône */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={14} className="shrink-0 text-accent" />
              <span className="line-clamp-1">
                {room.address.street && `${room.address.street}, `}
                {room.address.city} {room.address.zip_code}
              </span>
            </div>
          </div>

          {/* Spécifications principales */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Bed size={16} className="text-foreground/60" />
              <span className="font-medium text-foreground">
                {room.rooms_count} chambre{room.rooms_count > 1 ? "s" : ""}
              </span>
            </div>
            {room.surface && (
              <div className="flex items-center gap-1.5">
                <Maximize size={16} className="text-foreground/60" />
                <span className="font-medium text-foreground">{room.surface} m²</span>
              </div>
            )}
          </div>

          {/* Disponibilité */}
          {availabilityText && (
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar size={14} className="text-accent shrink-0" />
              <span className="font-medium text-accent">{availabilityText}</span>
            </div>
          )}

          {/* Tags et amenities */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {room.is_furnished && (
              <Badge
                variant="accent"
                className="text-xs font-medium px-2.5 py-1 border-0"
              >
                Meublé
              </Badge>
            )}
            {room.amenities?.slice(0, 2).map((amenity) => (
              <Badge
                key={amenity}
                variant="muted"
                className="text-xs font-medium px-2.5 py-1 capitalize"
              >
                {amenity.replace(/-/g, " ")}
              </Badge>
            ))}
            {room.amenities && room.amenities.length > 2 && (
              <span className="text-xs text-muted-foreground font-medium">
                +{room.amenities.length - 2}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
