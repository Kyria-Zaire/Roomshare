<?php

declare(strict_types=1);

namespace App\Scrapers;

use App\Data\ScrapedRoomData;
use Illuminate\Support\Collection;
use Symfony\Component\DomCrawler\Crawler;

/**
 * Scraper de démonstration ciblant des annonces étudiantes à Reims.
 *
 * Pour le MVP, ce scraper parse un HTML simulé (mock) contenant des annonces
 * réalistes situées dans les quartiers clés de Reims : URCA, Neoma, Place d'Erlon,
 * Quartier Clairmarais, Boulingrin, etc.
 *
 * En production, la méthode fetchHtml() serait remplacée par un vrai appel HTTP
 * vers un site d'annonces immobilières.
 */
class ReimsStudentScraper implements ScraperInterface
{
    public function sourceName(): string
    {
        return 'reims-student';
    }

    /**
     * Parse le HTML (simulé) et retourne une collection de ScrapedRoomData.
     */
    public function scrape(): Collection
    {
        $html = $this->fetchHtml();
        $crawler = new Crawler($html);

        return collect($crawler->filter('.annonce')->each(function (Crawler $node) {
            $title = $node->filter('.annonce-title')->text('');
            $priceRaw = $node->filter('.annonce-price')->text('0');
            $description = $node->filter('.annonce-desc')->text('');
            $address = $node->filter('.annonce-address')->text('');
            $sourceId = $node->attr('data-id') ?? '';
            $sourceUrl = $node->filter('.annonce-link')->attr('href') ?? '';

            $images = $node->filter('.annonce-img')->each(fn(Crawler $img) => $img->attr('src') ?? '');
            $images = array_filter($images);

            $price = (int) preg_replace('/[^\d]/', '', $priceRaw);

            return new ScrapedRoomData(
                title: trim($title),
                price: $price,
                description: trim($description),
                address: trim($address),
                images: array_values($images),
                sourceUrl: trim($sourceUrl),
                sourceId: trim($sourceId),
            );
        }));
    }

    /**
     * Retourne le HTML simulé avec des annonces réalistes de Reims.
     *
     * Chaque annonce est positionnée dans un quartier étudiant réel de la ville.
     * Les prix, surfaces et descriptions reflètent le marché locatif rémois.
     */
    private function fetchHtml(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<body>
<div class="annonces-list">

    <div class="annonce" data-id="reims-001">
        <h2 class="annonce-title">Chambre meublée proche Campus Croix-Rouge URCA</h2>
        <span class="annonce-price">420 €/mois</span>
        <p class="annonce-desc">Chambre de 14m² dans colocation de 4 personnes. Résidence calme à 5 min à pied du campus Croix-Rouge. Cuisine et salle de bain partagées. WiFi fibre inclus. Idéal étudiant URCA.</p>
        <span class="annonce-address">9 Rue de Venise, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-001">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=640" />
        <img class="annonce-img" src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=640" />
    </div>

    <div class="annonce" data-id="reims-002">
        <h2 class="annonce-title">Studio lumineux Place d'Erlon - Centre-ville</h2>
        <span class="annonce-price">550€</span>
        <p class="annonce-desc">Beau studio de 22m² entièrement rénové au cœur de Reims. Parquet, double vitrage, cuisine équipée. Situé Place d'Erlon, proche tramway et commerces. Charges comprises.</p>
        <span class="annonce-address">28 Place d'Erlon, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-002">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=640" />
    </div>

    <div class="annonce" data-id="reims-003">
        <h2 class="annonce-title">Colocation 3 chambres quartier Clairmarais</h2>
        <span class="annonce-price">380 €</span>
        <p class="annonce-desc">Grande maison rénovée avec jardin partagé. 3 chambres disponibles de 12 à 16m². Quartier résidentiel calme, à 10 min en tram du centre et de Neoma. Parking gratuit.</p>
        <span class="annonce-address">15 Rue de Mars, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-003">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=640" />
        <img class="annonce-img" src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=640" />
    </div>

    <div class="annonce" data-id="reims-004">
        <h2 class="annonce-title">T2 meublé à côté de Neoma Business School</h2>
        <span class="annonce-price">620 €/mois</span>
        <p class="annonce-desc">Appartement T2 de 35m² meublé et équipé. À 2 minutes à pied de Neoma BS. Séjour lumineux, chambre séparée, salle d'eau avec douche. Résidence sécurisée avec interphone.</p>
        <span class="annonce-address">59 Rue Libergier, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-004">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=640" />
    </div>

    <div class="annonce" data-id="reims-005">
        <h2 class="annonce-title">Chambre en colocation Boulingrin - Marché couvert</h2>
        <span class="annonce-price">350 €</span>
        <p class="annonce-desc">Chambre meublée de 11m² dans appartement T4. Ambiance conviviale, coloc mixte de 3 personnes. Proche du marché du Boulingrin et arrêt de tram. Internet fibre et eau chaude inclus.</p>
        <span class="annonce-address">3 Rue de Tambour, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-005">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=640" />
    </div>

    <div class="annonce" data-id="reims-006">
        <h2 class="annonce-title">Grand T3 lumineux - Boulevard de la Paix</h2>
        <span class="annonce-price">750 €</span>
        <p class="annonce-desc">Spacieux T3 de 55m² au 3ème étage avec ascenseur. 2 chambres, salon, cuisine américaine équipée. Vue dégagée sur le boulevard. Parfait pour colocation à deux. Proche Sciences Po et IEP.</p>
        <span class="annonce-address">44 Boulevard de la Paix, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-006">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=640" />
        <img class="annonce-img" src="https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=640" />
    </div>

    <div class="annonce" data-id="reims-007">
        <h2 class="annonce-title">Studio cosy Quartier Jamin - Campus Santé</h2>
        <span class="annonce-price">400 €/mois</span>
        <p class="annonce-desc">Petit studio fonctionnel de 18m² idéal pour étudiant en médecine. À 5 min du CHU et de la fac de médecine. Kitchenette, salle d'eau, rangements. Calme et bien desservi par le bus.</p>
        <span class="annonce-address">12 Rue du Docteur Jacquin, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-007">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=640" />
    </div>

    <div class="annonce" data-id="reims-008">
        <h2 class="annonce-title">Colocation étudiante - Rue de Vesle centre</h2>
        <span class="annonce-price">450€/mois</span>
        <p class="annonce-desc">Chambre de 13m² dans bel appartement haussmannien de 90m². Colocation de 3 étudiants. Grands volumes, parquet ancien, moulures. Rue de Vesle, accès direct tramway et vie nocturne.</p>
        <span class="annonce-address">112 Rue de Vesle, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-008">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?w=640" />
    </div>

    <div class="annonce" data-id="reims-009">
        <h2 class="annonce-title">T2 rénové Porte de Paris - Gare TGV</h2>
        <span class="annonce-price">520 €</span>
        <p class="annonce-desc">Appartement T2 de 30m² refait à neuf. Idéal pour navetteur Paris-Reims (45 min TGV). Chambre avec placard, cuisine équipée, parquet. À 3 min à pied de la gare Reims Centre.</p>
        <span class="annonce-address">6 Boulevard Joffre, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-009">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=640" />
    </div>

    <div class="annonce" data-id="reims-010">
        <h2 class="annonce-title">Chambre spacieuse quartier Laon-Zola URCA</h2>
        <span class="annonce-price">390 €</span>
        <p class="annonce-desc">Chambre meublée de 15m² dans maison avec terrasse. Colocation calme et studieuse de 4 personnes. Quartier Laon-Zola, proche campus Moulin de la Housse (sciences). Bus direct vers le centre.</p>
        <span class="annonce-address">25 Rue Émile Zola, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-010">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=640" />
    </div>

    <div class="annonce" data-id="reims-011">
        <h2 class="annonce-title">Loft atypique Halles du Boulingrin</h2>
        <span class="annonce-price">680€</span>
        <p class="annonce-desc">Loft de 40m² sous combles avec poutres apparentes et velux. Espace ouvert, coin nuit sur mezzanine. Quartier des Halles du Boulingrin, marché, restos et bars à proximité. Pour étudiant ou jeune actif.</p>
        <span class="annonce-address">2 Rue de l'Arbalète, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-011">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=640" />
    </div>

    <div class="annonce" data-id="reims-012">
        <h2 class="annonce-title">Colocation internationale - Résidence Cathédrale</h2>
        <span class="annonce-price">470 €/mois</span>
        <p class="annonce-desc">Chambre de 14m² dans colocation internationale (4 colocataires). Vue sur la Cathédrale Notre-Dame. Appartement moderne avec balcon commun. Ambiance multiculturelle, idéal Erasmus.</p>
        <span class="annonce-address">8 Rue Rockefeller, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-012">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=640" />
        <img class="annonce-img" src="https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=640" />
    </div>

    <div class="annonce" data-id="reims-013">
        <h2 class="annonce-title">Studio meublé Faubourg de Laon - CROUS</h2>
        <span class="annonce-price">360 €</span>
        <p class="annonce-desc">Studio meublé de 16m² dans petite résidence étudiante privée. Kitchenette, douche, WC. Proche résidence CROUS et campus Croix-Rouge. Loyer charges incluses, APL possible.</p>
        <span class="annonce-address">78 Avenue de Laon, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-013">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=640" />
    </div>

    <div class="annonce" data-id="reims-014">
        <h2 class="annonce-title">T2 standing quartier des Promenades</h2>
        <span class="annonce-price">590 €/mois</span>
        <p class="annonce-desc">Bel appartement T2 de 38m² dans immeuble bourgeois. Parquet massif, cheminée décorative, hauteur sous plafond 3m. Quartier des Promenades, à deux pas du parc Léo Lagrange et de Sciences Po.</p>
        <span class="annonce-address">17 Rue Cérès, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-014">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=640" />
    </div>

    <div class="annonce" data-id="reims-015">
        <h2 class="annonce-title">Chambre coloc maison Quartier Saint-Remi</h2>
        <span class="annonce-price">410 €</span>
        <p class="annonce-desc">Chambre de 13m² dans grande maison rémoise avec jardin clos. Quartier historique Saint-Remi, calme et verdoyant. Colocation de 3, ambiance familiale. Machine à laver, cave, garage vélo.</p>
        <span class="annonce-address">5 Rue Saint-Julien, 51100 Reims</span>
        <a class="annonce-link" href="https://example.com/annonces/reims-015">Voir</a>
        <img class="annonce-img" src="https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=640" />
    </div>

</div>
</body>
</html>
HTML;
    }
}
