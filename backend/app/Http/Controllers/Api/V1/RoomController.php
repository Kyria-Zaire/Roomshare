<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Repositories\Contracts\RoomRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Class RoomController
 *
 * Contrôleur API v1 pour les annonces de colocation.
 * Injection du Repository via l'interface (SOLID - DIP).
 */
class RoomController extends Controller
{
    public function __construct(
        private readonly RoomRepositoryInterface $roomRepository,
    ) {}

    /**
     * GET /api/v1/rooms
     *
     * Liste toutes les rooms avec filtres optionnels.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'budget_min',
            'budget_max',
            'source_type',
            'city',
        ]);

        $rooms = $this->roomRepository->all($filters);

        return response()->json([
            'success' => true,
            'data' => $rooms,
            'meta' => [
                'total' => $rooms->count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/rooms/my
     *
     * Liste les annonces de l'utilisateur connecté.
     * Requiert authentification Sanctum.
     */
    public function my(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;
        $rooms = $this->roomRepository->findByOwner($userId);

        return response()->json([
            'success' => true,
            'data' => $rooms,
            'meta' => [
                'total' => $rooms->count(),
            ],
        ]);
    }

    /**
     * GET /api/v1/rooms/{id}
     *
     * Détail d'une room. Si Early Access (annonce < 24h) et utilisateur sans Pass,
     * les coordonnées du propriétaire sont masquées (middleware CheckEarlyAccess).
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $room = $this->roomRepository->findById($id);
        $isRestricted = $request->attributes->get('is_restricted', false);

        $data = $room instanceof \Illuminate\Database\Eloquent\Model
            ? $room->toArray()
            : (array) $room;

        if ($isRestricted) {
            $data['owner_id'] = null;
            $data['address'] = array_merge($data['address'] ?? [], [
                'street' => 'Quartier masqué',
                'zip_code' => (string) ($data['address']['zip_code'] ?? ''),
                'city' => $data['address']['city'] ?? 'Reims',
                'country' => $data['address']['country'] ?? 'France',
            ]);
            $data['is_early_access_locked'] = true;
        } else {
            $data['is_early_access_locked'] = false;
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/v1/rooms
     *
     * Création d'une nouvelle annonce.
     * Seuls les utilisateurs avec role === 'owner' peuvent créer des annonces.
     */
    public function store(Request $request): JsonResponse
    {
        // Vérifier l'autorisation via la Policy
        $this->authorize('create', Room::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'budget' => 'required|integer|min:0',
            'location' => 'required|array',
            'location.type' => 'required|string|in:Point',
            'location.coordinates' => 'required|array|size:2',
            'location.coordinates.0' => 'required|numeric|between:-180,180', // longitude
            'location.coordinates.1' => 'required|numeric|between:-90,90',   // latitude
            'address' => 'required|array',
            'address.city' => 'required|string',
            'address.zip_code' => 'required|string',
            'images' => 'nullable|array',
            'images.*' => 'url',
            'source_type' => 'nullable|string|in:manual,scraped',
            'source_url' => 'nullable|url',
            'amenities' => 'nullable|array',
            'surface' => 'nullable|integer|min:1',
            'rooms_count' => 'nullable|integer|min:1',
            'is_furnished' => 'nullable|boolean',
            'availability' => 'nullable|date',
            'roommate_prefs' => 'nullable|array',
        ]);

        // Assigner owner_id depuis l'utilisateur authentifié
        $validated['owner_id'] = (string) $request->user()->_id;
        $validated['source_type'] = $validated['source_type'] ?? 'manual';
        $validated['status'] = 'active';

        $room = $this->roomRepository->create($validated);

        return response()->json([
            'success' => true,
            'data' => $room,
            'message' => 'Annonce créée avec succès.',
        ], Response::HTTP_CREATED);
    }

    /**
     * PUT /api/v1/rooms/{id}
     *
     * Mise à jour d'une annonce existante.
     * Seul le propriétaire peut modifier son annonce.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $room = $this->roomRepository->findById($id);

        // La Policy RoomPolicy::update() vérifie role === 'owner' ET owner_id === user._id
        // Remplace le check manuel qui ignorait la vérification du rôle (faille #4)
        $this->authorize('update', $room);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'budget' => 'sometimes|integer|min:0',
            'location' => 'sometimes|array',
            'address' => 'sometimes|array',
            'images' => 'nullable|array',
            'source_type' => 'nullable|string|in:manual,scraped',
            'amenities' => 'nullable|array',
            'surface' => 'nullable|integer|min:1',
            'rooms_count' => 'nullable|integer|min:1',
            'is_furnished' => 'nullable|boolean',
            'availability' => 'nullable|date',
            'roommate_prefs' => 'nullable|array',
            'status' => 'nullable|string|in:active,inactive,rented',
        ]);

        $room = $this->roomRepository->update($id, $validated);

        return response()->json([
            'success' => true,
            'data' => $room,
            'message' => 'Annonce mise à jour avec succès.',
        ]);
    }

    /**
     * DELETE /api/v1/rooms/{id}
     *
     * Suppression d'une annonce.
     * Seul le propriétaire peut supprimer son annonce.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $room = $this->roomRepository->findById($id);

        // La Policy RoomPolicy::delete() vérifie role === 'owner' ET owner_id === user._id
        $this->authorize('delete', $room);

        $this->roomRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Annonce supprimée avec succès.',
        ]);
    }

    /**
     * GET /api/v1/rooms/map?sw_lng=...&sw_lat=...&ne_lng=...&ne_lat=...
     *
     * Retourne les markers pour la carte interactive.
     * Filtre par bounds (viewport visible) via l'index 2dsphere MongoDB.
     */
    public function map(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sw_lng' => 'required|numeric|between:-180,180',
            'sw_lat' => 'required|numeric|between:-90,90',
            'ne_lng' => 'required|numeric|between:-180,180',
            'ne_lat' => 'required|numeric|between:-90,90',
        ]);

        $rooms = $this->roomRepository->findByBounds(
            (float) $validated['sw_lng'],
            (float) $validated['sw_lat'],
            (float) $validated['ne_lng'],
            (float) $validated['ne_lat'],
        );

        return response()->json([
            'success' => true,
            'data' => $rooms,
            'meta' => [
                'total' => $rooms->count(),
                'bounds' => $validated,
            ],
        ]);
    }
}
