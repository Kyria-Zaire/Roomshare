<?php

declare(strict_types=1);

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/**
 * Class Favorite — Coup de cœur (annonce favorite).
 *
 * @property string $_id
 * @property string $user_id
 * @property string $room_id
 */
class Favorite extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'favorites';

    protected $fillable = [
        'user_id',
        'room_id',
    ];
}
