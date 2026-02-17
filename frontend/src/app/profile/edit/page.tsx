"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, AlertCircle, User, Mail } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";

function EditProfileContent() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide";
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

    // Vérifier si des changements ont été faits
    if (name === user?.name && email === user?.email) {
      toast.info("Aucune modification détectée");
      return;
    }

    setLoading(true);

    try {
      await updateProfile({ name, email });
      toast.success("Profil mis à jour avec succès !");
      router.push("/profile");
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
              <h1 className="text-lg font-semibold text-foreground">Modifier le profil</h1>
              <p className="text-xs text-muted-foreground">Mettez à jour vos informations personnelles</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground flex items-center gap-2">
              <User size={16} />
              Nom complet
            </label>
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
            <label className="mb-2 block text-sm font-medium text-foreground flex items-center gap-2">
              <Mail size={16} />
              Adresse email
            </label>
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

          {/* Erreur générale */}
          {errors.general && (
            <div className="rounded-[var(--radius-button)] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

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
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditProfileContent />
    </ProtectedRoute>
  );
}
