<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * UserProfileController — Profil étendu, paramètres et export RGPD.
 */
class UserProfileController extends Controller
{
    /**
     * PUT /api/v1/user/profile
     * Mise à jour nom, bio, téléphone (et email avec alerte confirmation).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255',
            'bio' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ]);

        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $existing = User::where('email', $validated['email'])
                ->where('_id', '!=', $user->_id)
                ->first();
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet email est déjà utilisé.',
                ], 422);
            }
        }

        $user->update(array_filter($validated));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $user->_id,
                'name' => $user->name,
                'email' => $user->email,
                'bio' => $user->bio,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? $this->avatarUrl($user) : null,
            ],
            'message' => 'Profil mis à jour avec succès.',
        ]);
    }

    /**
     * GET /api/v1/user/settings
     * Préférences et statut de vérification.
     */
    public function settings(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'verification_status' => $user->verification_status ?? User::VERIFICATION_NONE,
                'notify_messages' => (bool) ($user->notify_messages ?? true),
                'notify_annonces' => (bool) ($user->notify_annonces ?? true),
                'name' => $user->name,
                'email' => $user->email,
                'bio' => $user->bio ?? '',
                'phone' => $user->phone ?? '',
                'avatar_url' => $user->avatar_path ? $this->avatarUrl($user) : null,
            ],
        ]);
    }

    /**
     * PATCH /api/v1/user/settings
     * Mise à jour des préférences (notifications).
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notify_messages' => 'sometimes|boolean',
            'notify_annonces' => 'sometimes|boolean',
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'notify_messages' => (bool) ($request->user()->notify_messages ?? true),
                'notify_annonces' => (bool) ($request->user()->notify_annonces ?? true),
            ],
            'message' => 'Préférences enregistrées.',
        ]);
    }

    /**
     * GET /api/v1/user/export
     * Export des données personnelles (RGPD).
     */
    public function export(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'id' => (string) $user->_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'bio' => $user->bio ?? null,
            'phone' => $user->phone ?? null,
            'verification_status' => $user->verification_status ?? 'none',
            'terms_accepted_at' => $user->terms_accepted_at?->toIso8601String(),
            'privacy_accepted_at' => $user->privacy_accepted_at?->toIso8601String(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Export de vos données personnelles.',
        ]);
    }

    /**
     * POST /api/v1/user/avatar
     * Upload avatar (stockage public pour affichage direct).
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        $user = $request->user();
        $userId = (string) $user->_id;

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store("avatars/{$userId}", 'public');
        $user->update(['avatar_path' => $path]);

        return response()->json([
            'success' => true,
            'data' => [
                'avatar_url' => $this->avatarUrl($user->fresh()),
            ],
            'message' => 'Photo de profil mise à jour.',
        ], Response::HTTP_CREATED);
    }

    private function avatarUrl(User $user): string
    {
        if (!$user->avatar_path) {
            return '';
        }
        return Storage::disk('public')->url($user->avatar_path);
    }
}
