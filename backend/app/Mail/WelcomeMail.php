<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email de bienvenue — envoyé juste après l'inscription.
 */
class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenue sur Roomshare !',
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
        $year = date('Y');
        $ctaUrl = $frontendUrl;
        $name = htmlspecialchars($this->userName, ENT_QUOTES);

        return <<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenue sur Roomshare</title>
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
                    <h2 style="color: #000; margin-top: 0; font-size: 22px;">Bienvenue, {$name} !</h2>

                    <p style="color: #444; margin-bottom: 12px;">
                        Votre compte Roomshare est prêt. Vous pouvez dès maintenant&nbsp;:
                    </p>

                    <ul style="color: #444; padding-left: 20px; margin-bottom: 28px;">
                        <li style="margin-bottom: 6px;">Explorer les annonces de colocation à Reims</li>
                        <li style="margin-bottom: 6px;">Contacter directement les propriétaires</li>
                        <li style="margin-bottom: 6px;">Sauvegarder vos colocations favorites</li>
                    </ul>

                    <!-- CTA -->
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{$ctaUrl}" style="display: inline-block; background-color: #0E583D; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                            Explorer les annonces →
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px;">Bonne recherche !</p>
                    <p style="color: #666; font-size: 14px; margin-bottom: 0;">L'équipe Roomshare</p>
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
