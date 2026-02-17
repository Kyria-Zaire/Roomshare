<?php

declare(strict_types=1);

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

/**
 * Class Message
 *
 * Modèle MongoDB pour les messages du chat temps réel.
 *
 * @property string        $_id
 * @property string        $conversation_id
 * @property string        $sender_id
 * @property string        $body
 * @property \Carbon\Carbon|null $read_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Message extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'messages';

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Conversation parente.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    /**
     * Vérifie si le message a été lu.
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
