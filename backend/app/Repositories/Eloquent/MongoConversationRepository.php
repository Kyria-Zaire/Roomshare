<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Conversation;
use App\Models\Message;
use App\Repositories\Contracts\ConversationRepositoryInterface;
use Illuminate\Support\Collection;

class MongoConversationRepository implements ConversationRepositoryInterface
{
    public function __construct(
        private readonly Conversation $model,
    ) {}

    public function findByUser(string $userId): Collection
    {
        return $this->model
            ->where('participants', $userId)
            ->orderByDesc('last_message_at')
            ->get();
    }

    public function findById(string $id): mixed
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Trouve ou crée une conversation entre deux utilisateurs pour une annonce.
     * 
     * Logique stricte pour éviter les doublons :
     * - Vérifie que les deux participants sont présents (peu importe l'ordre)
     * - Vérifie que c'est la même room_id
     * - Utilise $all avec tri pour garantir l'unicité
     */
    public function findOrCreateBetween(string $userA, string $userB, string $roomId, string $roomTitle): mixed
    {
        // Normaliser l'ordre des participants pour éviter les doublons
        $participants = [$userA, $userB];
        sort($participants);

        // Chercher une conversation existante avec ces participants ET cette room
        // Utilise $all pour vérifier que les deux IDs sont présents
        $conversation = $this->model
            ->where('participants', 'all', $participants)
            ->where('room_id', $roomId)
            ->first();

        if ($conversation) {
            return $conversation;
        }

        // Vérification supplémentaire : chercher dans l'autre sens (si userB, userA)
        $reverseParticipants = [$userB, $userA];
        sort($reverseParticipants);
        
        $conversation = $this->model
            ->where('participants', 'all', $reverseParticipants)
            ->where('room_id', $roomId)
            ->first();

        if ($conversation) {
            return $conversation;
        }

        // Créer la conversation avec participants triés pour cohérence
        return $this->model->create([
            'participants' => $participants,
            'room_id' => $roomId,
            'room_title' => $roomTitle,
            'last_message' => null,
            'last_sender_id' => null,
            'last_message_at' => now(),
        ]);
    }

    /**
     * Nombre total de messages non lus pour un utilisateur.
     */
    public function getUnreadCount(string $userId): int
    {
        // Trouver toutes les conversations de l'utilisateur
        $ids = $this->model
            ->where('participants', $userId)
            ->pluck('_id');

        if ($ids->isEmpty()) {
            return 0;
        }

        // Normaliser en chaînes pour whereIn (MongoDB stocke parfois ObjectId ou string)
        $conversationIds = $ids->map(fn ($id) => (string) $id)->toArray();

        // Compter les messages non lus envoyés par d'autres
        return Message::whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->count();
    }
}
