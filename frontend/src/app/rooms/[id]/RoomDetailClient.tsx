"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Maximize,
  Calendar,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Home,
} from "lucide-react";
import { roomService } from "@/lib/apiClient";
import { chatService } from "@/lib/chatService";
import { useAuth } from "@/lib/authContext";
import { useFavorites } from "@/lib/favoritesContext";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { RoomCard } from "@/components/features/RoomCard";
import { PassPurchaseModal } from "@/components/profile/PassPurchaseModal";
import { toast } from "sonner";
import type { Room } from "@/types/room";
import { MAP_STYLE_URL } from "@/lib/mapConfig";
import "maplibre-gl/dist/maplibre-gl.css";

// Mapping des amenities vers des icônes
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={16} />,
  parking: <Car size={16} />,
  "machine-a-laver": <Waves size={16} />,
  "cuisine-equipee": <UtensilsCrossed size={16} />,
  jardin: <Home size={16} />,
};

export default function RoomDetailClient() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const mapRef = useRef<MapRef | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [otherRooms, setOtherRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOtherRooms, setLoadingOtherRooms] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const hasActivePass =
    user?.pass_expires_at && new Date(user.pass_expires_at) > new Date();
  const isOwner = user?.id && room?.owner_id && user.id === room.owner_id;
  const showEarlyAccessLock =
    Boolean(room?.is_early_access_locked) && !hasActivePass && !user?.is_pro && !isOwner;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await roomService.getById(roomId);
        setRoom(res.data);
      } catch (err) {
        console.error("[Roomshare] Room fetch error:", err);
        toast.error("Impossible de charger l'annonce.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [roomId, router]);

  // Charger d'autres annonces similaires
  useEffect(() => {
    const fetchOtherRooms = async () => {
      if (!room) return;
      try {
        setLoadingOtherRooms(true);
        const response = await roomService.getAll();
        // Filtrer pour exclure l'annonce actuelle et prendre les 6 premières
        const filtered = response.data
          .filter((r) => r.id !== room.id)
          .slice(0, 6);
        setOtherRooms(filtered);
      } catch (err) {
        console.error("[Roomshare] Error fetching other rooms:", err);
      } finally {
        setLoadingOtherRooms(false);
      }
    };
    fetchOtherRooms();
  }, [room]);

  const handleContact = async () => {
    if (!user || !room) {
      if (!user) router.push("/login");
      return;
    }
    
    setContacting(true);
    try {
      // Utiliser owner_id de la room si disponible, sinon "system" pour les annonces scrapées
      const recipientId = room.owner_id || "system";
      
      // Le backend findOrCreateBetween va vérifier si une conversation existe déjà
      const res = await chatService.createConversation(
        recipientId,
        room.id || room._id!,
        room.title
      );
      
      const conversationId = res.data.id || res.data._id;
      toast.success("Conversation ouverte");
      
      // Rediriger vers la conversation et focus l'input après un court délai
      router.push(`/messages/${conversationId}`);
      
      // Focus l'input après la navigation (via query param ou state)
      setTimeout(() => {
        const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
        input?.focus();
      }, 300);
    } catch (error) {
      console.error("[Roomshare] Erreur création conversation:", error);
      toast.error("Impossible de contacter l'annonceur.");
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!room) return null;

  const images = room.images?.length > 0 ? room.images : [];
  const liked = isFavorite(room.id);
  const lng = room.location?.coordinates?.[0] ?? 3.57;
  const lat = room.location?.coordinates?.[1] ?? 49.25;

  // Calculer si l'annonce est récente
  const isNew = (() => {
    if (!room.created_at) return false;
    const createdDate = new Date(room.created_at);
    const daysSinceCreation = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation < 7;
  })();

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
    if (diffDays <= 7) return `Disponible dans ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const availabilityText = formatAvailability(room.availability);

  return (
    <div className="flex flex-col pb-32">
      {/* ─── Galerie d'images améliorée ───────────────────── */}
      <div className="relative w-full">
        {/* Image principale */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[16/9]">
          {images.length > 0 ? (
            <>
              <ImageWithFallback
                src={images[imgIndex]}
                alt={room.title}
                fill
                className="object-cover"
                fallbackClassName="absolute inset-0"
                sizes="100vw"
                priority={imgIndex === 0}
                loading={imgIndex === 0 ? "eager" : "lazy"}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                    aria-label="Photo précédente"
                    className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-lg transition-all hover:bg-background hover:scale-110"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                    aria-label="Photo suivante"
                    className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-lg transition-all hover:bg-background hover:scale-110"
                  >
                    <ChevronRight size={20} />
                  </button>
                  {/* Compteur d'images */}
                  <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/90 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-foreground shadow-lg">
                    {imgIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Bed size={48} className="text-muted-foreground/30" />
            </div>
          )}

          {/* Navigation overlay */}
          <div className="absolute left-4 top-4 z-10 flex gap-2">
            <button
              onClick={() => router.back()}
              aria-label="Retour"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-lg transition-all hover:bg-background hover:scale-110"
            >
              <ArrowLeft size={18} />
            </button>
            {isNew && (
              <Badge className="bg-accent text-accent-foreground border-0 shadow-md px-3 py-1.5">
                <span className="text-xs font-semibold">Nouveau</span>
              </Badge>
            )}
            {room.source_type === "manual" && (
              <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-0 shadow-md flex items-center gap-1.5 px-3 py-1.5">
                <CheckCircle2 size={12} className="text-accent" />
                <span className="text-xs font-medium">Vérifié</span>
              </Badge>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(room.id);
            }}
            aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-lg transition-all hover:bg-background hover:scale-110 active:scale-95"
          >
            <Heart
              size={20}
              className={`transition-colors ${liked ? "fill-error text-error" : "text-foreground"}`}
            />
          </button>
        </div>

        {/* Grille d'images secondaires (si plusieurs images) */}
        {images.length > 1 && (
          <div className="hidden grid-cols-4 gap-1 p-1 bg-background sm:grid">
            {images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setImgIndex(idx)}
                className={`relative aspect-square overflow-hidden rounded-lg transition-all ${
                  idx === imgIndex ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"
                }`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${room.title} - Photo ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 25vw, 200px"
                />
              </button>
            ))}
            {images.length > 4 && (
              <button
                onClick={() => setShowAllImages(!showAllImages)}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
              >
                +{images.length - 4}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Contenu principal ─────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-4 pt-6">
        {/* En-tête avec titre, localisation et prix */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{room.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-accent shrink-0" />
                  <span>
                    {room.address.street && `${room.address.street}, `}
                    {room.address.city} {room.address.zip_code}
                  </span>
                </div>
                {room.source_type === "manual" && (
                  <div className="flex items-center gap-1.5 text-accent">
                    <CheckCircle2 size={14} />
                    <span className="font-medium">Annonce vérifiée</span>
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 rounded-[var(--radius-card)] px-6 py-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{room.budget}</span>
                <span className="text-sm font-medium text-muted-foreground">€/mois</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Spécifications principales ───────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-6">
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2">
            <Bed size={18} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              {room.rooms_count} chambre{room.rooms_count > 1 ? "s" : ""}
            </span>
          </div>
          {room.surface && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2">
              <Maximize size={18} className="text-accent" />
              <span className="text-sm font-semibold text-foreground">{room.surface} m²</span>
            </div>
          )}
          {room.is_furnished && (
            <Badge variant="accent" className="px-3 py-1.5 text-sm font-medium">
              Meublé
            </Badge>
          )}
          {availabilityText && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2">
              <Calendar size={18} className="text-accent" />
              <span className="text-sm font-semibold text-accent">{availabilityText}</span>
            </div>
          )}
        </div>

        {/* ─── Description ──────────────────────────────────── */}
        {room.description && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">À propos de ce logement</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {room.description}
            </p>
          </div>
        )}

        {/* ─── Équipements ──────────────────────────────────── */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Équipements</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {room.amenities.map((amenity) => {
                const icon = amenityIcons[amenity.toLowerCase()] || <Home size={16} />;
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <span className="text-accent">{icon}</span>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {amenity.replace(/-/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Carte interactive ───────────────────────────── */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Localisation</h2>
          <div className="h-64 overflow-hidden rounded-[var(--radius-card)] border border-border">
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: lng,
                latitude: lat,
                zoom: 15,
              }}
              mapStyle={MAP_STYLE_URL}
              style={{ width: "100%", height: "100%" }}
              attributionControl={false}
            >
              <Marker longitude={lng} latitude={lat} anchor="bottom">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-accent p-2 shadow-lg">
                    <MapPin size={20} className="text-accent-foreground fill-current" />
                  </div>
                </div>
              </Marker>
            </Map>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {room.address.street && `${room.address.street}, `}
            {room.address.city} {room.address.zip_code}
          </p>
        </div>

        {/* ─── Autres annonces similaires (Carrousel) ───────── */}
        {otherRooms.length > 0 && (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Autres annonces</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Découvrez d&apos;autres logements similaires
                </p>
              </div>
              <Link
                href="/"
                className="text-sm font-medium text-accent hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <div className="relative">
              {/* Carrousel scrollable */}
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {loadingOtherRooms ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="shrink-0 w-80">
                      <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-card)]" />
                    </div>
                  ))
                ) : (
                  otherRooms.map((otherRoom) => (
                    <div key={otherRoom.id} className="shrink-0 w-80">
                      <RoomCard room={otherRoom} />
                    </div>
                  ))
                )}
              </div>
              {/* Boutons de navigation du carrousel */}
              {otherRooms.length > 3 && (
                <>
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
                      }
                    }}
                    className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-lg transition-all hover:bg-background hover:scale-110"
                    aria-label="Précédent"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
                      }
                    }}
                    className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-lg transition-all hover:bg-background hover:scale-110"
                    aria-label="Suivant"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── CTA fixe en bas (style Airbnb) ────────────────── */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-2xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{room.budget}</span>
                <span className="text-sm text-muted-foreground">€/mois</span>
              </div>
              {availabilityText && (
                <span className="text-xs text-muted-foreground">{availabilityText}</span>
              )}
            </div>
            {showEarlyAccessLock ? (
              <button
                type="button"
                onClick={() => setPassModalOpen(true)}
                className="flex items-center gap-2 rounded-[var(--radius-button)] bg-muted px-8 py-3 text-sm font-semibold text-muted-foreground shadow-lg transition-all hover:bg-muted/80 active:scale-[0.98]"
              >
                <span>🔒</span>
                <span>Accès prioritaire requis</span>
              </button>
            ) : (
              <button
                onClick={handleContact}
                disabled={contacting}
                className="flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition-all hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50"
              >
                {contacting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Ouverture...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    <span>Contacter</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <PassPurchaseModal
        open={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        message="Ne ratez pas cette opportunité, les meilleures colocations partent en moins de 24h !"
      />
    </div>
  );
}
