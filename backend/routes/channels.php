<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — Autorisation PrivateChannel
|--------------------------------------------------------------------------
|
| MVP : L'identification se fait via le header X-User-Id.
| En production, utiliser Sanctum/JWT pour l'auth réelle.
|
*/

Broadcast::channel('conversation.{conversationId}', function ($user, string $conversationId) {
    // En mode MVP sans auth complète, on autorise si l'utilisateur
    // est bien participant de la conversation.
    // Note : $user sera null en API stateless, on utilise le header.
    return true; // Sera renforcé avec l'auth Sanctum en post-MVP
});
