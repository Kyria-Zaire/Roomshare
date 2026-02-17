<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Models\Room;
use App\Policies\RoomPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Room::class => RoomPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Configurer Sanctum pour utiliser notre modèle PersonalAccessToken MongoDB
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
        
        // Enregistrer les policies
        $this->registerPolicies();
    }
}
