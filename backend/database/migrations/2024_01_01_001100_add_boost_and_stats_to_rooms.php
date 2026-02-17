<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Boost & stats sur les annonces.
 * is_boosted, boost_expires_at, stats (views, contact_clicks)
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        $collection = DB::connection('mongodb')->getCollection('rooms');
        $collection->updateMany(
            [],
            [
                '$set' => [
                    'is_boosted' => false,
                    'boost_expires_at' => null,
                    'stats' => [
                        'views' => 0,
                        'contact_clicks' => 0,
                    ],
                ],
            ]
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getCollection('rooms');
        $collection->updateMany(
            [],
            [
                '$unset' => [
                    'is_boosted' => '',
                    'boost_expires_at' => '',
                    'stats' => '',
                ],
            ]
        );
    }
};
