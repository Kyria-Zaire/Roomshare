<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * Migration MongoDB — Collections "conversations" et "messages".
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        Schema::connection('mongodb')->create('conversations', function (Blueprint $collection) {
            $collection->index(['participants' => 1]);
            $collection->index(['room_id' => 1]);
            $collection->index(['last_message_at' => -1]);
        });

        Schema::connection('mongodb')->create('messages', function (Blueprint $collection) {
            $collection->index(['conversation_id' => 1, 'created_at' => -1]);
            $collection->index(['sender_id' => 1]);
            $collection->index(['conversation_id' => 1, 'sender_id' => 1, 'read_at' => 1]);
        });
    }

    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('messages');
        Schema::connection('mongodb')->dropIfExists('conversations');
    }
};
