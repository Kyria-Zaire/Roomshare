<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Laravel\Sanctum\Contracts\HasAbilities;

/**
 * NewAccessToken — Version personnalisée pour MongoDB.
 *
 * Accepte HasAbilities au lieu de PersonalAccessToken spécifiquement.
 */
class NewAccessToken implements Arrayable, Jsonable
{
    /**
     * Create a new access token result.
     *
     * @param  HasAbilities  $accessToken  The access token instance.
     * @param  string  $plainTextToken  The plain text version of the token.
     */
    public function __construct(public HasAbilities $accessToken, public string $plainTextToken)
    {
    }

    /**
     * Get the instance as an array.
     *
     * @return array<string, mixed>
     */
    public function toArray()
    {
        return [
            'accessToken' => $this->accessToken,
            'plainTextToken' => $this->plainTextToken,
        ];
    }

    /**
     * Convert the object to its JSON representation.
     *
     * @param  int  $options
     * @return string
     */
    public function toJson($options = 0)
    {
        return json_encode($this->toArray(), $options);
    }
}
