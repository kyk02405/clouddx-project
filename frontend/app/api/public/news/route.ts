import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


function getBackendBaseUrl(): string | null {
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || null;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(diffMins, 0)}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "5";

    const backendUrl = getBackendBaseUrl();
    if (!backendUrl) {
      return NextResponse.json({ detail: "Backend API base URL is not configured" }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/api/v1/news?page=${page}&limit=${limit}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ detail: "Failed to fetch news from backend" }, { status: response.status });
    }

    const data = await response.json();
    const formattedAll = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.content && item.content.length > 150 ? `${item.content.substring(0, 150)}...` : item.content,
      time: formatTime(item.published_at),
      category: item.section || "general",
      source: item.source,
      url: item.url,
      content: item.content,
    }));

    return NextResponse.json({
      all: formattedAll,
      myAssets: [],
      pagination: {
        total: data.total ?? 0,
        page: data.page ?? Number(page),
        limit: data.limit ?? Number(limit),
        totalPages: data.total_pages ?? 0,
      },
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { all: [], myAssets: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } },
      { status: 500 }
    );
  }
}

