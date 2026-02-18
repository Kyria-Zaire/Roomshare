<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        // auth:sanctum requis : seuls les utilisateurs authentifiés peuvent obtenir
        // un token WebSocket. La closure channels.php vérifie ensuite la participation.
        ['prefix' => 'api/v1', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'early.access' => \App\Http\Middleware\CheckEarlyAccess::class,
            'admin'        => \App\Http\Middleware\EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // ─── API-only : toujours renvoyer du JSON ────────────────
        $exceptions->shouldRenderJsonWhen(function ($request, Throwable $e) {
            // Toutes les routes API renvoient du JSON
            return $request->is('api/*');
        });

        // ─── Handler personnalisé pour ValidationException ──────
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // ─── Handler pour AuthenticationException (401) ──────────
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié. Veuillez vous connecter.',
                ], 401);
            }
        });

        // ─── Handler pour AuthorizationException (403) ────────────
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé.',
                ], 403);
            }
        });

        // ─── Handler pour NotFoundHttpException ──────────────────
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ressource non trouvée.',
                ], 404);
            }
        });

        // ─── Handler générique pour toutes les autres exceptions ─
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                $statusCode = method_exists($e, 'getStatusCode') 
                    ? $e->getStatusCode() 
                    : 500;

                return response()->json([
                    'success' => false,
                    'message' => app()->environment('production') 
                        ? 'Une erreur est survenue.' 
                        : $e->getMessage(),
                ], $statusCode);
            }
        });
    })->create();
