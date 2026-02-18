<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

/**
 * Stripe — Checkout Session (création) et Webhook (validation des paiements).
 * Ne jamais donner l'accès avant confirmation Stripe (checkout.session.completed).
 */
class StripeController extends Controller
{
    private const PLAN_PRICES = [
        'pass_day' => 99,    // 0.99 €
        'pass_week' => 399,  // 3.99 €
        'pass_month' => 999, // 9.99 €
        'pro_sub' => 1499,   // 14.99 €
    ];

    private const PLAN_LABELS = [
        'pass_day' => 'Pass Jour (24h)',
        'pass_week' => 'Pass Semaine (7 jours)',
        'pass_month' => 'Pass Mensuel (30 jours)',
        'pro_sub' => 'Abonnement Pro',
    ];

    /**
     * POST /api/v1/stripe/checkout
     *
     * Crée une session Stripe Checkout et retourne l'URL de redirection.
     */
    public function createCheckoutSession(Request $request): JsonResponse
    {
        // Configurer la clé API avant toute action Stripe
        // config() résiste au config:cache contrairement à env() appelé directement
        Stripe::setApiKey(config('services.stripe.secret'));

        $validated = $request->validate([
            'plan_type' => 'required|string|in:pass_day,pass_week,pass_month,pro_sub',
        ]);
        $planType = $validated['plan_type'];

        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Non authentifié.'], 401);
        }

        $userId = (string) $user->_id;
        $frontendUrl = rtrim(config('services.frontend_url', 'http://localhost:3000'), '/');
        $successUrl = $frontendUrl . '/profile?success=true';
        $cancelUrl = $frontendUrl . '/profile?canceled=true';

        $lineItem = [
            'quantity' => 1,
            'price_data' => [
                'currency' => 'eur',
                'product_data' => [
                    'name' => self::PLAN_LABELS[$planType],
                ],
                'unit_amount' => self::PLAN_PRICES[$planType],
            ],
        ];

        if ($planType === 'pro_sub') {
            $lineItem['price_data']['recurring'] = ['interval' => 'month'];
        }

        $params = [
            'mode' => $planType === 'pro_sub' ? 'subscription' : 'payment',
            'line_items' => [$lineItem],
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'metadata' => [
                'user_id' => $userId,
                'plan_type' => $planType,
            ],
        ];

        try {
            $session = StripeSession::create($params);
            return response()->json([
                'success' => true,
                'url' => $session->url,
            ]);
        } catch (\Throwable $e) {
            Log::error('Stripe createCheckoutSession error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Impossible de créer la session de paiement.',
            ], 500);
        }
    }

    /**
     * POST /api/v1/stripe/webhook
     *
     * Reçoit les événements Stripe (checkout.session.completed, etc.).
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sig = $request->header('Stripe-Signature');
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            Log::warning('Stripe webhook secret non configuré');
            return response()->json(['received' => true]);
        }

        try {
            $event = Webhook::constructEvent($payload, $sig, $secret);
        } catch (\UnexpectedValueException $e) {
            Log::warning('Stripe webhook payload invalide', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature invalide', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $this->handleCheckoutCompleted($event->data->object);
        }

        return response()->json(['received' => true]);
    }

    private function handleCheckoutCompleted(object $session): void
    {
        $userId = $session->metadata->user_id ?? null;
        $planType = $session->metadata->plan_type ?? $session->metadata->type ?? null;
        $paymentIntentId = $session->payment_intent ?? $session->subscription ?? $session->id;

        if (! $userId || ! $planType) {
            Log::warning('Stripe checkout.session.completed sans user_id ou plan_type', ['session_id' => $session->id]);
            return;
        }

        $user = User::find($userId);
        if (! $user) {
            Log::warning('Stripe: user introuvable', ['user_id' => $userId]);
            return;
        }

        $amount = (float) ($session->amount_total ?? 0) / 100;
        $now = Carbon::now();

        if ($planType === 'pro_sub') {
            $user->is_pro = true;
            $user->save();
        } else {
            $currentEnd = $user->pass_expires_at && $user->pass_expires_at->isFuture()
                ? $user->pass_expires_at
                : $now;
            $newEnd = match ($planType) {
                'pass_day' => $currentEnd->copy()->addHours(24),
                'pass_week' => $currentEnd->copy()->addDays(7),
                'pass_month' => $currentEnd->copy()->addDays(30),
                default => $currentEnd,
            };
            $user->pass_expires_at = $newEnd;
            $user->save();
        }

        $durationDays = match ($planType) {
            'pass_day' => 0,
            'pass_week' => 7,
            'pass_month' => 30,
            default => null,
        };

        Transaction::create([
            'user_id' => $userId,
            'amount' => $amount,
            'currency' => strtolower($session->currency ?? 'eur'),
            'type' => $planType,
            'status' => Transaction::STATUS_COMPLETED,
            'stripe_payment_id' => is_string($paymentIntentId) ? $paymentIntentId : (string) $paymentIntentId,
            'metadata' => array_filter([
                'duration_days' => $durationDays,
                'stripe_session_id' => $session->id,
            ]),
        ]);
    }
}
