<?php

declare(strict_types=1);

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/**
 * Class Room
 *
 * Modèle Eloquent MongoDB pour les annonces de colocation.
 * Schéma flexible : s'adapte aux données manuelles et scrapées.
 *
 * @property string      $_id
 * @property string      $title
 * @property string|null $description
 * @property int         $budget          Prix mensuel en euros
 * @property array       $location        GeoJSON Point {type, coordinates: [lng, lat]}
 * @property array       $address         {street, city, zip_code, country}
 * @property array       $images          URLs des images (WebP optimisé)
 * @property string      $source_type     'manual' | 'scraped'
 * @property string|null $source_url      URL d'origine si scrapé
 * @property array       $amenities       Équipements (wifi, parking, etc.)
 * @property int|null    $surface         Surface en m²
 * @property int         $rooms_count     Nombre de chambres
 * @property bool        $is_furnished    Meublé ou non
 * @property string      $availability    Date de disponibilité (ISO 8601)
 * @property array|null  $roommate_prefs  Préférences colocataire {age_range, gender, lifestyle}
 * @property string      $status          'active' | 'inactive' | 'rented'
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Room extends Model
{
    /** @var string */
    protected $connection = 'mongodb';

    /** @var string */
    protected $collection = 'rooms';

    /**
     * Champs remplissables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'budget',
        'location',
        'address',
        'images',
        'source_type',
        'source_url',
        'amenities',
        'surface',
        'rooms_count',
        'is_furnished',
        'availability',
        'roommate_prefs',
        'status',
        'owner_id',
        'is_boosted',
        'boost_expires_at',
        'stats',
    ];

    /**
     * Attributs castés.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'budget' => 'integer',
            'surface' => 'integer',
            'rooms_count' => 'integer',
            'is_furnished' => 'boolean',
            'is_boosted' => 'boolean',
            'boost_expires_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Valeurs par défaut.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'source_type' => 'manual',
        'status' => 'active',
        'is_furnished' => false,
        'rooms_count' => 1,
    ];
}
