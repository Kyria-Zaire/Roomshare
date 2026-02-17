<?php

declare(strict_types=1);

namespace App\Support;

use App\Support\NewAccessToken;
use DateTimeInterface;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens as SanctumHasApiTokens;
use Laravel\Sanctum\Sanctum;

/**
 * HasMongoApiTokens — Trait qui étend HasApiTokens de Sanctum.
 *
 * Override createToken() pour utiliser notre NewAccessToken personnalisé.
 */
trait HasMongoApiTokens
{
    use SanctumHasApiTokens {
        SanctumHasApiTokens::tokens as sanctumTokens;
        SanctumHasApiTokens::tokenCan as sanctumTokenCan;
        SanctumHasApiTokens::tokenCant as sanctumTokenCant;
        SanctumHasApiTokens::generateTokenString as sanctumGenerateTokenString;
        SanctumHasApiTokens::currentAccessToken as sanctumCurrentAccessToken;
        SanctumHasApiTokens::withAccessToken as sanctumWithAccessToken;
    }

    /**
     * Create a new personal access token for the user.
     *
     * Override de la méthode Sanctum pour utiliser notre NewAccessToken personnalisé.
     *
     * @param  string  $name
     * @param  array  $abilities
     * @param  \DateTimeInterface|null  $expiresAt
     * @return \App\Support\NewAccessToken
     */
    public function createToken(string $name, array $abilities = ['*'], ?DateTimeInterface $expiresAt = null)
    {
        $plainTextToken = $this->sanctumGenerateTokenString();

        $token = $this->sanctumTokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken),
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
        ]);

        return new NewAccessToken($token, $token->getKey().'|'.$plainTextToken);
    }
}
