<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email de résultat de vérification d'identité.
 *
 * Envoyé quand un admin approuve ou rejette un dossier.
 */
class VerificationStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string  $userName,
        public string  $status, // 'verified' | 'rejected'
        public ?string $rejectReason = null,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->status === 'verified'
            ? 'Votre vérification a été approuvée — Roomshare'
            : 'Votre demande de vérification — Roomshare';

        return new Envelope(subject: $subject);
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
        $year = date('Y');
        $name = htmlspecialchars($this->userName, ENT_QUOTES);

        $body = $this->status === 'verified'
            ? $this->buildApprovedBody($name, $frontendUrl)
            : $this->buildRejectedBody($name, $frontendUrl);

        return <<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification d'identité</title>
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
                    {$body}
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

    private function buildApprovedBody(string $name, string $frontendUrl): string
    {
        $ctaUrl = $frontendUrl . '/create';

        return <<<HTML
        <h2 style="color: #000; margin-top: 0; font-size: 22px;">Félicitations, {$name} !</h2>

        <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #0E583D; color: #fff; padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                ✓ DOSSIER APPROUVÉ
            </span>
        </div>

        <p style="color: #444;">
            Votre identité a été vérifiée avec succès. Vous êtes désormais <strong>propriétaire</strong> sur Roomshare et pouvez publier vos annonces de colocation.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{$ctaUrl}" style="display: inline-block; background-color: #0E583D; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Publier une annonce →
            </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-bottom: 0;">Bienvenue parmi les propriétaires Roomshare. L'équipe</p>
        HTML;
    }

    private function buildRejectedBody(string $name, string $frontendUrl): string
    {
        $ctaUrl = $frontendUrl . '/profile/become-owner';
        $reason = $this->rejectReason
            ? htmlspecialchars($this->rejectReason, ENT_QUOTES)
            : 'Documents non conformes ou illisibles.';

        return <<<HTML
        <h2 style="color: #000; margin-top: 0; font-size: 22px;">Votre demande a été examinée</h2>

        <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: #cc2222; color: #fff; padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                ✗ DOSSIER REJETÉ
            </span>
        </div>

        <p style="color: #444;">
            Bonjour <strong>{$name}</strong>, nous n'avons pas pu valider votre dossier pour la raison suivante&nbsp;:
        </p>

        <blockquote style="border-left: 3px solid #eee; margin: 16px 0; padding: 12px 16px; background-color: #f9f9f9; border-radius: 0 8px 8px 0; color: #555; font-style: italic;">
            {$reason}
        </blockquote>

        <p style="color: #444;">
            Vous pouvez soumettre un nouveau dossier depuis votre espace personnel avec des documents corrects et lisibles.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{$ctaUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Soumettre un nouveau dossier →
            </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-bottom: 0;">L'équipe Roomshare</p>
        HTML;
    }
}
