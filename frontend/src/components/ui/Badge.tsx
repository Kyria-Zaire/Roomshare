interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "muted";
  className?: string;
}

const variants = {
  default: "bg-primary text-primary-foreground",
  accent: "bg-accent-light text-accent",
  success: "bg-emerald-50 text-success",
  muted: "bg-muted text-muted-foreground",
};

/**
 * Atome UI — Badge / Tag pour les propriétés (meublé, wifi, etc.)
 */
export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
