"use client";

import { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Bell,
  Lock,
  Download,
  LogOut,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { PassPurchaseModal } from "./PassPurchaseModal";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { userService, type UserSettings } from "@/lib/userService";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SettingsSection() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyAnnonces, setNotifyAnnonces] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const isDirty =
    name !== (settings?.name ?? "") ||
    email !== (settings?.email ?? "") ||
    bio !== (settings?.bio ?? "") ||
    phone !== (settings?.phone ?? "");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await userService.getSettings();
        const d = res.data;
        setSettings(d);
        setName(d.name ?? "");
        setEmail(d.email ?? "");
        setBio(d.bio ?? "");
        setPhone(d.phone ?? "");
        setNotifyMessages(d.notify_messages ?? true);
        setNotifyAnnonces(d.notify_annonces ?? true);
        setAvatarUrl(d.avatar_url ?? null);
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger les paramètres.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveProfile = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await userService.updateProfile({ name, email, bio, phone });
      toast.success("Modifications enregistrées.");
      const res = await userService.getSettings();
      setSettings(res.data);
      setAvatarUrl(res.data.avatar_url ?? null);
      await refreshUser?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleNotifyToggle = async (key: "notify_messages" | "notify_annonces", value: boolean) => {
    if (key === "notify_messages") setNotifyMessages(value);
    else setNotifyAnnonces(value);
    setNotifySaving(true);
    try {
      await userService.updateSettings({ [key]: value });
      toast.success("Préférence enregistrée.");
    } catch {
      if (key === "notify_messages") setNotifyMessages(!value);
      else setNotifyAnnonces(!value);
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setNotifySaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      setAvatarUrl(res.data.avatar_url);
      toast.success("Photo de profil mise à jour.");
      await refreshUser?.();
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setAvatarUploading(false);
    }
    e.target.value = "";
  };

  const handleExport = async () => {
    try {
      const res = await userService.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `roomshare-donnees-${user?.id ?? "export"}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Export téléchargé.");
    } catch {
      toast.error("Impossible d'exporter les données.");
    }
  };

  const emailValid = !emailTouched || emailRegex.test(email);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Paramètres</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos préférences et votre compte
        </p>
      </div>

      {/* ─── Mon Profil ─────────────────────────────────────── */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <User size={18} className="text-accent" />
          Mon Profil
        </h3>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="flex h-24 w-24 overflow-hidden rounded-full border-2 border-accent/30 bg-muted transition hover:border-accent"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={32} className="text-muted-foreground" />
                </div>
              )}
            </button>
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                <span className="text-xs font-medium">...</span>
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Upload size={12} />
              <span>Cliquer pour changer</span>
            </div>
          </div>
          <div className="flex-1">
            {settings?.verification_status === "verified" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                <CheckCircle2 size={14} />
                Vérifié
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─── Roomshare Pass ─────────────────────────────────── */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Roomshare Pass
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {user?.pass_expires_at && new Date(user.pass_expires_at) > new Date() ? (
              <p className="text-sm text-foreground">
                Pass actif jusqu&apos;au{" "}
                <strong>
                  {new Date(user.pass_expires_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Accédez aux annonces récentes et aux coordonnées des propriétaires.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPassModalOpen(true)}
            className="shrink-0 rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            {user?.pass_expires_at && new Date(user.pass_expires_at) > new Date()
              ? "Renouveler ou changer"
              : "Acheter un Pass"}
          </button>
        </div>
      </section>

      {/* ─── Coordonnées ────────────────────────────────────── */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail size={18} className="text-accent" />
          Coordonnées
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={`w-full rounded-[var(--radius-button)] border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                !emailValid ? "border-error" : "border-border bg-background focus:border-accent"
              }`}
              placeholder="email@exemple.fr"
            />
            {!emailValid && (
              <p className="mt-1 text-xs text-error">Adresse email invalide.</p>
            )}
            {emailTouched && email !== settings?.email && emailValid && (
              <p className="mt-2 text-xs text-amber-600">
                Un lien de confirmation vous sera envoyé.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Phone size={12} /> Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="06 12 34 56 78"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Bio (optionnel)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-button)] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Quelques mots sur vous..."
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/500</p>
          </div>
        </div>
      </section>

      {/* ─── Notifications ──────────────────────────────────── */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bell size={18} className="text-accent" />
          Notifications
        </h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">Messages</span>
              <p className="text-xs text-muted-foreground">
                Recevoir des notifications pour les nouveaux messages
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyMessages}
              onChange={(e) => handleNotifyToggle("notify_messages", e.target.checked)}
              disabled={notifySaving}
              className="h-5 w-5 rounded accent-accent"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">Annonces</span>
              <p className="text-xs text-muted-foreground">
                Notifications pour vos annonces publiées
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyAnnonces}
              onChange={(e) => handleNotifyToggle("notify_annonces", e.target.checked)}
              disabled={notifySaving}
              className="h-5 w-5 rounded accent-accent"
            />
          </label>
        </div>
      </section>

      {/* ─── Sécurité ───────────────────────────────────────── */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock size={18} className="text-accent" />
          Sécurité
        </h3>
        <button
          type="button"
          onClick={() => setPasswordModalOpen(true)}
          className="flex w-full items-center justify-between rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <span>Changer le mot de passe</span>
          <Lock size={16} className="text-muted-foreground" />
        </button>
      </section>

      {/* ─── Compte (Export RGPD + Déconnexion) ──────────────── */}
      <section className="rounded-[var(--radius-card)] border border-border bg-background p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Compte</h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full items-center justify-between rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <span>Exporter mes données</span>
            <Download size={16} className="text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              toast.success("Déconnexion réussie");
              router.push("/login");
            }}
            className="flex w-full items-center justify-between rounded-[var(--radius-button)] border border-error/30 bg-error/5 px-4 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/10"
          >
            <span>Se déconnecter</span>
            <LogOut size={16} />
          </button>
        </div>
      </section>

      {/* ─── Bouton Enregistrer sticky ─────────────────────── */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving || !emailValid}
              className="w-full rounded-[var(--radius-button)] bg-accent py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Modale Changer mot de passe ────────────────────── */}
      {passwordModalOpen && (
        <PasswordModal
          onClose={() => setPasswordModalOpen(false)}
          onSuccess={() => {
            setPasswordModalOpen(false);
            toast.success("Mot de passe modifié. Veuillez vous reconnecter.");
            logout();
            router.push("/login");
          }}
        />
      )}

      <PassPurchaseModal
        open={passModalOpen}
        onClose={() => setPassModalOpen(false)}
      />
    </div>
  );
}

function PasswordModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put("/auth/password", {
        current_password: current,
        password,
        password_confirmation: confirm,
      });
      onSuccess();
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(res?.message ?? "Erreur lors du changement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-background p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">Changer le mot de passe</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-[var(--radius-button)] bg-accent py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
            >
              {saving ? "Envoi..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
