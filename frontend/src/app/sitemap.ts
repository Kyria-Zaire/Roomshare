import type { MetadataRoute } from "next";

/**
 * sitemap.ts — Sitemap dynamique (Next.js App Router)
 *
 * Génère /sitemap.xml en combinant routes statiques + toutes les annonces actives.
 * Revalidé toutes les heures pour refléter les nouvelles annonces.
 */
export const revalidate = 3600; // 1h

interface RoomEntry {
  id?: string;
  _id?: string;
  updated_at?: string;
  status?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://roomshare.app";

  // Routes statiques indexables
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Routes dynamiques : toutes les annonces actives
  try {
    // En Docker : utiliser l'URL interne du réseau (nginx) pour éviter le round-trip réseau
    const internalApiUrl =
      process.env.NEXT_INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://nginx/api/v1";

    const res = await fetch(`${internalApiUrl}/rooms`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return staticRoutes;

    const json = await res.json();
    const rooms: RoomEntry[] = json.data ?? [];

    const roomRoutes: MetadataRoute.Sitemap = rooms
      .filter((room) => room.status === "active" || room.status === undefined)
      .map((room) => ({
        url: `${siteUrl}/rooms/${room.id ?? room._id}`,
        lastModified: room.updated_at ? new Date(room.updated_at) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      }));

    return [...staticRoutes, ...roomRoutes];
  } catch {
    // Si le backend est indisponible, on renvoie au moins les routes statiques
    return staticRoutes;
  }
}
