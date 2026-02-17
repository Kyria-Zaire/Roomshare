<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

/**
 * Interface ConversationRepositoryInterface
 */
interface ConversationRepositoryInterface
{
    public function findByUser(string $userId): Collection;

    public function findById(string $id): mixed;

    public function findOrCreateBetween(string $userA, string $userB, string $roomId, string $roomTitle): mixed;

    public function getUnreadCount(string $userId): int;
}
