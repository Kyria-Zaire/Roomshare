<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Pass Étudiant & Pro.
 * is_pro, pass_expires_at, subscription (status, stripe_subscription_id, current_period_end)
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
                    'is_pro' => false,
                    'pass_expires_at' => null,
                    'subscription' => [
                        'status' => 'none',
                        'stripe_subscription_id' => null,
                        'current_period_end' => null,
                    ],
                ],
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
                    'is_pro' => '',
                    'pass_expires_at' => '',
                    'subscription' => '',
                ],
            ]
        );
    }
};
