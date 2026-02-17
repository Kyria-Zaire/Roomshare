"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Logo } from "@/components/ui/Logo";
import { Loader2, AlertCircle, Eye, EyeOff, Search, Home, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type UserRole = "tenant" | "owner";

/** Formate un numéro français au fur et à mesure : 06 12 34 56 78 */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.startsWith("33")) {
    const rest = digits.slice(2);
    if (rest.length <= 1) return rest ? `+33 ${rest}` : "+33 ";
    return `+33 ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 8)} ${rest.slice(8, 10)}`.trim();
  }
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`.trim();
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedRole) {
      newErrors.role = "Veuillez sélectionner un profil";
    }

    if (!name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide";
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

    if (!termsAccepted) {
      newErrors.termsAccepted = "Vous devez accepter les conditions générales";
    }

    if (!privacyAccepted) {
      newErrors.privacyAccepted = "Vous devez accepter la politique de confidentialité";
    }

    if (selectedRole === "owner") {
      const digitsOnly = phone.replace(/\D/g, "");
      if (!phone.trim()) {
        newErrors.phone = "Le téléphone est requis pour les propriétaires";
      } else if (digitsOnly.length < 10) {
        newErrors.phone = "Numéro invalide (au moins 10 chiffres)";
      }
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
      const phoneToSend = selectedRole === "owner" ? phone : undefined;
      await register(name, email, password, selectedRole!, termsAccepted, privacyAccepted, phoneToSend);
      toast.success("Compte créé avec succès !");
      if (selectedRole === "owner") {
        router.push("/profile/become-owner");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> }; status?: number };
      };

      // Gérer les erreurs de validation du backend (422)
      if (axiosErr.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(axiosErr.response.data.errors).forEach(([key, messages]) => {
          backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(backendErrors);
      } else {
        const msg = axiosErr.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.";
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size={80} />
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Créer un compte</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Sélection de profil */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-foreground">Choisissez votre profil</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Profil Étudiant/Pro */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("tenant");
                  if (errors.role) setErrors({ ...errors, role: "" });
                }}
                className={`group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all ${
                  selectedRole === "tenant"
                    ? "border-accent bg-accent/5 shadow-md"
                    : "border-border bg-background hover:border-foreground/20"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                    selectedRole === "tenant" ? "bg-accent text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <Search size={32} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Je cherche</p>
                  <p className="text-xs text-muted-foreground">une colocation</p>
                </div>
                {selectedRole === "tenant" && (
                  <div className="absolute right-2 top-2">
                    <CheckCircle2 size={20} className="text-accent" />
                  </div>
                )}
              </button>

              {/* Profil Propriétaire */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("owner");
                  if (errors.role) setErrors({ ...errors, role: "" });
                }}
                className={`group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all ${
                  selectedRole === "owner"
                    ? "border-accent bg-accent/5 shadow-md"
                    : "border-border bg-background hover:border-foreground/20"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                    selectedRole === "owner" ? "bg-accent text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <Home size={32} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Je propose</p>
                  <p className="text-xs text-muted-foreground">un logement</p>
                </div>
                {selectedRole === "owner" && (
                  <div className="absolute right-2 top-2">
                    <CheckCircle2 size={20} className="text-accent" />
                  </div>
                )}
              </button>
            </div>
            {errors.role && (
              <p className="mt-2 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.role}
              </p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Votre nom"
              className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 text-sm outline-none transition-colors ${
                errors.name
                  ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                  : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
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

          {/* Téléphone (propriétaire uniquement) */}
          {selectedRole === "owner" && (
            <div style={{ animation: "fadeIn 0.3s ease-out both" }}>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Téléphone <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhoneInput(e.target.value));
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                placeholder="06 12 34 56 78"
                autoComplete="tel"
                className={`w-full rounded-[var(--radius-button)] border bg-background px-4 py-3 text-sm outline-none transition-colors ${
                  errors.phone
                    ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.phone}
                </p>
              )}
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Mot de passe</label>
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

          {/* Confirmation mot de passe */}
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

          {/* Erreur générale */}
          {errors.general && (
            <div className="rounded-[var(--radius-button)] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Bouton d'inscription */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-accent py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {selectedRole === "owner" ? "Commencer l'aventure" : "Créer mon compte"}
          </button>
          {selectedRole === "owner" && (
            <p className="text-center text-xs text-muted-foreground">
              Vos coordonnées ne sont partagées qu&apos;après confirmation d&apos;une réservation.
            </p>
          )}

          {/* Checkboxes RGPD */}
          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: "" });
                }}
                className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
              />
              <span className="text-xs text-muted-foreground">
                J'accepte les{" "}
                <Link href="/terms" className="text-accent hover:underline">
                  conditions générales d'utilisation
                </Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="ml-7 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.termsAccepted}
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => {
                  setPrivacyAccepted(e.target.checked);
                  if (errors.privacyAccepted) setErrors({ ...errors, privacyAccepted: "" });
                }}
                className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
              />
              <span className="text-xs text-muted-foreground">
                J'accepte la{" "}
                <Link href="/privacy" className="text-accent hover:underline">
                  politique de confidentialité
                </Link>
              </span>
            </label>
            {errors.privacyAccepted && (
              <p className="ml-7 text-xs text-error flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.privacyAccepted}
              </p>
            )}
          </div>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
