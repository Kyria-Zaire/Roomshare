"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Loader2, AlertCircle, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

// ─── Constantes ───────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  emailRequired: "L'email est requis",
  emailInvalid: "Format d'email invalide",
  successToast: "Email de réinitialisation envoyé !",
  fallbackError: "Une erreur est survenue. Veuillez réessayer.",
} as const;

// ─── Helpers ──────────────────────────────────────────────────
function validateEmail(email: string): string | null {
  if (!email.trim()) return MESSAGES.emailRequired;
  if (!EMAIL_REGEX.test(email)) return MESSAGES.emailInvalid;
  return null;
}

type ApiError = { response?: { data?: { message?: string } } };

function extractApiError(err: unknown): string {
  const axiosErr = err as ApiError;
  return axiosErr.response?.data?.message ?? MESSAGES.fallbackError;
}

// ─── Composant ────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/forgot-password", { email });

      // En développement, le token peut être retourné pour faciliter les tests
      if (data.data?.reset_token) {
        setResetToken(data.data.reset_token);
      }

      setSuccess(true);
      toast.success(MESSAGES.successToast);
    } catch (err: unknown) {
      setErrors({ general: extractApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = errors.email
    ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size={80} />
        </div>

        {!success ? (
          <>
            <h1 className="mb-2 text-center text-xl font-bold text-foreground">
              Mot de passe oublié ?
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="vous@email.com"
                    className={`w-full rounded-[var(--radius-button)] border bg-background pl-10 pr-4 py-3 text-sm outline-none transition-colors ${inputClassName}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-error flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="rounded-[var(--radius-button)] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Envoyer le lien
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 size={32} className="text-success" />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Email envoyé !</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.
            </p>

            {/* MVP : Afficher le token pour test (à retirer en production) */}
            {resetToken && (
              <div className="mb-6 rounded-[var(--radius-card)] border border-accent/30 bg-accent-light/30 p-4">
                <p className="mb-2 text-xs font-medium text-accent">Token de test (MVP) :</p>
                <code className="block break-all text-xs text-foreground">{resetToken}</code>
                <Link
                  href={`/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`}
                  className="mt-2 inline-block text-xs text-accent hover:underline"
                >
                  Cliquez ici pour réinitialiser →
                </Link>
              </div>
            )}

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
