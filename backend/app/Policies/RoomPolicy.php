<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

/**
 * RoomPolicy — Autorisations pour les opérations sur les annonces.
 *
 * Seuls les utilisateurs avec role === 'owner' peuvent créer des annonces.
 */
class RoomPolicy
{
    /**
     * Déterminer si l'utilisateur peut créer une annonce.
     */
    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    /**
     * Déterminer si l'utilisateur peut mettre à jour une annonce.
     */
    public function update(User $user, Room $room): bool
    {
        return $user->isOwner() && (string) $user->_id === $room->owner_id;
    }

    /**
     * Déterminer si l'utilisateur peut supprimer une annonce.
     */
    public function delete(User $user, Room $room): bool
    {
        return $user->isOwner() && (string) $user->_id === $room->owner_id;
    }
}
