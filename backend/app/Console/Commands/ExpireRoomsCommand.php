<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Désactive les annonces actives non mises à jour depuis N jours.
 *
 * Usage :
 *   php artisan rooms:expire          # Seuil par défaut : 60 jours
 *   php artisan rooms:expire --days=30
 */
class ExpireRoomsCommand extends Command
{
    protected $signature = 'rooms:expire {--days=60 : Seuil d\'inactivité en jours}';

    protected $description = 'Désactive les annonces actives non mises à jour depuis N jours';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        $count = Room::where('status', 'active')
            ->where('updated_at', '<', $cutoff)
            ->update(['status' => 'inactive']);

        $this->info("rooms:expire : {$count} annonce(s) passée(s) à « inactive » (inactives depuis > {$days} j).");

        return self::SUCCESS;
    }
}
