<?php

declare(strict_types=1);

namespace App\Models;

use Laravel\Sanctum\Contracts\HasAbilities;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\MorphTo;

/**
 * PersonalAccessToken — Modèle Sanctum compatible MongoDB.
 *
 * Implémente HasAbilities pour Sanctum et utilise MongoDB\Laravel\Eloquent\Model.
 */
class PersonalAccessToken extends Model implements HasAbilities
{
    protected $connection = 'mongodb';

    protected $collection = 'personal_access_tokens';

    protected $primaryKey = '_id';

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'token',
        'abilities',
        'expires_at',
        'tokenable_type',
        'tokenable_id',
        'last_used_at',
    ];

    protected $hidden = [
        'token',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'array',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Get the tokenable model that the access token belongs to.
     */
    public function tokenable(): MorphTo
    {
        return $this->morphTo('tokenable');
    }

    /**
     * Find the token instance matching the given token.
     */
    public static function findToken($token)
    {
        if (strpos($token, '|') === false) {
            return static::where('token', hash('sha256', $token))->first();
        }

        [$id, $token] = explode('|', $token, 2);

        // Pour MongoDB, utiliser where('_id', $id) au lieu de find() pour gérer les ObjectId
        $instance = static::where('_id', $id)->first();
        
        if ($instance && hash_equals($instance->token, hash('sha256', $token))) {
            return $instance;
        }
        
        return null;
    }

    /**
     * Determine if the token has a given ability.
     */
    public function can($ability)
    {
        return in_array('*', $this->abilities ?? []) ||
               array_key_exists($ability, array_flip($this->abilities ?? []));
    }

    /**
     * Determine if the token is missing a given ability.
     */
    public function cant($ability)
    {
        return ! $this->can($ability);
    }

    /**
     * Determine if the token has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
