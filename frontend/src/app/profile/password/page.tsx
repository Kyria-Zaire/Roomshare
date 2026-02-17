"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

function ChangePasswordContent() {
  const router = useRouter();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Le mot de passe actuel est requis";
    }

    if (!password) {
      newErrors.password = "Le nouveau mot de passe est requis";
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
      await apiClient.put("/auth/password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      toast.success("Mot de passe modifié avec succès !");
      
      // Déconnexion automatique après changement de mot de passe
      setTimeout(() => {
        logout();
        router.push("/login");
      }, 1500);
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Changer le mot de passe</h1>
              <p className="text-xs text-muted-foreground">Mettez à jour votre mot de passe de sécurité</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mot de passe actuel */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground flex items-center gap-2">
              <Lock size={16} />
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) setErrors({ ...errors, currentPassword: "" });
                }}
                placeholder="Entrez votre mot de passe actuel"
                className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 pr-10 text-sm outline-none transition-colors ${
                  errors.currentPassword
                    ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground flex items-center gap-2">
              <Lock size={16} />
              Nouveau mot de passe
            </label>
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

          {/* Confirmation */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground flex items-center gap-2">
              <Lock size={16} />
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                  if (errors.passwordConfirmation) setErrors({ ...errors, passwordConfirmation: "" });
                }}
                placeholder="Répétez le nouveau mot de passe"
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

          {/* Erreur générale */}
          {errors.general && (
            <div className="rounded-[var(--radius-button)] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Info */}
          <div className="rounded-[var(--radius-card)] border border-accent/30 bg-accent-light/30 p-4">
            <p className="text-xs text-accent">
              <strong>Note :</strong> Après la modification de votre mot de passe, vous serez déconnecté et devrez vous reconnecter avec votre nouveau mot de passe.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/profile"
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Modifier le mot de passe
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordContent />
    </ProtectedRoute>
  );
}
