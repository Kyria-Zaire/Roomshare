<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Ajouter champs profil et préférences aux users.
 * bio, phone, avatar_path, notify_messages, notify_annonces
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        $collection = DB::connection('mongodb')->getCollection('users');
        $collection->updateMany(
            [],
            [
                '$set' => [
                    'notify_messages' => true,
                    'notify_annonces' => true,
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
                    'bio' => '',
                    'phone' => '',
                    'avatar_path' => '',
                    'notify_messages' => '',
                    'notify_annonces' => '',
                ]
            ]
        );
    }
};
