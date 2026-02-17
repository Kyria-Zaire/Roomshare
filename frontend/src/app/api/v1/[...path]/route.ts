import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all API proxy route handler — Infrastructure Layer.
 *
 * Ce fichier est volontairement un proxy d'infrastructure, pas une couche métier.
 * Il proxifie toutes les requêtes /api/v1/* vers le backend Laravel (Nginx/Docker)
 * afin d'éliminer les problèmes de CORS et les bugs de rewrite Turbopack.
 *
 * Pattern : Next.js API Route as reverse-proxy (documented pattern).
 * Toute logique métier appartient au backend Laravel — jamais ici.
 * Les 5 exports HTTP (GET/POST/PUT/DELETE/PATCH) sont requis par Next.js
 * pour que le catch-all route handler intercepte toutes les méthodes HTTP.
 */

const BACKEND_URL = process.env.API_BACKEND_URL || "http://localhost";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const apiPath = path.join("/");
    const url = new URL(request.url);
    const targetUrl = `${BACKEND_URL}/api/v1/${apiPath}${url.search}`;

    // Forward headers (sauf host)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });
    headers.set("Accept", "application/json");

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
      // Timeout pour eviter les blocages
      signal: AbortSignal.timeout(30000),
    });

    // Forward la reponse du backend
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Retourner une erreur JSON valide pour Axios
    return NextResponse.json(
      {
        success: false,
        message: errorMessage.includes("timeout")
          ? "Le backend met trop de temps à répondre."
          : "Backend non disponible.",
        error: errorMessage,
      },
      { status: 502 }
    );
  }
}

// Next.js HTTP method handlers — tous nécessaires pour le proxy catch-all
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
