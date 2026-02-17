<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Ajouter les dates d'acceptation RGPD.
 *
 * Pour la conformité RGPD, on doit enregistrer QUAND l'utilisateur a accepté
 * les CGU et la Politique de Confidentialité.
 * terms_accepted_at: Date d'acceptation des CGU
 * privacy_accepted_at: Date d'acceptation de la Politique de Confidentialité
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        $collection = DB::connection('mongodb')->getCollection('users');
        
        // Pour les utilisateurs existants qui ont déjà accepté, utiliser created_at comme date d'acceptation
        // On doit utiliser une boucle car MongoDB ne supporte pas directement $created_at dans $set
        $users = $collection->find([
            'terms_accepted' => true,
            'terms_accepted_at' => ['$exists' => false],
        ]);
        
        foreach ($users as $user) {
            $collection->updateOne(
                ['_id' => $user['_id']],
                [
                    '$set' => [
                        'terms_accepted_at' => $user['created_at'] ?? now(),
                    ]
                ]
            );
        }
        
        $users = $collection->find([
            'privacy_accepted' => true,
            'privacy_accepted_at' => ['$exists' => false],
        ]);
        
        foreach ($users as $user) {
            $collection->updateOne(
                ['_id' => $user['_id']],
                [
                    '$set' => [
                        'privacy_accepted_at' => $user['created_at'] ?? now(),
                    ]
                ]
            );
        }
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getCollection('users');
        $collection->updateMany(
            [],
            [
                '$unset' => [
                    'terms_accepted_at' => '',
                    'privacy_accepted_at' => '',
                ]
            ]
        );
    }
};
