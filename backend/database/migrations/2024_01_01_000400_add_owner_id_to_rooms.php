<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Ajouter owner_id aux rooms existantes.
 *
 * Pour les rooms existantes sans owner_id, on assigne "system" comme valeur par défaut.
 * En production : migrer les données existantes vers de vrais owner_id.
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        // Ajouter owner_id "system" aux rooms existantes qui n'en ont pas
        $collection = DB::connection('mongodb')->getCollection('rooms');
        $collection->updateMany(
            ['owner_id' => ['$exists' => false]],
            ['$set' => ['owner_id' => 'system']]
        );
    }

    public function down(): void
    {
        // Supprimer owner_id (optionnel, selon les besoins)
        // DB::connection('mongodb')
        //     ->collection('rooms')
        //     ->updateMany([], ['$unset' => ['owner_id' => '']]);
    }
};
