import { NextRequest } from "next/server";

function getBackendBaseUrl(): string | null {
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || null;
}

async function handler(request: NextRequest, path: string[]) {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    return new Response(JSON.stringify({ detail: "API base URL is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const targetUrl = new URL(`${baseUrl.replace(/\/$/, "")}/${path.join("/")}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const passthroughHeaders = ["authorization", "content-type", "x-csrf-token", "cookie"];
  for (const key of passthroughHeaders) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method.toUpperCase());
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  // Handle redirects: rewrite internal backend URLs to go through proxy
  if ([301, 302, 307, 308].includes(upstream.status)) {
    const location = upstream.headers.get("location");
    if (location) {
      const normalizedBase = baseUrl.replace(/\/$/, "");
      // Internal backend redirect → rewrite through proxy
      if (location.startsWith(normalizedBase)) {
        const internalPath = location.slice(normalizedBase.length);
        const rewritten = `/api/proxy${internalPath}`;
        return new Response(null, {
          status: upstream.status,
          headers: { location: rewritten },
        });
      }
      // External redirect (OAuth providers etc.) → pass through as-is
      return new Response(null, {
        status: upstream.status,
        headers: { location },
      });
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: new Headers(upstream.headers),
  });
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context.params.path);
}
export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context.params.path);
}
export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context.params.path);
}
export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context.params.path);
}
export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context.params.path);
}
export async function OPTIONS(request: NextRequest, context: { params: { path: string[] } }) {
  return handler(request, context.params.path);
}

