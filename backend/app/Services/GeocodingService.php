<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service de géocodage via l'API Nominatim (OpenStreetMap).
 *
 * Convertit une adresse textuelle en coordonnées GPS [longitude, latitude].
 * Utilise le cache Laravel pour éviter les appels redondants et respecter
 * la politique d'utilisation de Nominatim (max 1 req/s).
 */
class GeocodingService
{
    private const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
    private const CACHE_PREFIX = 'geocode:';
    private const CACHE_TTL_DAYS = 30;
    private const REQUEST_DELAY_MS = 1100; // Nominatim: max 1 requête/seconde

    /**
     * Géocode une adresse et retourne les coordonnées.
     *
     * @param  string  $address  Adresse textuelle (ex: "9 Rue de Venise, 51100 Reims")
     * @return array{lng: float, lat: float}|null  Coordonnées ou null si introuvable
     */
    public function geocode(string $address): ?array
    {
        $cacheKey = self::CACHE_PREFIX . md5(mb_strtolower(trim($address)));

        return Cache::remember($cacheKey, now()->addDays(self::CACHE_TTL_DAYS), function () use ($address) {
            return $this->callNominatim($address);
        });
    }

    /**
     * Appel HTTP à Nominatim avec respect du rate-limit.
     */
    private function callNominatim(string $address): ?array
    {
        usleep(self::REQUEST_DELAY_MS * 1000);

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'RoomShare/1.0 (contact@roomshare.fr)',
            ])->timeout(10)->get(self::NOMINATIM_URL, [
                'q' => $address,
                'format' => 'jsonv2',
                'limit' => 1,
                'countrycodes' => 'fr',
            ]);

            if ($response->failed()) {
                Log::warning('Geocoding HTTP error', [
                    'address' => $address,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $results = $response->json();

            if (empty($results)) {
                Log::info('Geocoding: aucun résultat', ['address' => $address]);

                return null;
            }

            $lat = (float) $results[0]['lat'];
            $lng = (float) $results[0]['lon'];

            Log::debug('Geocoding OK', [
                'address' => $address,
                'lat' => $lat,
                'lng' => $lng,
            ]);

            return ['lng' => $lng, 'lat' => $lat];
        } catch (\Throwable $e) {
            Log::error('Geocoding exception', [
                'address' => $address,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
