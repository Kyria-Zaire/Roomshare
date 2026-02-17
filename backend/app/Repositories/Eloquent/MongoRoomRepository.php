<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\Room;
use App\Repositories\Contracts\RoomRepositoryInterface;
use Illuminate\Support\Collection;

/**
 * Class MongoRoomRepository
 *
 * Implémentation MongoDB du RoomRepositoryInterface.
 * Utilise le driver mongodb/laravel-mongodb pour Eloquent.
 */
class MongoRoomRepository implements RoomRepositoryInterface
{
    public function __construct(
        private readonly Room $model,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        if (isset($filters['budget_min'])) {
            $query->where('budget', '>=', (int) $filters['budget_min']);
        }

        if (isset($filters['budget_max'])) {
            $query->where('budget', '<=', (int) $filters['budget_max']);
        }

        if (isset($filters['source_type'])) {
            $query->where('source_type', $filters['source_type']);
        }

        if (isset($filters['city'])) {
            $query->where('address.city', $filters['city']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    /**
     * {@inheritDoc}
     */
    public function findById(string $id): mixed
    {
        return $this->model->findOrFail($id);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): mixed
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update(string $id, array $data): mixed
    {
        $room = $this->model->findOrFail($id);
        $room->update($data);

        return $room->fresh();
    }

    /**
     * {@inheritDoc}
     */
    public function delete(string $id): bool
    {
        $room = $this->model->findOrFail($id);

        return (bool) $room->delete();
    }

    /**
     * {@inheritDoc}
     *
     * Utilise l'opérateur $geoNear de MongoDB pour la recherche de proximité.
     */
    public function findNearby(float $latitude, float $longitude, int $radiusKm = 5): Collection
    {
        return $this->model->where('location', 'near', [
            '$geometry' => [
                'type' => 'Point',
                'coordinates' => [$longitude, $latitude], // GeoJSON: [lng, lat]
            ],
            '$maxDistance' => $radiusKm * 1000, // Convertir en mètres
        ])->get();
    }

    /**
     * {@inheritDoc}
     */
    public function findByBudget(int $min, int $max = null): Collection
    {
        $query = $this->model->where('budget', '>=', $min);

        if ($max !== null) {
            $query->where('budget', '<=', $max);
        }

        return $query->orderBy('budget')->get();
    }

    /**
     * {@inheritDoc}
     *
     * Utilise $geoWithin + $geometry Polygon de MongoDB (compatible 2dsphere).
     * Les bounds proviennent du viewport de la carte interactive.
     */
    public function findByBounds(float $swLng, float $swLat, float $neLng, float $neLat): Collection
    {
        return $this->model->whereRaw([
            'location' => [
                '$geoWithin' => [
                    '$geometry' => [
                        'type' => 'Polygon',
                        'coordinates' => [[
                            [$swLng, $swLat], // SW
                            [$neLng, $swLat], // SE
                            [$neLng, $neLat], // NE
                            [$swLng, $neLat], // NW
                            [$swLng, $swLat], // SW (fermer le polygone)
                        ]],
                    ],
                ],
            ],
        ])->where('status', 'active')->get();
    }

    /**
     * {@inheritDoc}
     */
    public function findByOwner(string $ownerId): Collection
    {
        return $this->model
            ->where('owner_id', $ownerId)
            ->orderByDesc('created_at')
            ->get();
    }
}
