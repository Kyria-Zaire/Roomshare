<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * UserController — Recherche et suggestions d'utilisateurs.
 * Comptes retirés (Test, Alice) : on n’affiche que les vrais utilisateurs (ex. Freeway.jr proprio, Jérôme locataire).
 */
class UserController extends Controller
{
    /** Noms exclus partout (suggestions, recherche). Freeway.jr + Jérôme uniquement côté affichage. */
    private const EXCLUDED_DEMO_NAMES = ['test', 'alice'];

    private function normalizeName(?string $name): string
    {
        if ($name === null || $name === '') {
            return '';
        }
        // @security: pattern constant, remplacement littéral, pas de modificateur /e — aucun risque RCE
        $s = preg_replace('/\s+/', ' ', trim($name));
        return strtolower($s);
    }

    private function isDemoName(?string $name): bool
    {
        $n = $this->normalizeName($name);
        if ($n === '') {
            return false;
        }
        return in_array($n, self::EXCLUDED_DEMO_NAMES, true);
    }

    /**
     * GET /api/v1/users/search?query=...
     * Recherche d'utilisateurs par nom (rôle opposé uniquement).
     */
    public function search(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $request->input('query', '');

        if (strlen(trim($query)) < 2) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        // Déterminer le rôle opposé
        $oppositeRole = $user->role === 'owner' ? 'tenant' : 'owner';

        $users = User::where('role', $oppositeRole)
            ->where('name', 'like', '%' . $query . '%')
            ->limit(15)
            ->get()
            ->filter(fn ($u) => ! $this->isDemoName($u->name))
            ->take(10)
            ->values()
            ->map(function ($u) {
                return [
                    'id' => (string) $u->_id,
                    'name' => $u->name,
                    'avatar_url' => $u->avatar_path ? Storage::disk('public')->url($u->avatar_path) : null,
                    'role' => $u->role,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * GET /api/v1/users/suggestions
     * Suggestions de profils pertinents (rôle opposé, localisation Reims).
     */
    public function suggestions(Request $request): JsonResponse
    {
        $user = $request->user();
        $oppositeRole = $user->role === 'owner' ? 'tenant' : 'owner';

        // Retourner 5 utilisateurs du rôle opposé ; exclure absolument Test et Alice
        $list = User::where('role', $oppositeRole)
            ->where('_id', '!=', $user->_id)
            ->limit(15)
            ->get();

        $suggestions = $list
            ->filter(fn ($u) => ! $this->isDemoName($u->name ?? ''))
            ->take(5)
            ->values()
            ->map(function ($u) {
                return [
                    'id' => (string) $u->_id,
                    'name' => $u->name,
                    'avatar_url' => $u->avatar_path ? Storage::disk('public')->url($u->avatar_path) : null,
                    'role' => $u->role,
                    'bio' => $u->bio ?? null,
                ];
            })
            ->values()
            ->all();

        // Dernier filtre de sécurité : ne jamais renvoyer Test ni Alice
        $suggestions = array_values(array_filter($suggestions, function ($item) {
            return ! $this->isDemoName($item['name'] ?? null);
        }));

        return response()->json([
            'success' => true,
            'data' => $suggestions,
        ]);
    }
}
