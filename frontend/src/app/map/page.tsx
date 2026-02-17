"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import { Search, List, X, SlidersHorizontal, ZoomIn, ZoomOut, Navigation2, ChevronRight } from "lucide-react";
import { roomService } from "@/lib/apiClient";
import { MapMarker } from "@/components/features/MapMarker";
import { MapPreviewCard } from "@/components/features/MapPreviewCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Room, MapBounds } from "@/types/room";
import Link from "next/link";
import { MAP_STYLE_URL } from "@/lib/mapConfig";
import "maplibre-gl/dist/maplibre-gl.css";

// ─── Reims center coordinates ────────────────────────────
const REIMS_CENTER = { longitude: 3.5713, latitude: 49.2530 };
const DEFAULT_ZOOM = 13.5;

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]); // Toutes les annonces
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState<{ min?: number; max?: number }>({});
  const [filterByBounds, setFilterByBounds] = useState(false); // Mode filtrage par bounds
  const [viewState, setViewState] = useState({
    longitude: REIMS_CENTER.longitude,
    latitude: REIMS_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
  });

  // ─── Extraire les bounds actuelles de la carte ─────────
  const getBounds = useCallback((): MapBounds | null => {
    const map = mapRef.current;
    if (!map) return null;

    const bounds = map.getMap().getBounds();
    return {
      sw_lng: bounds.getWest(),
      sw_lat: bounds.getSouth(),
      ne_lng: bounds.getEast(),
      ne_lat: bounds.getNorth(),
    };
  }, []);

  // ─── Charger toutes les rooms au démarrage ──────────────
  const fetchAllRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await roomService.getAll();
      setAllRooms(response.data);
      setRooms(response.data);
      setFilterByBounds(false);
    } catch (error) {
      console.error("Erreur chargement annonces:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Charger les rooms par bounds (filtrage géographique) ─
  const fetchRoomsByBounds = useCallback(async () => {
    const bounds = getBounds();
    if (!bounds) return;

    try {
      setLoading(true);
      const response = await roomService.getMapRooms(bounds);
      setRooms(response.data);
      setFilterByBounds(true);
      setShowSearchButton(false);
    } catch (error) {
      console.error("Erreur chargement carte:", error);
    } finally {
      setLoading(false);
    }
  }, [getBounds]);

  // ─── Chargement initial quand la carte est prête ───────
  const handleMapLoad = useCallback(() => {
    // Charger toutes les annonces au démarrage
    fetchAllRooms();
  }, [fetchAllRooms]);

  // ─── Afficher le bouton "Rechercher" quand on bouge ────
  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      setViewState(e.viewState);
      // Afficher le bouton seulement si des rooms sont déjà chargées
      if (rooms.length > 0) {
        setShowSearchButton(true);
      }
    },
    [rooms.length]
  );

  // ─── Zoom controls ────────────────────────────────────
  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomOut();
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapRef.current) {
            const map = mapRef.current.getMap();
            map.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
            });
          }
        },
        () => {
          console.error("Erreur géolocalisation");
        }
      );
    }
  };

  // ─── Chargement initial au mount ───────────────────────
  useEffect(() => {
    const timer = setTimeout(fetchAllRooms, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Appliquer les filtres sur les rooms ───────────────
  useEffect(() => {
    const baseRooms = filterByBounds ? rooms : allRooms;
    
    let filteredRooms = baseRooms;

    // Filtrer par budget si défini
    if (budgetFilter.min !== undefined || budgetFilter.max !== undefined) {
      filteredRooms = filteredRooms.filter((room) => {
        if (budgetFilter.min !== undefined && room.budget < budgetFilter.min) return false;
        if (budgetFilter.max !== undefined && room.budget > budgetFilter.max) return false;
        return true;
      });
    }

    // Filtrer par recherche si défini
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredRooms = filteredRooms.filter(
        (room) =>
          room.title.toLowerCase().includes(query) ||
          room.address.city.toLowerCase().includes(query) ||
          room.address.street?.toLowerCase().includes(query)
      );
    }

    // Si on est en mode filtrage par bounds, on garde rooms tel quel
    // Sinon on applique les filtres sur allRooms
    if (!filterByBounds) {
      setRooms(filteredRooms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetFilter, searchQuery, filterByBounds, allRooms]);

  // Appliquer les filtres sur les rooms affichées
  const filteredRooms = rooms.filter((room) => {
    if (budgetFilter.min !== undefined && room.budget < budgetFilter.min) return false;
    if (budgetFilter.max !== undefined && room.budget > budgetFilter.max) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        room.title.toLowerCase().includes(query) ||
        room.address.city.toLowerCase().includes(query) ||
        room.address.street?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="relative h-[calc(100dvh-5rem)] w-full">
      {/* ─── Carte plein écran ───────────────────────────── */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={handleMapLoad}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {/* ─── Markers ───────────────────────────────────── */}
        {filteredRooms.map((room) => (
          <Marker
            key={room.id}
            longitude={room.location.coordinates[0]}
            latitude={room.location.coordinates[1]}
            anchor="center"
          >
            <MapMarker
              price={room.budget}
              isSelected={selectedRoom?.id === room.id}
              onClick={() => {
                setSelectedRoom(selectedRoom?.id === room.id ? null : room);
                setShowList(false);
              }}
            />
          </Marker>
        ))}
      </Map>

      {/* ─── Header overlay amélioré ────────────────────── */}
      <div className="absolute left-4 right-4 top-4 z-40 flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Barre de recherche principale */}
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-xl backdrop-blur-md">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un quartier, une adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-10 items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 text-sm font-medium shadow-xl backdrop-blur-md transition-all hover:bg-muted ${
              showFilters ? "bg-accent-light text-accent border-accent" : ""
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtres</span>
          </button>
          <button
            onClick={() => setShowList(!showList)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-xl backdrop-blur-md transition-colors hover:bg-muted"
          >
            <List size={18} className="text-foreground" />
          </button>
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-xl backdrop-blur-md transition-colors hover:bg-muted"
          >
            <X size={18} className="text-foreground" />
          </Link>
        </div>
      </div>

      {/* ─── Panel de filtres ────────────────────────────── */}
      {showFilters && (
        <div className="absolute left-4 top-20 z-40 w-64 animate-[slideUp_0.2s_ease-out] rounded-[var(--radius-card)] border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Filtres</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Budget minimum (€/mois)
              </label>
              <input
                type="number"
                placeholder="Min"
                value={budgetFilter.min || ""}
                onChange={(e) =>
                  setBudgetFilter({ ...budgetFilter, min: e.target.value ? Number(e.target.value) : undefined })
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
                value={budgetFilter.max || ""}
                onChange={(e) =>
                  setBudgetFilter({ ...budgetFilter, max: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full rounded-[var(--radius-button)] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            {(budgetFilter.min !== undefined || budgetFilter.max !== undefined) && (
              <button
                onClick={() => setBudgetFilter({})}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Panel latéral avec liste (desktop) ──────────── */}
      {showList && (
        <div className="absolute bottom-0 left-0 right-0 z-40 flex h-[60vh] flex-col border-t border-border bg-background shadow-2xl sm:bottom-auto sm:left-4 sm:right-auto sm:top-20 sm:h-auto sm:max-h-[calc(100vh-8rem)] sm:w-80 sm:rounded-[var(--radius-card)] sm:border sm:border-border">
          {/* Header du panel */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {filteredRooms.length} logement{filteredRooms.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-xs text-muted-foreground">Reims</p>
            </div>
            <button
              onClick={() => setShowList(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <X size={16} />
            </button>
          </div>

          {/* Liste scrollable */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-muted-foreground">Aucun logement trouvé</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Essayez de modifier vos filtres ou de déplacer la carte
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedRoom(room);
                      if (mapRef.current) {
                        const map = mapRef.current.getMap();
                        map.flyTo({
                          center: [room.location.coordinates[0], room.location.coordinates[1]],
                          zoom: 16,
                        });
                      }
                    }}
                    className={`flex gap-3 border-b border-border p-4 text-left transition-colors hover:bg-muted/50 ${
                      selectedRoom?.id === room.id ? "bg-accent-light/30" : ""
                    }`}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={room.images?.[0] || "/placeholder-room.jpg"}
                        alt={room.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                      <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
                        {room.title}
                      </h4>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {room.address.street || room.address.city}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {room.rooms_count} ch. {room.surface && `· ${room.surface} m²`}
                        </span>
                        {room.is_furnished && (
                          <Badge variant="accent" className="text-[10px] px-1.5 py-0.5">
                            Meublé
                          </Badge>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{room.budget}€/mois</span>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Bouton "Rechercher dans cette zone" ─────────── */}
      {showSearchButton && (
        <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2">
          <button
            onClick={fetchRoomsByBounds}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xl transition-all hover:bg-gray-800 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <Search size={14} />
            )}
            Rechercher dans cette zone
          </button>
        </div>
      )}

      {/* ─── Bouton "Voir toutes les annonces" ────────────── */}
      {filterByBounds && (
        <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2">
          <button
            onClick={() => {
              setRooms(allRooms);
              setFilterByBounds(false);
              setShowSearchButton(false);
            }}
            className="flex items-center gap-2 rounded-full bg-background/95 backdrop-blur-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground shadow-xl transition-all hover:bg-muted active:scale-95"
          >
            Voir toutes les annonces ({allRooms.length})
          </button>
        </div>
      )}

      {/* ─── Contrôles de carte (zoom, géolocalisation) ──── */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-lg backdrop-blur-md transition-colors hover:bg-muted"
          aria-label="Zoom avant"
        >
          <ZoomIn size={18} className="text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-lg backdrop-blur-md transition-colors hover:bg-muted"
          aria-label="Zoom arrière"
        >
          <ZoomOut size={18} className="text-foreground" />
        </button>
        <button
          onClick={handleGeolocate}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-lg backdrop-blur-md transition-colors hover:bg-muted"
          aria-label="Ma position"
        >
          <Navigation2 size={18} className="text-foreground" />
        </button>
      </div>

      {/* ─── Compteur d'annonces ──────────────────────────── */}
      {!showList && (
        <div className="absolute bottom-4 left-4 z-40 rounded-full border border-border bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-xl backdrop-blur-md">
          {filteredRooms.length} logement{filteredRooms.length !== 1 ? "s" : ""} disponible
          {filteredRooms.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* ─── Preview Card améliorée ──────────────────────── */}
      {selectedRoom && !showList && (
        <MapPreviewCard
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
