<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Migration MongoDB — Collection "favorites".
 * Index unique composite pour éviter les doublons.
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('mongodb')->create('favorites', function (Blueprint $collection) {
            // Index pour les requêtes par user_id
            $collection->index(['user_id' => 1]);

            // Index pour les requêtes par room_id (si besoin de stats)
            $collection->index(['room_id' => 1]);
        });

        // Créer l'index unique composite directement via la collection MongoDB
        $collection = \Illuminate\Support\Facades\DB::connection('mongodb')->getCollection('favorites');
        $collection->createIndex(
            ['user_id' => 1, 'room_id' => 1],
            ['unique' => true, 'name' => 'user_room_unique']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('favorites');
    }
};
