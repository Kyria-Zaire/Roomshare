<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration MongoDB — Collection transactions.
 * Journal des paiements : pass, boost, abo pro.
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        $db = DB::connection('mongodb')->getMongoDB();
        $db->createCollection('transactions');
        $collection = $db->selectCollection('transactions');
        $collection->createIndex(['user_id' => 1]);
        $collection->createIndex(['status' => 1]);
        $collection->createIndex(['created_at' => -1]);
    }

    public function down(): void
    {
        DB::connection('mongodb')->getCollection('transactions')->drop();
    }
};
