<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\RoomController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\UserProfileController;
use App\Http\Controllers\Api\V1\UserVerificationController;
use App\Http\Controllers\Api\V1\StripeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Préfixe automatique : /api/v1
|--------------------------------------------------------------------------
*/

// ─── Authentification (publique) ───────────────────────────
// Rate limiting : 5 tentatives par minute pour register/login
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');
});

// Rate limiting : 3 tentatives par heure pour forgot-password (éviter les abus)
Route::middleware(['throttle:3,60'])->group(function () {
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot-password');
});

Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->name('auth.reset-password');

// Webhook Stripe (sans auth, sans CSRF — vérification signature dans le contrôleur)
Route::post('/stripe/webhook', [StripeController::class, 'webhook'])->name('stripe.webhook');

// ─── Routes protégées (authentification Sanctum requise) ────
Route::middleware(['auth:sanctum'])->group(function () {
    // Stripe Checkout (création de session, utilisateur authentifié)
    Route::post('/stripe/checkout', [StripeController::class, 'createCheckoutSession'])->name('stripe.checkout');

    // Auth endpoints
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
    Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->name('auth.update-profile');
    Route::put('/auth/password', [AuthController::class, 'changePassword'])->name('auth.change-password');
    
    // Mes annonces
    Route::get('/rooms/my', [RoomController::class, 'my'])->name('rooms.my');
    
    // Création et modification d'annonces
    Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::put('/rooms/{id}', [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    
    // Upload d'images
    Route::post('/upload/images', [UploadController::class, 'images'])->name('upload.images');
    
    // Favoris
    Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites.index');
    Route::post('/favorites', [FavoriteController::class, 'store'])->name('favorites.store');
    Route::delete('/favorites/{roomId}', [FavoriteController::class, 'destroy'])->name('favorites.destroy');
    
    // Conversations et messages
    Route::get('/conversations/unread/count', [ConversationController::class, 'unreadCount'])->name('conversations.unread');
    Route::get('/conversations', [ConversationController::class, 'index'])->name('conversations.index');
    Route::post('/conversations', [ConversationController::class, 'store'])->name('conversations.store');
    Route::get('/conversations/{id}', [ConversationController::class, 'show'])->name('conversations.show');
    Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
    
    // Vérification d'identité
    Route::post('/user/verify-request', [UserVerificationController::class, 'store'])->name('user.verify-request');
    Route::get('/user/verification-status', [UserVerificationController::class, 'status'])->name('user.verification-status');

    // Recherche et suggestions d'utilisateurs
    Route::get('/users/search', [UserController::class, 'search'])->name('users.search');
    Route::get('/users/suggestions', [UserController::class, 'suggestions'])->name('users.suggestions');

    // Profil étendu et paramètres
    Route::get('/user/settings', [UserProfileController::class, 'settings'])->name('user.settings');
    Route::put('/user/profile', [UserProfileController::class, 'updateProfile'])->name('user.profile.update');
    Route::patch('/user/settings', [UserProfileController::class, 'updateSettings'])->name('user.settings.update');
    Route::get('/user/export', [UserProfileController::class, 'export'])->name('user.export');
    Route::post('/user/avatar', [UserProfileController::class, 'uploadAvatar'])->name('user.avatar');
});

// ─── Routes publiques ────────────────────────────────────────
Route::get('/rooms/map', [RoomController::class, 'map'])->name('rooms.map');
Route::get('/rooms', [RoomController::class, 'index'])->name('rooms.index');
Route::get('/rooms/{id}', [RoomController::class, 'show'])->name('rooms.show')->middleware('early.access');
