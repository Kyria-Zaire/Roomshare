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
 * UserVerificationController — Gestion de la vérification d'identité.
 *
 * Permet aux locataires de soumettre leurs documents pour devenir propriétaire.
 * Les fichiers sont stockés de manière sécurisée dans storage/app/private.
 */
class UserVerificationController extends Controller
{
    /**
     * POST /api/v1/user/verify-request
     *
     * Reçoit les fichiers de vérification et passe le statut à 'pending'.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Vérifier que l'utilisateur n'est pas déjà owner
        if ($user->role === 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Vous êtes déjà propriétaire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier que l'utilisateur n'a pas déjà une demande en cours
        if ($user->verification_status === 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà une demande de vérification en cours.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation des fichiers
        $validated = $request->validate([
            'identity_document' => 'required|file|mimes:jpeg,jpg,png,pdf|max:10240', // 10MB max
            'residence_document' => 'required|file|mimes:jpeg,jpg,png,pdf|max:10240', // 10MB max
        ]);

        try {
            // Stocker les fichiers dans storage/app/private/verifications/{user_id}/
            $userId = (string) $user->_id;
            $storagePath = "verifications/{$userId}";

            $identityPath = $request->file('identity_document')->store(
                "{$storagePath}/identity",
                'private'
            );
            $residencePath = $request->file('residence_document')->store(
                "{$storagePath}/residence",
                'private'
            );

            // Mettre à jour l'utilisateur
            $user->update([
                'verification_status' => User::VERIFICATION_PENDING,
                'identity_document_path' => $identityPath,
                'residence_document_path' => $residencePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Votre demande de vérification a été envoyée avec succès.',
                'data' => [
                    'verification_status' => $user->verification_status,
                ],
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            \Log::error('Erreur upload vérification: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'envoi de vos documents.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/v1/user/verification-status
     *
     * Récupère le statut de vérification de l'utilisateur connecté.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'verification_status' => $user->verification_status ?? User::VERIFICATION_NONE,
                'role' => $user->role,
            ],
        ]);
    }
}
