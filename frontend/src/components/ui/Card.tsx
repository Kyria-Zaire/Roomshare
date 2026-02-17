interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Atome UI — Card container réutilisable.
 * Style : fond blanc, bordure subtile, radius Roomshare.
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}
