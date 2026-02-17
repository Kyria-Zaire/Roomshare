import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-6xl font-bold text-muted-foreground/30">404</span>
      <div>
        <h1 className="text-xl font-bold text-foreground">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-gray-800"
      >
        <ArrowLeft size={16} />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
