<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\User;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ConversationController — Gestion des conversations.
 *
 * Requiert authentification Sanctum.
 */
class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationRepositoryInterface $conversationRepo,
        private readonly MessageRepositoryInterface $messageRepo,
    ) {}

    /**
     * GET /api/v1/conversations
     *
     * Liste des conversations de l'utilisateur courant.
     * Enrichie avec le nom de l'autre participant (other_participant_name) pour l'affichage.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;

        $conversations = $this->conversationRepo->findByUser($userId);

        $otherIds = $conversations->map(fn ($c) => $c->otherParticipant($userId))->filter()->unique()->values();
        $users = User::whereIn('_id', $otherIds->toArray())->get()->keyBy(fn ($u) => (string) $u->_id);

        $data = $conversations->map(function ($conv) use ($userId, $users) {
            $otherId = $conv->otherParticipant($userId);
            $otherName = $otherId ? ($users->get((string) $otherId)?->name ?? null) : null;
            $arr = $conv->toArray();
            $arr['other_participant_name'] = $otherName ?? $otherId;
            return $arr;
        })->values()->all();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/v1/conversations
     *
     * Créer ou récupérer une conversation existante.
     * Optionnellement, créer un message initial automatique.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_id' => [
                'required',
                'string',
                // MongoDB n'a pas de règle `exists:` native — validation manuelle.
                // "system" est autorisé pour les annonces scrapées (propriétaire fictif).
                // Sinon, doit être un ObjectId 24 hex valide qui existe en base.
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === 'system') {
                        return;
                    }
                    if (! preg_match('/^[0-9a-f]{24}$/i', $value)) {
                        $fail('L\'identifiant du destinataire est invalide.');
                        return;
                    }
                    if (! User::where('_id', $value)->exists()) {
                        $fail('Le destinataire spécifié n\'existe pas.');
                    }
                },
            ],
            'room_id' => 'required|string',
            'room_title' => 'required|string|max:255',
            'initial_message' => 'nullable|string|max:2000',
        ]);

        $userId = (string) $request->user()->_id;
        $authUser = $request->user();

        // ─── Guard Early Access ─────────────────────────────────────────
        // Si la room a moins de 24h, seuls Pro / Pass Étudiant actif / propriétaire
        // peuvent initier un contact. Bloquer ici empêche le bypass via Postman direct.
        $room = Room::find($validated['room_id']);
        if ($room && $room->created_at && $room->created_at->gt(Carbon::now()->subHours(24))) {
            $isOwner    = (string) $authUser->_id === (string) $room->owner_id;
            $isPro      = (bool) ($authUser->is_pro ?? false);
            $hasPass    = $authUser->hasActivePass();

            if (! $isOwner && ! $isPro && ! $hasPass) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un Pass Étudiant est requis pour contacter le propriétaire d\'une annonce publiée depuis moins de 24h.',
                    'code'    => 'early_access_required',
                ], 403);
            }
        }
        // ───────────────────────────────────────────────────────────────

        // Vérifier si la conversation existe déjà (même participants + même room_id)
        $existingConversation = $this->conversationRepo->findByUser($userId)
            ->first(function ($conv) use ($validated, $userId) {
                $participants = $conv->participants ?? [];
                return in_array($validated['recipient_id'], $participants) &&
                       in_array($userId, $participants) &&
                       ($conv->room_id ?? '') === $validated['room_id'];
            });

        $isNewConversation = !$existingConversation;

        $conversation = $this->conversationRepo->findOrCreateBetween(
            $userId,
            $validated['recipient_id'],
            $validated['room_id'],
            $validated['room_title'],
        );

        // Si nouvelle conversation et message initial fourni, créer le message automatiquement
        if ($isNewConversation && !empty($validated['initial_message'])) {
            $message = $this->messageRepo->create([
                'conversation_id' => (string) $conversation->_id,
                'sender_id' => $userId,
                'body' => $validated['initial_message'],
            ]);

            try {
                broadcast(new MessageSent($message, (string) $conversation->_id));
            } catch (\Throwable $e) {
                \Log::warning('Broadcast initial message failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => $conversation,
        ]);
    }

    /**
     * GET /api/v1/conversations/{id}
     *
     * Détail d'une conversation + ses messages.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        // Validation du format MongoDB ObjectId
        if (!preg_match('/^[0-9a-f]{24}$/i', $id)) {
            return response()->json([
                'success' => false,
                'message' => 'ID de conversation invalide.',
            ], 400);
        }

        $userId = (string) $request->user()->_id;

        $conversation = $this->conversationRepo->findById($id);

        // Sécurité : vérifier que l'utilisateur participe
        if (! $conversation->hasParticipant($userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette conversation.',
            ], 403);
        }

        // Marquer les messages comme lus
        $this->messageRepo->markAsRead($id, $userId);

        $messages = $this->messageRepo->getByConversation($id);

        $otherId = $conversation->otherParticipant($userId);
        $otherName = $otherId ? (User::find($otherId)?->name ?? $otherId) : null;
        $conversationArr = $conversation->toArray();
        $conversationArr['other_participant_name'] = $otherName;

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversationArr,
                'messages' => $messages,
            ],
        ]);
    }

    /**
     * GET /api/v1/conversations/unread/count
     *
     * Nombre de messages non lus (pour la pastille de notification).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;

        $count = $this->conversationRepo->getUnreadCount($userId);

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ]);
    }
}
