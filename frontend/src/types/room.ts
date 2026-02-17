/**
 * Types pour l'entité Room — miroir du schéma MongoDB backend.
 */

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  street?: string;
  city: string;
  zip_code: string;
  country?: string;
}

export interface RoommatePrefs {
  age_range?: [number, number];
  gender?: "male" | "female" | "any";
  lifestyle?: string[];
}

export interface Room {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  budget: number;
  location: GeoLocation;
  address: Address;
  images: string[];
  source_type: "manual" | "scraped";
  source_url?: string;
  amenities: string[];
  surface?: number;
  rooms_count: number;
  is_furnished: boolean;
  availability?: string;
  roommate_prefs?: RoommatePrefs;
  status: "active" | "inactive" | "rented";
  owner_id?: string; // ID de l'utilisateur propriétaire (null si is_early_access_locked)
  created_at: string;
  updated_at: string;
  /** True si l'annonce a moins de 24h et que l'utilisateur n'a pas de Pass actif */
  is_early_access_locked?: boolean;
}

export interface RoomFilters {
  budget_min?: number;
  budget_max?: number;
  city?: string;
  source_type?: "manual" | "scraped";
}

export interface MapBounds {
  sw_lng: number;
  sw_lat: number;
  ne_lng: number;
  ne_lat: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    bounds?: MapBounds;
  };
  message?: string;
}
