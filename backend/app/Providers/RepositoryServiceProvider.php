<?php

declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Contracts\ConversationRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Eloquent\MongoConversationRepository;
use App\Repositories\Eloquent\MongoMessageRepository;
use App\Repositories\Eloquent\MongoRoomRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Class RepositoryServiceProvider
 *
 * Lie les interfaces de repository à leurs implémentations concrètes.
 * Pour changer de DB, il suffit de modifier les bindings ici.
 * (SOLID - Dependency Inversion Principle)
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        RoomRepositoryInterface::class => MongoRoomRepository::class,
        ConversationRepositoryInterface::class => MongoConversationRepository::class,
        MessageRepositoryInterface::class => MongoMessageRepository::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
