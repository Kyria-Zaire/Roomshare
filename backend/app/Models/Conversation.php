<?php

declare(strict_types=1);

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\HasMany;

/**
 * Class Conversation
 *
 * Modèle MongoDB pour les conversations de chat.
 * Chaque conversation lie 2 participants autour d'une annonce (Room).
 *
 * @property string   $_id
 * @property array    $participants     IDs des 2 utilisateurs
 * @property string   $room_id          Annonce concernée
 * @property string   $room_title       Titre de l'annonce (dénormalisé pour perf)
 * @property string   $last_message     Preview du dernier message
 * @property string   $last_sender_id   ID de l'expéditeur du dernier message
 * @property \Carbon\Carbon $last_message_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Conversation extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'conversations';

    protected $fillable = [
        'participants',
        'room_id',
        'room_title',
        'last_message',
        'last_sender_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'participants' => 'array',
            'last_message_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Messages de cette conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'conversation_id');
    }

    /**
     * Vérifie si un utilisateur participe à cette conversation.
     */
    public function hasParticipant(string $userId): bool
    {
        return in_array($userId, $this->participants ?? [], true);
    }

    /**
     * Retourne l'ID de l'autre participant.
     */
    public function otherParticipant(string $userId): ?string
    {
        $others = array_filter(
            $this->participants ?? [],
            fn(string $id) => $id !== $userId
        );

        return array_values($others)[0] ?? null;
    }
}
