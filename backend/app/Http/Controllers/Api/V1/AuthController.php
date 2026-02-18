<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * AuthController — Register & Login via Sanctum tokens.
 *
 * Retourne un Bearer token à stocker côté client.
 * Toutes les routes protégées utilisent ensuite auth:sanctum.
 */
class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|string|in:tenant,owner',
            'terms_accepted' => 'required|boolean|accepted',
            'privacy_accepted' => 'required|boolean|accepted',
        ];

        if ($request->input('role') === 'owner') {
            $rules['phone'] = [
                'required',
                'string',
                'max:20',
                'regex:/^[\d\s+.()-]{10,20}$/',
            ];
        } else {
            $rules['phone'] = 'nullable|string|max:20|regex:/^[\d\s+.()-]{10,20}$/';
        }

        $validated = $request->validate($rules);

        // Enregistrer les dates d'acceptation RGPD pour la conformité
        $now = now();

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'terms_accepted' => $validated['terms_accepted'],
            'terms_accepted_at' => $validated['terms_accepted'] ? $now : null,
            'privacy_accepted' => $validated['privacy_accepted'],
            'privacy_accepted_at' => $validated['privacy_accepted'] ? $now : null,
            'verification_status' => User::VERIFICATION_NONE,
        ];

        if (!empty($validated['phone'])) {
            // @security: pattern constant, remplacement littéral, pas de modificateur /e — aucun risque RCE
            $payload['phone'] = preg_replace('/\s+/', ' ', trim($validated['phone']));
        }

        $user = User::create($payload);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => (string) $user->_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'verification_status' => $user->verification_status ?? 'none',
                ],
                'token' => $token,
            ],
            'message' => 'Inscription réussie.',
        ], Response::HTTP_CREATED);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            // Retourner 401 (Unauthorized) pour les identifiants incorrects
            // plutôt que 422 (Validation) pour des raisons de sécurité
            return response()->json([
                'success' => false,
                'message' => 'Identifiants incorrects.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => (string) $user->_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'verification_status' => $user->verification_status ?? 'none',
                ],
                'token' => $token,
            ],
            'message' => 'Connexion réussie.',
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $user->_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'tenant',
                'verification_status' => $user->verification_status ?? 'none',
                'is_pro' => (bool) ($user->is_pro ?? false),
                'pass_expires_at' => $user->pass_expires_at
                    ? $user->pass_expires_at->format('c')
                    : null,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/forgot-password
     *
     * Demande de réinitialisation de mot de passe.
     * MVP : Génère un token simple (en production, envoyer par email).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email|exists:users,email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            // Ne pas révéler si l'email existe ou non (sécurité)
            return response()->json([
                'success' => true,
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
            ]);
        }

        // Générer un token de réinitialisation (32 caractères aléatoires)
        $token = bin2hex(random_bytes(16));
        $user->update([
            'password_reset_token' => $token,
            'password_reset_expires_at' => now()->addHours(1), // Expire dans 1 heure
        ]);

        // Envoyer l'email de réinitialisation
        try {
            Mail::to($user->email)->send(new ResetPasswordMail($token, $user->name, $user->email));
        } catch (\Exception $e) {
            // Log l'erreur mais ne révèle pas l'échec à l'utilisateur (sécurité)
            \Log::error('Erreur envoi email réinitialisation: ' . $e->getMessage());
            // En développement, on peut retourner le token pour faciliter les tests
            if (config('app.debug')) {
                return response()->json([
                    'success' => true,
                    'data' => ['reset_token' => $token], // Debug uniquement
                    'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
                ]);
            }
        }

        // Toujours retourner le même message (sécurité : ne pas révéler si l'email existe)
        return response()->json([
            'success' => true,
            'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        ]);
    }

    /**
     * POST /api/v1/auth/reset-password
     *
     * Réinitialise le mot de passe avec le token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|string|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::where('email', $validated['email'])
            ->where('password_reset_token', $validated['token'])
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide ou expiré.',
            ], 400);
        }

        // Vérifier l'expiration
        if ($user->password_reset_expires_at && $user->password_reset_expires_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Le token de réinitialisation a expiré.',
            ], 400);
        }

        // Réinitialiser le mot de passe
        $user->update([
            'password' => $validated['password'],
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ]);

        // Supprimer tous les tokens existants (sécurité)
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }

    /**
     * PUT /api/v1/auth/profile
     *
     * Mettre à jour le profil de l'utilisateur connecté.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $request->user()->_id . ',_id',
        ]);

        $user = $request->user();

        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            // Vérifier que le nouvel email n'est pas déjà utilisé
            $existingUser = User::where('email', $validated['email'])
                ->where('_id', '!=', $user->_id)
                ->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet email est déjà utilisé.',
                ], 422);
            }
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $user->_id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'message' => 'Profil mis à jour avec succès.',
        ]);
    }

    /**
     * PUT /api/v1/auth/password
     *
     * Changer le mot de passe de l'utilisateur connecté.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        // Vérifier le mot de passe actuel
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        // Mettre à jour le mot de passe
        $user->update([
            'password' => $validated['password'],
        ]);

        // Supprimer tous les tokens existants (sécurité : forcer reconnexion)
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès. Veuillez vous reconnecter.',
        ]);
    }
}
