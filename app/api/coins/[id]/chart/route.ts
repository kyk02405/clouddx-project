import { NextResponse } from 'next/server';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Chart data changes less frequently

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch 7 days of market chart data
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`,
      {
        next: { revalidate: 60 },
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error for ${id}: ${response.status} ${response.statusText}`);
      
      // Return empty data instead of throwing
      return NextResponse.json({
        prices: [],
        market_caps: [],
        total_volumes: [],
      });
    }

    const data = await response.json();

    // Validate data structure
    if (!data.prices || !Array.isArray(data.prices)) {
      console.error(`Invalid data structure for ${id}`);
      return NextResponse.json({
        prices: [],
        market_caps: [],
        total_volumes: [],
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    
    // Return empty data instead of error response
    return NextResponse.json({
      prices: [],
      market_caps: [],
      total_volumes: [],
    });
  }
}
