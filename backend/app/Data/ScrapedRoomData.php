<?php

declare(strict_types=1);

namespace App\Data;

/**
 * DTO immuable représentant une annonce scrapée.
 *
 * Sert de contrat entre les scrapers et la couche d'ingestion.
 * Les données sont normalisées (prix nettoyé, texte trimmé) avant d'arriver ici.
 */
readonly class ScrapedRoomData
{
    /**
     * @param string      $title       Titre de l'annonce
     * @param int         $price       Prix mensuel en euros (entier, sans symbole)
     * @param string      $description Description nettoyée
     * @param string      $address     Adresse textuelle complète
     * @param array<string> $images    URLs des images
     * @param string      $sourceUrl   URL d'origine de l'annonce
     * @param string      $sourceId    Identifiant unique côté source
     */
    public function __construct(
        public string $title,
        public int    $price,
        public string $description,
        public string $address,
        public array  $images,
        public string $sourceUrl,
        public string $sourceId,
    ) {}

    /**
     * Crée une instance depuis un tableau associatif.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            title: trim($data['title'] ?? ''),
            price: (int) preg_replace('/[^\d]/', '', (string) ($data['price'] ?? '0')),
            description: trim($data['description'] ?? ''),
            address: trim($data['address'] ?? ''),
            images: $data['images'] ?? [],
            sourceUrl: trim($data['sourceUrl'] ?? ''),
            sourceId: trim($data['sourceId'] ?? ''),
        );
    }
}
