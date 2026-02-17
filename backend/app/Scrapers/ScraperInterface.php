<?php

declare(strict_types=1);

namespace App\Scrapers;

use Illuminate\Support\Collection;

/**
 * Interface ScraperInterface
 *
 * Contrat pour tous les scrapers d'annonces.
 * Chaque implémentation cible une source spécifique (site web, flux RSS, etc.)
 * et retourne une collection de ScrapedRoomData.
 */
interface ScraperInterface
{
    /**
     * Exécute le scraping et retourne les annonces extraites.
     *
     * @return Collection<int, \App\Data\ScrapedRoomData>
     */
    public function scrape(): Collection;

    /**
     * Retourne le nom lisible de la source.
     */
    public function sourceName(): string;
}
