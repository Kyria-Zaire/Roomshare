<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Conversation;
use App\Models\Message;
use App\Repositories\Contracts\MessageRepositoryInterface;
use Illuminate\Support\Collection;

class MongoMessageRepository implements MessageRepositoryInterface
{
    public function __construct(
        private readonly Message $model,
    ) {}

    public function getByConversation(string $conversationId, int $limit = 50): Collection
    {
        return $this->model
            ->where('conversation_id', $conversationId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();
    }

    /**
     * Crée un message et met à jour la conversation (preview + timestamp).
     */
    public function create(array $data): mixed
    {
        $message = $this->model->create($data);

        // Mettre à jour la conversation avec le dernier message
        Conversation::where('_id', $data['conversation_id'])->update([
            'last_message' => mb_substr($data['body'], 0, 100),
            'last_sender_id' => $data['sender_id'],
            'last_message_at' => now(),
        ]);

        return $message;
    }

    /**
     * Marquer tous les messages d'une conversation comme lus pour un utilisateur.
     */
    public function markAsRead(string $conversationId, string $userId): int
    {
        return $this->model
            ->where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Supprime un message si l'utilisateur en est l'auteur.
     */
    public function deleteOwnMessage(string $messageId, string $userId): bool
    {
        $message = $this->model
            ->where('_id', $messageId)
            ->where('sender_id', $userId)
            ->first();

        if (! $message) {
            return false;
        }

        return (bool) $message->delete();
    }
}
