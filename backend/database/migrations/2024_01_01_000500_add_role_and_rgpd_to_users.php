<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Ajouter role et champs RGPD aux users.
 *
 * role: 'tenant' (par défaut) ou 'owner'
 * terms_accepted: boolean (CGU)
 * privacy_accepted: boolean (Politique de confidentialité)
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        $collection = DB::connection('mongodb')->getCollection('users');
        
        // Ajouter les champs par défaut aux users existants
        $collection->updateMany(
            ['role' => ['$exists' => false]],
            [
                '$set' => [
                    'role' => 'tenant',
                    'terms_accepted' => false,
                    'privacy_accepted' => false,
                ]
            ]
        );
    }

    public function down(): void
    {
        // Optionnel : supprimer les champs si nécessaire
        // $collection = DB::connection('mongodb')->getCollection('users');
        // $collection->updateMany([], [
        //     '$unset' => [
        //         'role' => '',
        //         'terms_accepted' => '',
        //         'privacy_accepted' => '',
        //     ]
        // ]);
    }
};
