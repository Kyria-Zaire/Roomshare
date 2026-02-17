<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * MessageController — Envoi de messages + broadcast temps réel.
 */
class MessageController extends Controller
{
    public function __construct(
        private readonly MessageRepositoryInterface $messageRepo,
        private readonly ConversationRepositoryInterface $conversationRepo,
    ) {}

    /**
     * POST /api/v1/messages
     *
     * Envoie un message et déclenche le broadcast WebSocket.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => [
                'required',
                'string',
                'regex:/^[0-9a-f]{24}$/i', // Format MongoDB ObjectId
            ],
            'body' => 'required|string|max:2000',
        ]);

        $userId = (string) $request->user()->_id;

        // Vérifier que l'utilisateur participe à la conversation
        $conversation = $this->conversationRepo->findById($validated['conversation_id']);

        if (! $conversation->hasParticipant($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        // Créer le message
        $message = $this->messageRepo->create([
            'conversation_id' => $validated['conversation_id'],
            'sender_id' => $userId,
            'body' => $validated['body'],
        ]);

        try {
            broadcast(new MessageSent($message, $validated['conversation_id']));
        } catch (\Throwable $e) {
            \Log::warning('Broadcast MessageSent failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $message,
            'message' => 'Message envoyé.',
        ], Response::HTTP_CREATED);
    }
}
