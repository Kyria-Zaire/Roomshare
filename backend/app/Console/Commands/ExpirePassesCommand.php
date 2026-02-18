<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Révoque les Pass Étudiant dont la date d'expiration est dépassée.
 *
 * Usage :
 *   php artisan passes:expire
 */
class ExpirePassesCommand extends Command
{
    protected $signature = 'passes:expire';

    protected $description = 'Révoquer les Pass Étudiant expirés (pass_expires_at < maintenant)';

    public function handle(): int
    {
        $count = User::whereNotNull('pass_expires_at')
            ->where('pass_expires_at', '<', Carbon::now())
            ->update(['pass_expires_at' => null]);

        $this->info("passes:expire : {$count} pass révoqué(s).");

        return self::SUCCESS;
    }
}
