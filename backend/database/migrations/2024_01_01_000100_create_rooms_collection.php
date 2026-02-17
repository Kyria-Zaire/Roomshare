<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Migration MongoDB — Collection "rooms"
 *
 * Crée la collection avec des index optimisés pour :
 * - Recherche géospatiale (2dsphere sur location)
 * - Filtrage par budget
 * - Filtrage par source_type et status
 * - Tri chronologique
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        Schema::connection('mongodb')->create('rooms', function (Blueprint $collection) {
            // Index géospatial pour la recherche de proximité
            $collection->index(['location' => '2dsphere']);

            // Index composé pour les filtres courants
            $collection->index(['budget' => 1]);
            $collection->index(['source_type' => 1, 'status' => 1]);
            $collection->index(['address.city' => 1, 'budget' => 1]);
            $collection->index(['status' => 1, 'created_at' => -1]);
            // Index pour les annonces d'un utilisateur
            $collection->index(['owner_id' => 1, 'status' => 1]);
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('rooms');
    }
};
