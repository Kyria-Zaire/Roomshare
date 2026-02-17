import Image from "next/image";

/**
 * Logo Roomshare — Image officielle (PNG).
 * Utilisé dans le splash screen et le header.
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 48, className = "" }: LogoProps) {
  return (
    <Image
      src="/images/Roomshare.png"
      alt="Roomshare Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
