<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Mail\VerificationStatusMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Admin\VerificationController — Gestion admin des demandes de vérification d'identité.
 *
 * Routes protégées par auth:sanctum + EnsureAdmin.
 * GET    /api/v1/admin/verifications            — Liste des demandes en attente
 * POST   /api/v1/admin/verifications/{id}/approve — Approuver (verified + rôle owner)
 * POST   /api/v1/admin/verifications/{id}/reject  — Rejeter (rejected + motif)
 */
class VerificationController extends Controller
{
    /**
     * GET /api/v1/admin/verifications
     *
     * Retourne tous les utilisateurs avec verification_status = 'pending'.
     */
    public function index(): JsonResponse
    {
        $pending = User::where('verification_status', User::VERIFICATION_PENDING)
            ->orderBy('updated_at', 'asc')
            ->get()
            ->map(fn (User $u) => [
                'id'                       => (string) $u->_id,
                'name'                     => $u->name,
                'email'                    => $u->email,
                'role'                     => $u->role,
                'verification_status'      => $u->verification_status,
                'identity_document_path'   => $u->identity_document_path,
                'residence_document_path'  => $u->residence_document_path,
                'submitted_at'             => $u->updated_at?->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $pending,
        ]);
    }

    /**
     * POST /api/v1/admin/verifications/{id}/approve
     *
     * Approuve la vérification : status → verified, role → owner.
     */
    public function approve(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->verification_status !== User::VERIFICATION_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande n\'est pas en attente.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->update(['verification_status' => User::VERIFICATION_VERIFIED]);
        // role hors fillable → méthode dédiée obligatoire
        $user->setRole('owner');

        try {
            Mail::to($user->email)->send(new VerificationStatusMail($user->name, 'verified'));
        } catch (\Throwable $e) {
            Log::warning('VerificationStatusMail (approved) failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande approuvée. L\'utilisateur est désormais propriétaire.',
        ]);
    }

    /**
     * POST /api/v1/admin/verifications/{id}/reject
     *
     * Rejette la vérification avec un motif obligatoire.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($id);

        if ($user->verification_status !== User::VERIFICATION_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande n\'est pas en attente.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->update([
            'verification_status'        => User::VERIFICATION_REJECTED,
            'verification_reject_reason' => $validated['reason'],
        ]);

        try {
            Mail::to($user->email)->send(new VerificationStatusMail($user->name, 'rejected', $validated['reason']));
        } catch (\Throwable $e) {
            Log::warning('VerificationStatusMail (rejected) failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande rejetée.',
        ]);
    }
}
