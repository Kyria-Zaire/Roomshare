<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — Autorisation PrivateChannel (Sanctum Bearer)
|--------------------------------------------------------------------------
|
| La closure reçoit l'utilisateur Sanctum résolu par auth:sanctum (middleware
| configuré dans bootstrap/app.php → withBroadcasting).
| Elle retourne true uniquement si l'utilisateur est réellement participant
| de la conversation demandée — zéro accès fantôme possible.
|
*/

Broadcast::channel('conversation.{conversationId}', function (User $user, string $conversationId): bool {
    // Validation stricte du format ObjectId (évite les requêtes MongoDB parasites)
    if (! preg_match('/^[0-9a-f]{24}$/i', $conversationId)) {
        return false;
    }

    $conversation = Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    // Seul un participant réel peut s'abonner au channel temps réel
    return $conversation->hasParticipant((string) $user->_id);
});
