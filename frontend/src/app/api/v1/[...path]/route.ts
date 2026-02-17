import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all API proxy route handler.
 *
 * Proxifie toutes les requetes /api/v1/* vers le backend Laravel (Nginx Docker).
 * Elimine les problemes de CORS et de rewrites Turbopack.
 */

const BACKEND_URL = process.env.API_BACKEND_URL || "http://localhost";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now();
  try {
    const { path } = await params;
    const apiPath = path.join("/");
    const url = new URL(request.url);
    const targetUrl = `${BACKEND_URL}/api/v1/${apiPath}${url.search}`;

    console.log(`[API Proxy] ${request.method} ${targetUrl}`);

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

    const duration = Date.now() - startTime;
    console.log(`[API Proxy] Response ${response.status} in ${duration}ms`);

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
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[API Proxy] Erreur après ${duration}ms:`, errorMessage);
    
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

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
