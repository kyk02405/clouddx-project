import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '5';
        const query = searchParams.get('query') || '';

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        let url = `${backendUrl}/api/v1/news/?page=${page}&limit=${limit}`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }

        const response = await fetch(url, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error("Failed to fetch news from backend");
        }

        const data = await response.json();

        // format time helper
        const formatTime = (dateStr: string) => {
            try {
                const date = new Date(dateStr);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / 60000);

                if (diffMins < 60) return `${diffMins}분 전`;
                const diffHours = Math.floor(diffMins / 60);
                if (diffHours < 24) return `${diffHours}시간 전`;
                return date.toLocaleDateString();
            } catch (e) {
                return dateStr;
            }
        };

        // Map Backend Schema to Frontend Schema
        const formattedAll = data.items.map((item: any, index: number) => ({
            id: item.id,
            title: item.title,
            summary: item.content && item.content.length > 150 ? item.content.substring(0, 150) + "..." : item.content,
            time: formatTime(item.published_at),
            category: item.section || "일반",
            source: item.source,
            url: item.url,
            content: item.content
        }));

        return NextResponse.json({
            all: formattedAll,
            myAssets: [],
            pagination: {
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: data.total_pages
            }
        });
    } catch (error) {
        console.error("News fetch error:", error);
        return NextResponse.json({ all: [], myAssets: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } }, { status: 500 });
    }
}
