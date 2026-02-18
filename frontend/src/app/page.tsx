import HomeClient from "./HomeClient";
import type { Room } from "@/types/room";

/**
 * HomePage — Server Component (SSR/ISR).
 *
 * Pré-charge les 10 premières annonces côté serveur pour que Googlebot
 * et les autres crawlers voient le contenu sans exécuter de JavaScript.
 * Le composant client HomeClient prend le relais pour l'interactivité.
 *
 * Revalidation toutes les 60 s (ISR) : le contenu reste frais sans rebuild.
 */
export const revalidate = 60;

async function fetchInitialRooms(): Promise<Room[]> {
  try {
    // NEXT_INTERNAL_API_URL permet d'appeler nginx directement depuis le conteneur
    // (évite le round-trip public internet en dev Docker)
    const apiUrl =
      process.env.NEXT_INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://nginx/api/v1";

    const res = await fetch(`${apiUrl}/rooms`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.data ?? []).slice(0, 10) as Room[];
  } catch {
    // En cas d'erreur réseau, on rend la page sans données SSR.
    // Le client prend le relais et charge les annonces normalement.
    return [];
  }
}

export default async function HomePage() {
  const initialRooms = await fetchInitialRooms();

  return <HomeClient initialRooms={initialRooms} />;
}
