"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { usePassModal } from "@/lib/passModalContext";
import { createCheckoutSession, type PlanType } from "@/lib/stripeService";
import { toast } from "sonner";

const ROOMSHARE_GREEN = "#0E583D";

export const PASS_OFFERS = [
  { id: "pass_day", label: "Pass Jour", price: 0.99, duration: "24h", recommended: false },
  { id: "pass_week", label: "Pass Semaine", price: 3.99, duration: "7 jours", recommended: true },
  { id: "pass_month", label: "Pass Mensuel", price: 9.99, duration: "30 jours", recommended: false },
] as const;

interface PassPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  /** Message optionnel (ex. FOMO pour annonce Early Access) */
  message?: string;
}

export function PassPurchaseModal({ open, onClose, message }: PassPurchaseModalProps) {
  const { setPassModalOpen } = usePassModal();
  const [selectedId, setSelectedId] = useState<string>(PASS_OFFERS[1].id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPassModalOpen(open);
    return () => setPassModalOpen(false);
  }, [open, setPassModalOpen]);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession(selectedId as PlanType);
      if (url) {
        toast.success("Redirection vers le paiement...");
        window.location.href = url;
        return;
      }
      toast.error("Impossible de créer la session de paiement.");
    } catch (err) {
      console.error("[PassPurchaseModal] createCheckoutSession error:", err);
      toast.error("Erreur lors de la préparation du paiement.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">
            Roomshare Pass
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {message && (
            <p className="mb-4 rounded-lg bg-accent/10 px-4 py-3 text-sm text-foreground">
              {message}
            </p>
          )}
          <p className="mb-4 text-sm text-muted-foreground">
            Accédez aux coordonnées des annonces de moins de 24h et contactez les propriétaires en priorité.
          </p>

          <div className="space-y-2">
            {PASS_OFFERS.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => setSelectedId(offer.id)}
                className={`flex w-full items-center justify-between rounded-[var(--radius-button)] border-2 px-4 py-3 text-left transition-all ${
                  selectedId === offer.id
                    ? "border-accent bg-accent/5"
                    : "border-border bg-background hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      selectedId === offer.id ? "border-accent bg-accent" : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-foreground">{offer.label}</span>
                    <span className="ml-2 text-sm text-muted-foreground">({offer.duration})</span>
                  </div>
                  {offer.recommended && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: ROOMSHARE_GREEN }}
                    >
                      Recommandé
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-foreground">{offer.price.toFixed(2)} €</span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handlePurchase}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Redirection...</span>
                </>
              ) : (
                "Acheter"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
