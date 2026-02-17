<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Data\ScrapedRoomData;
use App\Models\Room;
use App\Scrapers\ReimsStudentScraper;
use App\Scrapers\ScraperInterface;
use App\Services\GeocodingService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Commande d'ingestion des annonces scrapées.
 *
 * Usage :
 *   php artisan rooms:ingest              # Lance tous les scrapers
 *   php artisan rooms:ingest reims-student # Lance un scraper spécifique
 */
class IngestRoomsCommand extends Command
{
    protected $signature = 'rooms:ingest {source? : Nom du scraper à exécuter (ex: reims-student)}';

    protected $description = 'Scrape et ingère des annonces de colocation dans la base de données';

    /**
     * Registre des scrapers disponibles.
     *
     * @var array<string, class-string<ScraperInterface>>
     */
    private array $scrapers = [
        'reims-student' => ReimsStudentScraper::class,
    ];

    public function handle(GeocodingService $geocoding): int
    {
        $source = $this->argument('source');
        $scraperList = $this->resolveScrapers($source);

        if ($scraperList === null) {
            $this->error("Source inconnue : \"{$source}\"");
            $this->line('Sources disponibles : ' . implode(', ', array_keys($this->scrapers)));

            return self::FAILURE;
        }

        $totalCreated = 0;
        $totalUpdated = 0;
        $totalSkipped = 0;

        foreach ($scraperList as $scraper) {
            $this->newLine();
            $this->info("▶ Scraper : {$scraper->sourceName()}");
            $this->line('  Récupération des annonces...');

            $results = $scraper->scrape();

            if ($results->isEmpty()) {
                $this->warn('  Aucune annonce trouvée.');
                continue;
            }

            $this->line("  {$results->count()} annonce(s) trouvée(s).");
            $bar = $this->output->createProgressBar($results->count());
            $bar->setFormat("  %current%/%max% [%bar%] %percent:3s%% — %message%");
            $bar->setMessage('Démarrage...');
            $bar->start();

            foreach ($results as $data) {
                /** @var ScrapedRoomData $data */
                $bar->setMessage($this->truncate($data->title, 40));

                // Géocodage de l'adresse
                $coords = $geocoding->geocode($data->address);

                if ($coords === null) {
                    $bar->setMessage('⚠ Géocodage échoué, ignoré');
                    $totalSkipped++;
                    $bar->advance();
                    continue;
                }

                // Extraction ville + code postal depuis l'adresse
                $addressParts = $this->parseAddress($data->address);

                // Déterminer les attributs de l'annonce
                $roomData = [
                    'title' => $data->title,
                    'description' => $data->description,
                    'budget' => $data->price,
                    'location' => [
                        'type' => 'Point',
                        'coordinates' => [$coords['lng'], $coords['lat']],
                    ],
                    'address' => $addressParts,
                    'images' => $data->images,
                    'source_type' => 'scraped',
                    'source_url' => $data->sourceUrl,
                    'amenities' => $this->guessAmenities($data->description),
                    'surface' => $this->extractSurface($data->description),
                    'rooms_count' => $this->extractRoomsCount($data->description),
                    'is_furnished' => $this->isFurnished($data->title . ' ' . $data->description),
                    'availability' => Carbon::now()->addDays(rand(1, 30))->toDateString(),
                    'status' => 'active',
                ];

                // updateOrCreate basé sur source_url pour éviter les doublons
                $existing = Room::where('source_url', $data->sourceUrl)->first();

                if ($existing) {
                    $existing->update($roomData);
                    $totalUpdated++;
                } else {
                    Room::create($roomData);
                    $totalCreated++;
                }

                $bar->advance();
            }

            $bar->setMessage('Terminé !');
            $bar->finish();
            $this->newLine();
        }

        // Résumé final
        $this->newLine();
        $this->info('═══ Résumé de l\'ingestion ═══');
        $this->line("  ✔ Créées   : {$totalCreated}");
        $this->line("  ↻ Mises à jour : {$totalUpdated}");
        $this->line("  ⚠ Ignorées : {$totalSkipped}");
        $this->newLine();

        return self::SUCCESS;
    }

    /**
     * Résout la liste des scrapers à exécuter.
     *
     * @return ScraperInterface[]|null
     */
    private function resolveScrapers(?string $source): ?array
    {
        if ($source === null) {
            return array_map(fn(string $class) => new $class(), $this->scrapers);
        }

        if (!isset($this->scrapers[$source])) {
            return null;
        }

        return [new $this->scrapers[$source]()];
    }

    /**
     * Parse une adresse française pour en extraire les composants.
     *
     * @return array{street: string, city: string, zip_code: string, country: string}
     */
    private function parseAddress(string $address): array
    {
        // Pattern : "Numéro Rue, Code Ville" ou "Numéro Rue, Ville"
        $parts = array_map('trim', explode(',', $address));

        $street = $parts[0] ?? '';
        $cityPart = $parts[1] ?? '';

        // Extraire code postal et ville
        $zipCode = '51100'; // Défaut Reims
        $city = 'Reims';

        if (preg_match('/(\d{5})\s+(.+)/', $cityPart, $matches)) {
            $zipCode = $matches[1];
            $city = trim($matches[2]);
        } elseif (!empty($cityPart)) {
            $city = $cityPart;
        }

        return [
            'street' => $street,
            'city' => $city,
            'zip_code' => $zipCode,
            'country' => 'France',
        ];
    }

    /**
     * Détecte les équipements mentionnés dans la description.
     *
     * @return string[]
     */
    private function guessAmenities(string $text): array
    {
        $text = mb_strtolower($text);
        $amenities = [];

        $mapping = [
            'wifi' => 'wifi',
            'fibre' => 'wifi',
            'internet' => 'wifi',
            'parking' => 'parking',
            'garage' => 'parking',
            'machine à laver' => 'machine-a-laver',
            'lave-linge' => 'machine-a-laver',
            'jardin' => 'jardin',
            'terrasse' => 'terrasse',
            'balcon' => 'balcon',
            'cave' => 'cave',
            'ascenseur' => 'ascenseur',
            'interphone' => 'interphone',
            'meublé' => 'meuble',
            'cuisine équipée' => 'cuisine-equipee',
            'vélo' => 'local-velo',
        ];

        foreach ($mapping as $keyword => $amenity) {
            if (str_contains($text, $keyword) && !in_array($amenity, $amenities)) {
                $amenities[] = $amenity;
            }
        }

        return $amenities;
    }

    /**
     * Extrait la surface depuis le texte (ex: "14m²" → 14).
     */
    private function extractSurface(string $text): ?int
    {
        if (preg_match('/(\d{1,3})\s*m[²2]/', $text, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    /**
     * Extrait le nombre de chambres depuis le texte.
     */
    private function extractRoomsCount(string $text): int
    {
        $lower = mb_strtolower($text);

        if (preg_match('/(\d+)\s*chambre/', $lower, $matches)) {
            return (int) $matches[1];
        }

        if (str_contains($lower, 'studio')) {
            return 1;
        }

        // T2 = 1 chambre, T3 = 2 chambres, etc.
        if (preg_match('/\bt(\d)\b/i', $text, $matches)) {
            return max(1, (int) $matches[1] - 1);
        }

        return 1;
    }

    /**
     * Détecte si le logement est meublé.
     */
    private function isFurnished(string $text): bool
    {
        $lower = mb_strtolower($text);

        return str_contains($lower, 'meublé')
            || str_contains($lower, 'meublee')
            || str_contains($lower, 'équipé');
    }

    /**
     * Tronque un texte à une longueur donnée.
     */
    private function truncate(string $text, int $length): string
    {
        if (mb_strlen($text) <= $length) {
            return $text;
        }

        return mb_substr($text, 0, $length - 1) . '…';
    }
}
