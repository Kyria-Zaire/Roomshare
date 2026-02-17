"use client";

interface SkeletonProps {
  className?: string;
}

/**
 * Atome UI — Skeleton placeholder avec animation shimmer.
 * Utilisé pour le loading state (Mobile-first UX).
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}
