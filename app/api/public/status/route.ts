import { NextResponse } from "next/server";

export async function GET() {
    const now = new Date();

    const data = {
        priceUpdate: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2분 전
        newsUpdate: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5분 전
        aiUpdate: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15분 전
        status: "operational",
    };

    return NextResponse.json(data);
}
