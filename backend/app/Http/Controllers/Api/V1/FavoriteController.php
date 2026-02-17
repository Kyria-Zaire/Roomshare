<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * FavoriteController — Gestion des favoris (coups de cœur).
 *
 * Requiert authentification Sanctum.
 */
class FavoriteController extends Controller
{
    /**
     * GET /api/v1/favorites
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;

        $favorites = Favorite::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $favorites,
        ]);
    }

    /**
     * POST /api/v1/favorites
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => [
                'required',
                'string',
                'regex:/^[0-9a-f]{24}$/i', // Format MongoDB ObjectId
                function ($attribute, $value, $fail) {
                    // Vérifier que la room existe
                    if (!\App\Models\Room::where('_id', $value)->exists()) {
                        $fail("L'annonce spécifiée n'existe pas.");
                    }
                },
            ],
        ]);

        $userId = (string) $request->user()->_id;

        try {
            $favorite = Favorite::firstOrCreate([
                'user_id' => $userId,
                'room_id' => $validated['room_id'],
            ]);

            return response()->json([
                'success' => true,
                'data' => $favorite,
            ]);
        } catch (\MongoDB\Driver\Exception\BulkWriteException $e) {
            // Doublon détecté par l'index unique
            if ($e->getCode() === 11000) {
                $existing = Favorite::where('user_id', $userId)
                    ->where('room_id', $validated['room_id'])
                    ->first();

                return response()->json([
                    'success' => true,
                    'data' => $existing,
                    'message' => 'Favori déjà existant.',
                ]);
            }

            throw $e;
        }
    }

    /**
     * DELETE /api/v1/favorites/{roomId}
     */
    public function destroy(Request $request, string $roomId): JsonResponse
    {
        $userId = (string) $request->user()->_id;

        Favorite::where('user_id', $userId)
            ->where('room_id', $roomId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Favori supprimé.',
        ]);
    }
}
