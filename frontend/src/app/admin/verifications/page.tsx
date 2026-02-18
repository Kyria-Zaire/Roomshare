"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import apiClient from "@/lib/apiClient";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  verification_status: string;
  identity_document_path: string | null;
  residence_document_path: string | null;
  submitted_at: string | null;
}

function AdminVerificationsContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchPending();
  }, [user?.role]);

  async function fetchPending() {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: PendingUser[] }>(
        "/admin/verifications"
      );
      setUsers(res.data.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function approve(id: string) {
    setProcessing(id);
    try {
      await apiClient.post(`/admin/verifications/${id}/approve`);
      showToast("Demande approuvée. L'utilisateur est désormais propriétaire.", true);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      showToast("Erreur lors de l'approbation.", false);
    } finally {
      setProcessing(null);
    }
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) return;
    setProcessing(id);
    try {
      await apiClient.post(`/admin/verifications/${id}/reject`, { reason: rejectReason });
      showToast("Demande rejetée.", true);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setRejectTarget(null);
      setRejectReason("");
    } catch {
      showToast("Erreur lors du rejet.", false);
    } finally {
      setProcessing(null);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Réservé aux administrateurs.</p>
        <Link href="/" className="mt-4 inline-block text-accent hover:underline">
          Accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-[var(--radius-card)] px-5 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? "bg-accent text-white" : "bg-destructive text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={18} />
              Accueil
            </Link>
            <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground">
              Admin
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Vérifications d&apos;identité</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Chargement…" : `${users.length} demande(s) en attente`}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-muted" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-12 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-accent" />
            <p className="font-medium text-foreground">Aucune demande en attente</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Toutes les demandes ont été traitées.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-[var(--radius-card)] border border-border bg-background p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Info utilisateur */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {u.submitted_at && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          Soumis le {new Date(u.submitted_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(u.id)}
                      disabled={processing === u.id}
                      className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      Approuver
                    </button>
                    <button
                      onClick={() => {
                        setRejectTarget(u.id);
                        setRejectReason("");
                      }}
                      disabled={processing === u.id}
                      className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Rejeter
                    </button>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {u.identity_document_path && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      📄 Pièce d&apos;identité soumise
                    </span>
                  )}
                  {u.residence_document_path && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      🏠 Justificatif de domicile soumis
                    </span>
                  )}
                </div>

                {/* Reject reason form (inline) */}
                {rejectTarget === u.id && (
                  <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Motif du rejet <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Expliquer la raison du rejet (ex: document illisible, pièce expirée…)"
                      className="w-full resize-none rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => reject(u.id)}
                        disabled={!rejectReason.trim() || processing === u.id}
                        className="rounded-[var(--radius-button)] bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-50"
                      >
                        Confirmer le rejet
                      </button>
                      <button
                        onClick={() => setRejectTarget(null)}
                        className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function AdminVerificationsPage() {
  return (
    <ProtectedRoute>
      <AdminVerificationsContent />
    </ProtectedRoute>
  );
}
