<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * UploadController — Gestion de l'upload d'images.
 *
 * Stocke les images dans storage/app/public/rooms.
 * Retourne les URLs publiques pour les intégrer à l'annonce.
 */
class UploadController extends Controller
{
    /**
     * POST /api/v1/upload/images
     *
     * Accepte jusqu'à 5 images (max 5MB chacune).
     */
    public function images(Request $request): JsonResponse
    {
        $request->validate([
            'images' => 'required|array|max:5',
            'images.*' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $urls = [];

        foreach ($request->file('images') as $image) {
            $path = $image->store('rooms', 'public');
            $urls[] = url("storage/{$path}");
        }

        return response()->json([
            'success' => true,
            'data' => ['urls' => $urls],
            'message' => count($urls) . ' image(s) uploadée(s).',
        ], Response::HTTP_CREATED);
    }
}
