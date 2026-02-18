<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Schedules (Laravel 11+ / 12)
|--------------------------------------------------------------------------
|
| Déclaration du planificateur via la façade Schedule.
| Lancer le scheduler en production :  php artisan schedule:run (cron toutes les minutes)
|
*/

// Expire les annonces actives non mises à jour depuis 60 jours
Schedule::command('rooms:expire')->daily();

// Révoque les Pass Étudiant dont la date d'expiration est passée
Schedule::command('passes:expire')->daily();

// Ingestion automatique des annonces scrapées (3h du matin)
Schedule::command('rooms:ingest')->dailyAt('03:00');
