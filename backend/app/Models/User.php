<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\HasMongoApiTokens;
use Illuminate\Notifications\Notifiable;
use MongoDB\Laravel\Auth\User as MongoUser;

/**
 * Modèle User compatible MongoDB + Sanctum.
 *
 * Étend MongoDB\Laravel\Auth\User qui fournit Authenticatable
 * compatible avec le driver mongodb/laravel-mongodb.
 */
class User extends MongoUser
{
    use HasMongoApiTokens;
    use Notifiable;

    protected $connection = 'mongodb';

    protected $collection = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'password_reset_token',
        'password_reset_expires_at',
        'role',
        'bio',
        'phone',
        'avatar_path',
        'terms_accepted',
        'terms_accepted_at',
        'privacy_accepted',
        'privacy_accepted_at',
        'verification_status',
        'identity_document_path',
        'residence_document_path',
        'notify_messages',
        'notify_annonces',
        'is_pro',
        'pass_expires_at',
        'subscription',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'terms_accepted' => 'boolean',
            'terms_accepted_at' => 'datetime',
            'privacy_accepted' => 'boolean',
            'privacy_accepted_at' => 'datetime',
            'is_pro' => 'boolean',
            'pass_expires_at' => 'datetime',
        ];
    }

    /**
     * Constantes pour verification_status.
     */
    public const VERIFICATION_NONE = 'none';
    public const VERIFICATION_PENDING = 'pending';
    public const VERIFICATION_VERIFIED = 'verified';
    public const VERIFICATION_REJECTED = 'rejected';

    /**
     * Vérifier si l'utilisateur est propriétaire.
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Vérifier si l'utilisateur est locataire/étudiant.
     */
    public function isTenant(): bool
    {
        return $this->role === 'tenant';
    }

    /** Pass Étudiant actif (pass_expires_at dans le futur). */
    public function hasActivePass(): bool
    {
        if (! $this->pass_expires_at) {
            return false;
        }
        return $this->pass_expires_at->isFuture();
    }
}
