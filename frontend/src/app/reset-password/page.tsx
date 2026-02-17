"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Récupérer token et email depuis l'URL
    const urlToken = searchParams.get("token");
    const urlEmail = searchParams.get("email");
    if (urlToken) setToken(urlToken);
    if (urlEmail) setEmail(urlEmail);
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!token.trim()) {
      newErrors.token = "Le token est requis";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = "La confirmation est requise";
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(true);
      toast.success("Mot de passe réinitialisé avec succès !");
      
      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      
      if (axiosErr.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(axiosErr.response.data.errors).forEach(([key, messages]) => {
          backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(backendErrors);
      } else {
        const msg =
          axiosErr.response?.data?.message ||
          "Une erreur est survenue. Veuillez réessayer.";
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 size={32} className="text-success" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Mot de passe réinitialisé !</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Votre mot de passe a été modifié avec succès. Redirection vers la page de connexion...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            Aller à la connexion maintenant →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size={80} />
        </div>

        <h1 className="mb-2 text-center text-xl font-bold text-foreground">
          Réinitialiser le mot de passe
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Entrez votre nouveau mot de passe ci-dessous.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              placeholder="vous@email.com"
              className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 text-sm outline-none transition-colors ${
                errors.email
                  ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                  : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Token de réinitialisation</label>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (errors.token) setErrors({ ...errors, token: "" });
              }}
              placeholder="Token reçu par email"
              className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 text-sm outline-none transition-colors ${
                errors.token
                  ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                  : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
              }`}
            />
            {errors.token && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.token}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="Min. 6 caractères"
                className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 pr-10 text-sm outline-none transition-colors ${
                  errors.password
                    ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                  if (errors.passwordConfirmation) setErrors({ ...errors, passwordConfirmation: "" });
                }}
                placeholder="Répétez le mot de passe"
                className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 pr-10 text-sm outline-none transition-colors ${
                  errors.passwordConfirmation
                    ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.passwordConfirmation && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.passwordConfirmation}
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
            Réinitialiser le mot de passe
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
            <ArrowLeft size={14} />
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
