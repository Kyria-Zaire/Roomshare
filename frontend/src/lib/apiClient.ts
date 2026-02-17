import axios from "axios";
import type { Room, RoomFilters, MapBounds, ApiResponse } from "@/types/room";

/**
 * Client API Axios — consomme le backend Laravel.
 *
 * En développement : les appels sont proxifiés via next.config.ts rewrites.
 * En production : pointe directement vers l'API.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // 30s pour correspondre au timeout du route handler proxy
});

// ─── Intercepteur de requête (ajout Authorization Bearer token) ───────
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification depuis localStorage si disponible
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("roomshare_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Comptes à ne jamais renvoyer dans les suggestions (proprio = Freeway.jr, locataire = Jérôme)
const EXCLUDED_SUGGESTION_NAMES = ["test", "alice"];

function filterSuggestionsResponse(data: unknown): unknown {
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    const arr = (data as { data: { name?: string }[] }).data;
    (data as { data: unknown[] }).data = arr.filter((u) => {
      const n = String(u?.name ?? "").trim().toLowerCase();
      return !EXCLUDED_SUGGESTION_NAMES.includes(n);
    });
  }
  return data;
}

// ─── Intercepteur de réponse (gestion d'erreur centralisée) ──
apiClient.interceptors.response.use(
  (response) => {
    const url = response.config?.url ?? "";
    if (url.includes("users/suggestions") || url.includes("users/search")) {
      response.data = filterSuggestionsResponse(response.data);
    }
    return response;
  },
  (error) => {
    // Erreur réseau (timeout, serveur injoignable, etc.) — log discret pour ne pas polluer la console
    if (!error.response) {
      const url = error.config?.url ?? "";
      const isOptional = url.includes("/unread/count");
      if (isOptional) {
        // Endpoints optionnels (ex: compteur de messages) : pas de log
      } else {
        console.warn("[API] Réseau:", error.message || "Pas de réponse", url);
      }
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const responseData = error.response?.data;
    const message =
      responseData?.message || "Une erreur est survenue.";

    // Gérer les erreurs d'authentification (401) et d'autorisation (403)
    if (status === 401 || status === 403) {
      // Nettoyer la session locale seulement si un token existait
      if (typeof window !== "undefined") {
        const hadToken = !!localStorage.getItem("roomshare_token");
        
        if (hadToken) {
          // Token expiré ou invalide - nettoyer et rediriger
          localStorage.removeItem("roomshare_token");
          localStorage.removeItem("roomshare_user");
          delete apiClient.defaults.headers.common["Authorization"];

          // Rediriger vers /login seulement si on n'y est pas déjà et si on n'est pas sur une page publique
          const publicPaths = ["/login", "/", "/rooms", "/map"];
          const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path));
          
          if (!isPublicPath && !window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        // Si pas de token, c'est normal (utilisateur non connecté) - ne pas rediriger
      }
    }

    // Améliorer le logging pour les erreurs de validation (422)
    if (status === 422 && responseData?.errors) {
      const validationErrors = Object.entries(responseData.errors)
        .map(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgArray.join(", ")}`;
        })
        .join("; ");
      
      console.error(
        "[API Error] Validation Error:",
        validationErrors,
        `Status: ${status}`,
        "URL:",
        error.config?.url
      );
    } else {
      console.error(
        "[API Error]",
        message,
        `Status: ${status}`,
        "URL:",
        error.config?.url
      );
    }
    
    return Promise.reject(error);
  }
);

// ─── Services Room ──────────────────────────────────────────

export const roomService = {
  /**
   * Récupérer toutes les rooms avec filtres optionnels.
   */
  async getAll(filters?: RoomFilters): Promise<ApiResponse<Room[]>> {
    const params = new URLSearchParams();

    if (filters?.budget_min) params.set("budget_min", String(filters.budget_min));
    if (filters?.budget_max) params.set("budget_max", String(filters.budget_max));
    if (filters?.city) params.set("city", filters.city);
    if (filters?.source_type) params.set("source_type", filters.source_type);

    const { data } = await apiClient.get<ApiResponse<Room[]>>(
      `/rooms?${params.toString()}`
    );
    return data;
  },

  /**
   * Récupérer les markers pour la carte interactive.
   * Filtre par bounds (viewport visible de la carte).
   */
  async getMapRooms(bounds: MapBounds): Promise<ApiResponse<Room[]>> {
    const { data } = await apiClient.get<ApiResponse<Room[]>>("/rooms/map", {
      params: bounds,
    });
    return data;
  },

  /**
   * Récupérer une room par son ID.
   */
  async getById(id: string): Promise<ApiResponse<Room>> {
    const { data } = await apiClient.get<ApiResponse<Room>>(`/rooms/${id}`);
    return data;
  },

  /**
   * Créer une nouvelle room.
   */
  async create(roomData: Partial<Room>): Promise<ApiResponse<Room>> {
    const { data } = await apiClient.post<ApiResponse<Room>>("/rooms", roomData);
    return data;
  },

  /**
   * Mettre à jour une room.
   */
  async update(id: string, roomData: Partial<Room>): Promise<ApiResponse<Room>> {
    const { data } = await apiClient.put<ApiResponse<Room>>(
      `/rooms/${id}`,
      roomData
    );
    return data;
  },

  /**
   * Supprimer une room.
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/rooms/${id}`);
    return data;
  },

  /**
   * Récupérer les annonces de l'utilisateur connecté.
   */
  async getMyRooms(): Promise<ApiResponse<Room[]>> {
    const { data } = await apiClient.get<ApiResponse<Room[]>>("/rooms/my");
    return data;
  },
};

// ─── Services Favoris ──────────────────────────────────────────

export interface Favorite {
  _id: string;
  user_id: string;
  room_id: string;
  created_at?: string;
  updated_at?: string;
}

export const favoriteService = {
  /**
   * GET /api/v1/favorites — Récupérer tous les favoris de l'utilisateur.
   */
  async getAll(): Promise<ApiResponse<Favorite[]>> {
    const { data } = await apiClient.get<ApiResponse<Favorite[]>>("/favorites");
    return data;
  },

  /**
   * POST /api/v1/favorites — Ajouter un favori.
   */
  async add(roomId: string): Promise<ApiResponse<Favorite>> {
    const { data } = await apiClient.post<ApiResponse<Favorite>>("/favorites", {
      room_id: roomId,
    });
    return data;
  },

  /**
   * DELETE /api/v1/favorites/{roomId} — Supprimer un favori.
   */
  async remove(roomId: string): Promise<ApiResponse<null>> {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/favorites/${roomId}`);
    return data;
  },
};

export default apiClient;
