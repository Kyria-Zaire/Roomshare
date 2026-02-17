<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * UserSearchController — Recherche et suggestions pour l'onglet Messages.
 * Comptes retirés (Test, Alice) : on n’affiche que les vrais utilisateurs (ex. Freeway.jr, Jérôme).
 */
class UserSearchController extends Controller
{
    /** Noms exclus partout, en minuscules. */
    private const EXCLUDED_DEMO_NAMES = ['test', 'alice'];

    private function isDemoName(?string $name): bool
    {
        if ($name === null || $name === '') {
            return false;
        }
        $normalized = strtolower(trim($name));
        return in_array($normalized, self::EXCLUDED_DEMO_NAMES, true);
    }
    private function userToPublicArray(User $user, ?array $suggestedRoom = null): array
    {
        $avatarUrl = $user->avatar_path
            ? Storage::disk('public')->url($user->avatar_path)
            : null;

        $data = [
            'id' => (string) $user->_id,
            'name' => $user->name,
            'avatar_url' => $avatarUrl,
            'role' => $user->role,
        ];

        if ($suggestedRoom !== null) {
            $data['suggested_room'] = $suggestedRoom;
        }

        return $data;
    }

    /**
     * GET /api/v1/users/search?query=...
     * Recherche par nom. Retourne uniquement les utilisateurs du rôle opposé.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:1|max:100',
        ]);

        $me = $request->user();
        $query = trim($request->input('query'));
        $targetRole = $me->role === 'owner' ? 'tenant' : 'owner';

        $users = User::where('role', $targetRole)
            ->where('name', 'like', '%' . $query . '%')
            ->limit(15)
            ->get()
            ->filter(fn (User $u) => ! $this->isDemoName($u->name))
            ->take(10)
            ->values();

        $list = [];
        foreach ($users as $user) {
            $suggestedRoom = null;
            if ($targetRole === 'owner') {
                $room = Room::where('owner_id', (string) $user->_id)
                    ->where('status', 'active')
                    ->orderByDesc('created_at')
                    ->first();
                if ($room) {
                    $suggestedRoom = [
                        'id' => (string) $room->_id,
                        'title' => $room->title,
                    ];
                }
            }
            $list[] = $this->userToPublicArray($user, $suggestedRoom);
        }

        return response()->json([
            'success' => true,
            'data' => $list,
        ]);
    }

    /**
     * GET /api/v1/users/suggestions
     * Cinq profils pertinents : rôle opposé, pour les owners on privilégie Reims.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $me = $request->user();
        $targetRole = $me->role === 'owner' ? 'tenant' : 'owner';

        if ($targetRole === 'owner') {
            // Propriétaires ayant au moins une annonce (Reims en priorité)
            $ownerIds = Room::where('status', 'active')
                ->where('address.city', 'Reims')
                ->distinct()
                ->pluck('owner_id')
                ->filter()
                ->toArray();

            if (empty($ownerIds)) {
                $ownerIds = Room::where('status', 'active')
                    ->distinct()
                    ->pluck('owner_id')
                    ->filter()
                    ->toArray();
            }

            $ownerIds = array_slice(array_unique($ownerIds), 0, 10);
            $users = User::whereIn('_id', $ownerIds)
                ->get()
                ->filter(fn (User $u) => ! $this->isDemoName($u->name))
                ->take(5)
                ->values();

            $list = [];
            foreach ($users as $user) {
                $room = Room::where('owner_id', (string) $user->_id)
                    ->where('status', 'active')
                    ->orderByDesc('created_at')
                    ->first();
                $suggestedRoom = $room
                    ? ['id' => (string) $room->_id, 'title' => $room->title]
                    : null;
                $list[] = $this->userToPublicArray($user, $suggestedRoom);
            }
        } else {
            // Cinq locataires (pas de filtre géo, exclure comptes de démo)
            $users = User::where('role', 'tenant')
                ->where('_id', '!=', $me->_id)
                ->limit(10)
                ->get()
                ->filter(fn (User $u) => ! $this->isDemoName($u->name))
                ->take(5)
                ->values();
            $list = $users->map(fn (User $u) => $this->userToPublicArray($u, null))->toArray();
        }

        return response()->json([
            'success' => true,
            'data' => $list,
        ]);
    }
}
