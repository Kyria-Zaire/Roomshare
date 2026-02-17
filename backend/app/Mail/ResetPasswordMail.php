<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email de réinitialisation de mot de passe.
 */
class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public string $resetToken,
        public string $userName,
        public string $userEmail,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Réinitialisation de votre mot de passe - Roomshare',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $resetUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $this->resetToken . '&email=' . urlencode($this->userEmail);

        return new Content(
            htmlString: $this->buildHtmlContent($resetUrl),
        );
    }

    /**
     * Construire le contenu HTML de l'email.
     */
    private function buildHtmlContent(string $resetUrl): string
    {
        return "
        <!DOCTYPE html>
        <html lang='fr'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Réinitialisation de mot de passe</title>
        </head>
        <body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #000; padding: 20px; text-align: center; margin-bottom: 30px;'>
                <h1 style='color: #fff; margin: 0; font-size: 24px;'>Roomshare</h1>
            </div>
            
            <h2 style='color: #000; margin-top: 0;'>Bonjour {$this->userName},</h2>
            
            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Roomshare.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$resetUrl}' style='display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;'>Réinitialiser mon mot de passe</a>
            </div>
            
            <p style='color: #666; font-size: 14px;'>Ou copiez ce lien dans votre navigateur :</p>
            <p style='color: #666; font-size: 12px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;'>{$resetUrl}</p>
            
            <p style='color: #666; font-size: 14px;'>Ce lien expirera dans 1 heure.</p>
            
            <p style='color: #666; font-size: 14px;'>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            
            <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
            
            <p style='color: #999; font-size: 12px; text-align: center;'>© " . date('Y') . " Roomshare. Tous droits réservés.</p>
        </body>
        </html>
        ";
    }
}
