<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

/**
 * Interface MessageRepositoryInterface
 */
interface MessageRepositoryInterface
{
    public function getByConversation(string $conversationId, int $limit = 50): Collection;

    public function create(array $data): mixed;

    public function markAsRead(string $conversationId, string $userId): int;

    /**
     * Supprime un message si l'utilisateur en est l'auteur.
     *
     * @return bool true si supprimé, false si non trouvé ou non autorisé
     */
    public function deleteOwnMessage(string $messageId, string $userId): bool;
}
