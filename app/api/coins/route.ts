import { NextResponse } from 'next/server';
import { TRACKED_COINS } from '@/lib/types/coingecko';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const dynamic = 'force-dynamic';
export const revalidate = 10; // Revalidate every 10 seconds

export async function GET() {
  try {
    const coinIds = TRACKED_COINS.join(',');
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      {
        next: { revalidate: 10 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching coin prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin prices' },
      { status: 500 }
    );
  }
}
