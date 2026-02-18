import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Home } from "lucide-react";

/**
 * Page 404 — Not Found
 *
 * Affichée automatiquement par Next.js App Router pour toutes les routes inexistantes.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pb-20 text-center">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Logo size={56} />
        <span className="text-2xl font-bold tracking-tight text-foreground">
          room<span className="text-accent">share</span>
        </span>
      </Link>

      {/* Code 404 stylisé */}
      <p className="mb-2 select-none text-[6rem] font-black leading-none tracking-tighter text-foreground/10">
        404
      </p>

      {/* Message principal */}
      <h1 className="mb-3 text-2xl font-bold text-foreground">
        Cette page est introuvable
      </h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
        La colocation que vous cherchez a peut-être été louée, ou l&apos;adresse a
        changé. Pas de panique — des dizaines d&apos;annonces vous attendent&nbsp;!
      </p>

      {/* CTA */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90"
      >
        <Home size={16} />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
