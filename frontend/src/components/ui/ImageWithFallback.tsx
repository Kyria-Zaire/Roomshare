"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Home } from "lucide-react";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackClassName?: string;
}

/**
 * Wrapper next/image — affiche un placeholder SVG si l'image échoue.
 */
export function ImageWithFallback({
  fallbackClassName = "",
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${fallbackClassName}`}
      >
        <Home size={32} className="text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}
