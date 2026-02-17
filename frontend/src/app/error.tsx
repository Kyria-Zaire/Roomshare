"use client";

import { ArrowLeft, AlertTriangle } from "lucide-react";

const ERROR_ICON_SIZE = 40;

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <AlertTriangle size={ERROR_ICON_SIZE} className="text-muted-foreground" />
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft size={16} />
          Accueil
        </button>
        <button
          onClick={reset}
          className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-gray-800"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
