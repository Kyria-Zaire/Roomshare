"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

/**
 * Configuration Laravel Echo — Se connecte à Reverb (WebSocket).
 *
 * Reverb est Pusher-compatible, donc on utilise le driver pusher-js.
 * En production : passer en wss:// et pointer vers le bon host.
 */

// Exposer Pusher globalement (requis par Laravel Echo)
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).Pusher = Pusher;
}

let echoInstance: Echo<"pusher"> | null = null;

export function getEcho(): Echo<"pusher"> {
  if (typeof window === "undefined") {
    throw new Error("Echo ne peut être utilisé que côté client.");
  }

  if (!echoInstance) {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("roomshare_token") : null;
    echoInstance = new Echo({
      broadcaster: "pusher",
      key: process.env.NEXT_PUBLIC_REVERB_KEY || "roomshare-key",
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || "localhost",
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080,
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080,
      // forceTLS piloté par NEXT_PUBLIC_REVERB_SCHEME (http → false, https → true)
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || "http") === "https",
      enabledTransports: ["ws", "wss"],
      disableStats: true,
      cluster: "mt1",
      authEndpoint: "/api/v1/broadcasting/auth",
      auth: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });

    // Debug : expose l'instance dans la console navigateur (à retirer en prod)
    // Usage : window.Echo.connector.pusher.connection.state
    (window as unknown as Record<string, unknown>).Echo = echoInstance;
  }

  return echoInstance;
}

export default getEcho;
