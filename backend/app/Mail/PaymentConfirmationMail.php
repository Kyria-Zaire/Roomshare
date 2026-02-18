<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email de confirmation de paiement — envoyé après un succès Stripe.
 */
class PaymentConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $planLabel,
        public float  $amount,
        public string $currency = 'EUR',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmation de paiement — Roomshare',
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('services.frontend_url', 'http://localhost:3000');

        return new Content(
            htmlString: $this->buildHtml($frontendUrl),
        );
    }

    private function buildHtml(string $frontendUrl): string
    {
        $year        = date('Y');
        $name        = htmlspecialchars($this->userName, ENT_QUOTES);
        $plan        = htmlspecialchars($this->planLabel, ENT_QUOTES);
        $amountFmt   = number_format($this->amount, 2, ',', ' ');
        $currency    = strtoupper($this->currency);
        $ctaUrl      = $frontendUrl . '/profile';

        return <<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmation de paiement</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background-color: #000; padding: 24px; text-align: center;">
                    <p style="color: #fff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                        room<span style="color: #0E583D;">share</span>
                    </p>
                </div>

                <!-- Body -->
                <div style="padding: 36px 28px;">
                    <h2 style="color: #000; margin-top: 0; font-size: 22px;">Paiement confirmé !</h2>

                    <p style="color: #444;">Bonjour <strong>{$name}</strong>, votre paiement a bien été reçu.</p>

                    <!-- Récapitulatif -->
                    <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="color: #666; font-size: 14px; padding: 6px 0;">Offre souscrite</td>
                                <td style="color: #000; font-size: 14px; font-weight: 600; text-align: right; padding: 6px 0;">{$plan}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; font-size: 14px; padding: 6px 0; border-top: 1px solid #eee; padding-top: 12px;">Montant débité</td>
                                <td style="color: #000; font-size: 18px; font-weight: 700; text-align: right; padding: 6px 0; border-top: 1px solid #eee; padding-top: 12px;">{$amountFmt} {$currency}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Badge accès activé -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; background-color: #0E583D; color: #fff; padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                            ✓ ACCÈS ACTIVÉ
                        </span>
                    </div>

                    <!-- CTA -->
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="{$ctaUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                            Accéder à mon espace →
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">Merci pour votre confiance. L'équipe Roomshare</p>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #f0f0f0; padding: 16px 28px; text-align: center; background-color: #fafafa;">
                    <p style="color: #aaa; font-size: 12px; margin: 0;">© {$year} Roomshare. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        HTML;
    }
}
