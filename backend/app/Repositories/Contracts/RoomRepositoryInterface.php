<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

/**
 * Interface RoomRepositoryInterface
 *
 * Contrat d'abstraction pour l'accès aux données Room.
 * Permet de basculer de MongoDB à une autre DB (MySQL, PostgreSQL...)
 * sans modifier la logique métier (SOLID - Dependency Inversion).
 */
interface RoomRepositoryInterface
{
    /**
     * Récupérer toutes les rooms avec filtres optionnels.
     *
     * @param  array<string, mixed>  $filters
     * @return Collection
     */
    public function all(array $filters = []): Collection;

    /**
     * Trouver une room par son ID.
     *
     * @param  string  $id
     * @return mixed
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findById(string $id): mixed;

    /**
     * Créer une nouvelle room.
     *
     * @param  array<string, mixed>  $data
     * @return mixed
     */
    public function create(array $data): mixed;

    /**
     * Mettre à jour une room existante.
     *
     * @param  string  $id
     * @param  array<string, mixed>  $data
     * @return mixed
     */
    public function update(string $id, array $data): mixed;

    /**
     * Supprimer une room.
     *
     * @param  string  $id
     * @return bool
     */
    public function delete(string $id): bool;

    /**
     * Rechercher des rooms par proximité GPS.
     *
     * @param  float  $latitude
     * @param  float  $longitude
     * @param  int    $radiusKm
     * @return Collection
     */
    public function findNearby(float $latitude, float $longitude, int $radiusKm = 5): Collection;

    /**
     * Filtrer les rooms par budget (min/max).
     *
     * @param  int       $min
     * @param  int|null  $max
     * @return Collection
     */
    public function findByBudget(int $min, int $max = null): Collection;

    /**
     * Rechercher des rooms dans un rectangle géographique (bounds de la carte).
     * Utilise l'opérateur $geoWithin + $box de MongoDB (index 2dsphere).
     *
     * @param  float  $swLng  South-West longitude
     * @param  float  $swLat  South-West latitude
     * @param  float  $neLng  North-East longitude
     * @param  float  $neLat  North-East latitude
     * @return Collection
     */
    public function findByBounds(float $swLng, float $swLat, float $neLng, float $neLat): Collection;

    /**
     * Récupérer les rooms d'un propriétaire (utilisateur).
     *
     * @param  string  $ownerId
     * @return Collection
     */
    public function findByOwner(string $ownerId): Collection;
}
