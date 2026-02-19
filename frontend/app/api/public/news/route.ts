import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BackendNewsItem = {
  id?: string;
  title?: string;
  content?: string;
  source?: string;
  section?: string;
  url?: string;
  published_at?: string;
};

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function mapNewsItem(item: BackendNewsItem) {
  const content = item.content || "";
  return {
    id: item.id || "",
    title: item.title || "",
    summary: content.length > 150 ? `${content.substring(0, 150)}...` : content,
    time: formatTime(item.published_at || ""),
    category: item.section || "general",
    source: item.source || "unknown",
    url: item.url,
    content,
  };
}

function getPassthroughHeaders(request: Request): Headers {
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");

  if (auth) headers.set("authorization", auth);
  if (cookie) headers.set("cookie", cookie);

  return headers;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "5";
    const query = searchParams.get("query") || "";
    const mode = searchParams.get("mode") || "latest";

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 5));

    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://backend:8000";
    const requestHeaders = getPassthroughHeaders(request);

    let upstreamUrl: string;
    if (mode === "recommended") {
      upstreamUrl = `${backendUrl}/api/v1/news/recommended?limit=${safeLimit}`;
    } else {
      upstreamUrl = `${backendUrl}/api/v1/news?page=${safePage}&limit=${safeLimit}`;
      if (query) {
        upstreamUrl += `&query=${encodeURIComponent(query)}`;
      }
    }

    let usedFallbackFeed = false;
    let response = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: requestHeaders,
    });

    if (!response.ok && mode === "recommended") {
      usedFallbackFeed = true;
      response = await fetch(`${backendUrl}/api/v1/news?page=1&limit=${safeLimit}`, {
        cache: "no-store",
      });
    }

    if (!response.ok) {
      throw new Error("Failed to fetch news from backend");
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const formattedAll = items.map((item: BackendNewsItem) => mapNewsItem(item));

    const recommendedResponse = mode === "recommended" && !usedFallbackFeed;

    const pagination = recommendedResponse
      ? {
          total: formattedAll.length,
          page: 1,
          limit: safeLimit,
          totalPages: formattedAll.length > 0 ? 1 : 0,
        }
      : {
          total: Number(data?.total ?? formattedAll.length),
          page: Number(data?.page ?? safePage),
          limit: Number(data?.limit ?? safeLimit),
          totalPages: Number(data?.total_pages ?? (formattedAll.length > 0 ? 1 : 0)),
        };

    return NextResponse.json({
      all: formattedAll,
      myAssets: recommendedResponse ? formattedAll : [],
      pagination,
      recommended: {
        assets:
          recommendedResponse && Array.isArray(data?.recommended_assets)
            ? data.recommended_assets
            : [],
        keywords:
          recommendedResponse && Array.isArray(data?.recommended_keywords)
            ? data.recommended_keywords
            : [],
        isFallback:
          recommendedResponse && typeof data?.is_fallback === "boolean"
            ? data.is_fallback
            : usedFallbackFeed,
      },
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      {
        all: [],
        myAssets: [],
        pagination: { total: 0, page: 1, limit: 5, totalPages: 0 },
        recommended: { assets: [], keywords: [], isFallback: true },
      },
      { status: 500 }
    );
  }
}
