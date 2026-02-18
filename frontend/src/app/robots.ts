import type { MetadataRoute } from "next";

/**
 * robots.ts — Contrôle d'accès des robots (Next.js App Router)
 *
 * Génère /robots.txt automatiquement à chaque build.
 * Permet le crawl des pages publiques, interdit les pages privées.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://roomshare.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/rooms/", "/map", "/terms", "/privacy", "/register", "/login"],
        disallow: [
          "/admin/",
          "/profile/",
          "/pro/",
          "/create",
          "/messages/",
          "/forgot-password",
          "/reset-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
