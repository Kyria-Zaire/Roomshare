<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Autorise les requêtes cross-origin depuis le frontend Next.js
    | en développement (localhost:3000) et en production.
    |
    */

    'paths' => ['api/*', 'broadcasting/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'),
        env('API_URL', 'http://localhost'),
        // Fallback pour développement local
        'http://localhost:3000',
        'http://localhost',
        'http://127.0.0.1:3000',
        'http://127.0.0.1',
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
