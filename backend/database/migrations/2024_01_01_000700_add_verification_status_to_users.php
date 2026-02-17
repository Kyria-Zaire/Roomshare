<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Ajouter verification_status aux users.
 *
 * verification_status: 'none' (par défaut), 'pending', 'verified', 'rejected'
 * identity_document_path: Chemin vers le document d'identité (stockage privé)
 * residence_document_path: Chemin vers le justificatif de domicile (stockage privé)
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        $collection = DB::connection('mongodb')->getCollection('users');
        
        // Ajouter verification_status par défaut 'none' aux users existants
        $collection->updateMany(
            ['verification_status' => ['$exists' => false]],
            [
                '$set' => [
                    'verification_status' => 'none',
                ]
            ]
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getCollection('users');
        $collection->updateMany(
            [],
            [
                '$unset' => [
                    'verification_status' => '',
                    'identity_document_path' => '',
                    'residence_document_path' => '',
                ]
            ]
        );
    }
};
