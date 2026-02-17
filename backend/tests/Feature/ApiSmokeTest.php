<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * ApiSmokeTest — Test de fumée pour vérifier que l'API répond correctement.
 *
 * Ce test vérifie que les endpoints critiques répondent avec le bon format JSON,
 * même en cas d'erreur. C'est notre filet de sécurité pour le déploiement.
 */
class ApiSmokeTest extends TestCase
{
    /**
     * Test que l'endpoint /api/v1/rooms répond en JSON.
     */
    public function test_rooms_endpoint_returns_json(): void
    {
        $response = $this->getJson('/api/v1/rooms');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
        ]);
        $this->assertTrue($response->json('success'));
    }

    /**
     * Test que les erreurs sont renvoyées en JSON.
     */
    public function test_invalid_route_returns_json_error(): void
    {
        $response = $this->getJson('/api/v1/nonexistent');

        // Doit retourner 404 avec format JSON
        $response->assertStatus(404);
        $response->assertJsonStructure([
            'success',
            'message',
        ]);
        $this->assertFalse($response->json('success'));
    }

    /**
     * Test que la validation d'ID MongoDB fonctionne.
     */
    public function test_invalid_mongodb_id_returns_error(): void
    {
        $response = $this->getJson('/api/v1/conversations/invalid-id-123');

        // Doit retourner 400 avec format JSON
        $response->assertStatus(400);
        $response->assertJsonStructure([
            'success',
            'message',
        ]);
        $this->assertFalse($response->json('success'));
    }

    /**
     * Test que l'endpoint de santé répond.
     */
    public function test_health_endpoint_responds(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }
}
