import type { Metadata } from "next";
import RoomDetailClient from "./RoomDetailClient";

const BACKEND_URL = process.env.API_BACKEND_URL || "http://localhost";

async function fetchRoom(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/rooms/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const room = await fetchRoom(id);

  if (!room) {
    return { title: "Annonce — Roomshare" };
  }

  const title = `${room.title} — ${room.budget}\u20AC/mois | Roomshare`;
  const description =
    room.description?.substring(0, 160) ||
    `Colocation \u00E0 ${room.address?.city} — ${room.budget}\u20AC/mois`;

  return {
    title,
    description,
    openGraph: {
      title: `${room.title} — ${room.budget}\u20AC/mois`,
      description,
      images: room.images?.[0] ? [{ url: room.images[0] }] : [],
      type: "website",
      locale: "fr_FR",
    },
  };
}

export default function RoomPage() {
  return <RoomDetailClient />;
}
