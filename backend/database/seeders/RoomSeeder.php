<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

/**
 * RoomSeeder — 10 fausses annonces localisées stratégiquement à Reims.
 *
 * Localisations proches des universités et lieux stratégiques :
 * - URCA Campus Moulin de la Housse
 * - URCA Campus Croix-Rouge
 * - Neoma Business School
 * - Centre-ville (Place d'Erlon, Cathédrale)
 * - Gare de Reims
 * - Quartiers résidentiels étudiants
 */
class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = [
            [
                'title' => 'Chambre meublée proche URCA Moulin de la Housse',
                'description' => 'Belle chambre de 14m² dans colocation de 3, ambiance studieuse. À 5 min à pied du campus sciences.',
                'budget' => 380,
                'location' => ['type' => 'Point', 'coordinates' => [3.5850, 49.2350]],
                'address' => ['street' => '12 Rue du Moulin de la Housse', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'machine à laver', 'parking vélo'],
                'surface' => 14,
                'rooms_count' => 3,
                'is_furnished' => true,
                'availability' => '2026-03-01',
                'status' => 'active',
            ],
            [
                'title' => 'Studio lumineux Campus Croix-Rouge',
                'description' => 'Studio refait à neuf face au campus Croix-Rouge (Médecine, Droit). Idéal étudiant sérieux.',
                'budget' => 450,
                'location' => ['type' => 'Point', 'coordinates' => [3.5600, 49.2450]],
                'address' => ['street' => '45 Avenue du Général Leclerc', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'cuisine équipée', 'interphone'],
                'surface' => 22,
                'rooms_count' => 1,
                'is_furnished' => true,
                'availability' => '2026-02-15',
                'status' => 'active',
            ],
            [
                'title' => 'Coloc 4 chambres - Quartier Neoma',
                'description' => 'Grande maison en colocation à deux pas de Neoma BS. Jardin, BBQ, ambiance internationale.',
                'budget' => 420,
                'location' => ['type' => 'Point', 'coordinates' => [3.5580, 49.2520]],
                'address' => ['street' => '8 Rue des Capucins', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'jardin', 'barbecue', 'cave'],
                'surface' => 18,
                'rooms_count' => 4,
                'is_furnished' => true,
                'availability' => '2026-03-15',
                'status' => 'active',
            ],
            [
                'title' => 'T2 rénové Place d\'Erlon',
                'description' => 'Appartement T2 plein centre, au-dessus de la Place d\'Erlon. Vie nocturne et commerces au pied.',
                'budget' => 580,
                'location' => ['type' => 'Point', 'coordinates' => [3.5730, 49.2530]],
                'address' => ['street' => '22 Place d\'Erlon', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'ascenseur', 'parquet'],
                'surface' => 35,
                'rooms_count' => 2,
                'is_furnished' => false,
                'availability' => '2026-04-01',
                'status' => 'active',
            ],
            [
                'title' => 'Chambre calme Quartier Cathédrale',
                'description' => 'Chambre dans appartement bourgeois vue Cathédrale. Quartier historique, calme absolu.',
                'budget' => 400,
                'location' => ['type' => 'Point', 'coordinates' => [3.5740, 49.2533]],
                'address' => ['street' => '5 Rue Libergier', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'],
                'source_type' => 'scraped',
                'source_url' => 'https://example.com/annonce-cathedrale',
                'amenities' => ['wifi', 'chauffage central', 'cave'],
                'surface' => 16,
                'rooms_count' => 2,
                'is_furnished' => true,
                'availability' => '2026-02-20',
                'status' => 'active',
            ],
            [
                'title' => 'Coloc étudiante proche Gare TGV',
                'description' => 'Parfait pour les navetteurs Paris-Reims. 3 min à pied de la gare TGV, 45 min de Paris.',
                'budget' => 350,
                'location' => ['type' => 'Point', 'coordinates' => [3.5810, 49.2580]],
                'address' => ['street' => '3 Boulevard Joffre', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'machine à laver', 'local vélo'],
                'surface' => 12,
                'rooms_count' => 3,
                'is_furnished' => true,
                'availability' => '2026-03-01',
                'status' => 'active',
            ],
            [
                'title' => 'Grand T3 Quartier Clairmarais',
                'description' => 'T3 spacieux dans le quartier Clairmarais, parfait pour une coloc à 2. Proche tram et commerces.',
                'budget' => 650,
                'location' => ['type' => 'Point', 'coordinates' => [3.5650, 49.2540]],
                'address' => ['street' => '17 Rue de Mars', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'parking', 'balcon', 'cuisine équipée'],
                'surface' => 55,
                'rooms_count' => 3,
                'is_furnished' => false,
                'availability' => '2026-04-15',
                'status' => 'active',
            ],
            [
                'title' => 'Chambre en résidence étudiante Jean-Jaurès',
                'description' => 'Résidence étudiante récente, salle de sport et laverie en accès libre. Quartier calme.',
                'budget' => 320,
                'location' => ['type' => 'Point', 'coordinates' => [3.5700, 49.2460]],
                'address' => ['street' => '28 Rue Jean-Jaurès', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
                'source_type' => 'scraped',
                'source_url' => 'https://example.com/residence-jaures',
                'amenities' => ['wifi', 'salle de sport', 'laverie', 'digicode'],
                'surface' => 18,
                'rooms_count' => 1,
                'is_furnished' => true,
                'availability' => '2026-02-10',
                'status' => 'active',
            ],
            [
                'title' => 'Loft atypique Boulingrin',
                'description' => 'Ancien atelier reconverti en loft. Esprit artiste, volumes généreux, proche des Halles du Boulingrin.',
                'budget' => 520,
                'location' => ['type' => 'Point', 'coordinates' => [3.5680, 49.2565]],
                'address' => ['street' => '10 Rue de Mars', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'mezzanine', 'verrière', 'parquet'],
                'surface' => 40,
                'rooms_count' => 2,
                'is_furnished' => true,
                'availability' => '2026-05-01',
                'status' => 'active',
            ],
            [
                'title' => 'Coloc solidaire Maison Bleue',
                'description' => 'Projet de colocation solidaire. Loyer modéré, potager partagé, vie communautaire. Proche tram A.',
                'budget' => 280,
                'location' => ['type' => 'Point', 'coordinates' => [3.5770, 49.2490]],
                'address' => ['street' => '42 Rue de Cernay', 'city' => 'Reims', 'zip_code' => '51100', 'country' => 'France'],
                'images' => ['https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800'],
                'source_type' => 'manual',
                'amenities' => ['wifi', 'potager', 'buanderie', 'vélos partagés'],
                'surface' => 15,
                'rooms_count' => 5,
                'is_furnished' => true,
                'availability' => '2026-03-10',
                'status' => 'active',
            ],
        ];

        foreach ($rooms as $roomData) {
            Room::create($roomData);
        }

        $this->command->info('✓ 10 annonces Roomshare créées à Reims.');
    }
}
