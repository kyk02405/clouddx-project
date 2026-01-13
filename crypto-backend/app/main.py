import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from app.binance_client import BinanceClient
from app.websocket_manager import ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crypto symbols to track (50 major coins)
SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT", "MATICUSDT",
    "UNIUSDT", "LTCUSDT", "ATOMUSDT", "ETCUSDT", "XLMUSDT",
    "ALGOUSDT", "VETUSDT", "FILUSDT", "TRXUSDT", "ICPUSDT",
    "APTUSDT", "NEARUSDT", "ARBUSDT", "OPUSDT", "INJUSDT",
    "SUIUSDT", "STXUSDT", "RNDRUSDT", "IMXUSDT", "TIAUSDT",
    "SEIUSDT", "TAOUSDT", "WLDUSDT", "FTMUSDT", "AAVEUSDT",
    "MKRUSDT", "GRTUSDT", "SANDUSDT", "MANAUSDT", "AXSUSDT",
    "THETAUSDT", "FLOWUSDT", "EGLDUSDT", "XTZUSDT", "EOSUSDT",
    "KSMUSDT", "ARUSDT", "CHZUSDT", "ENJUSDT", "ZILUSDT"
]


binance_client = BinanceClient(SYMBOLS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Binance WebSocket client...")
    asyncio.create_task(binance_client.connect())
    asyncio.create_task(price_broadcaster())
    yield
    # Shutdown
    logger.info("Shutting down Binance WebSocket client...")
    await binance_client.stop()


app = FastAPI(lifespan=lifespan)

# CORS middleware for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def price_broadcaster():
    """Background task to broadcast Binance prices to all clients"""
    queue = asyncio.Queue()
    binance_client.subscribe(queue)

    try:
        while True:
            price_data = await queue.get()
            await ws_manager.broadcast(price_data)
    except Exception as e:
        logger.error(f"Error in price broadcaster: {e}")
    finally:
        binance_client.unsubscribe(queue)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_connections": len(ws_manager.active_connections),
        "symbols": SYMBOLS,
    }


@app.get("/api/coins")
async def get_coins():
    """코인 메타데이터 반환 (프론트엔드 UI용)"""
    # 모든 50개 코인에 대한 메타데이터
    coin_info = {
        "BTCUSDT": {"name": "Bitcoin", "icon": "₿", "color": "#F7931A"},
        "ETHUSDT": {"name": "Ethereum", "icon": "Ξ", "color": "#627EEA"},
        "BNBUSDT": {"name": "BNB", "icon": "◆", "color": "#F3BA2F"},
        "SOLUSDT": {"name": "Solana", "icon": "◎", "color": "#14F195"},
        "XRPUSDT": {"name": "Ripple", "icon": "✕", "color": "#23292F"},
        "ADAUSDT": {"name": "Cardano", "icon": "₳", "color": "#0033AD"},
        "AVAXUSDT": {"name": "Avalanche", "icon": "▲", "color": "#E84142"},
        "DOTUSDT": {"name": "Polkadot", "icon": "●", "color": "#E6007A"},
        "LINKUSDT": {"name": "Chainlink", "icon": "⬡", "color": "#2A5ADA"},
        "MATICUSDT": {"name": "Polygon", "icon": "⬢", "color": "#8247E5"},
        "UNIUSDT": {"name": "Uniswap", "icon": "🦄", "color": "#FF007A"},
        "LTCUSDT": {"name": "Litecoin", "icon": "Ł", "color": "#345D9D"},
        "ATOMUSDT": {"name": "Cosmos", "icon": "⚛", "color": "#2E3148"},
        "ETCUSDT": {"name": "Ethereum Classic", "icon": "⟠", "color": "#328332"},
        "XLMUSDT": {"name": "Stellar", "icon": "*", "color": "#000000"},
        "ALGOUSDT": {"name": "Algorand", "icon": "▲", "color": "#000000"},
        "VETUSDT": {"name": "VeChain", "icon": "V", "color": "#15BDFF"},
        "FILUSDT": {"name": "Filecoin", "icon": "⨎", "color": "#0090FF"},
        "TRXUSDT": {"name": "Tron", "icon": "∎", "color": "#EB0029"},
        "ICPUSDT": {"name": "Internet Computer", "icon": "∞", "color": "#29ABE2"},
        "APTUSDT": {"name": "Aptos", "icon": "A", "color": "#00E5CC"},
        "NEARUSDT": {"name": "NEAR Protocol", "icon": "N", "color": "#000000"},
        "ARBUSDT": {"name": "Arbitrum", "icon": "◆", "color": "#28A0F0"},
        "OPUSDT": {"name": "Optimism", "icon": "⬢", "color": "#FF0420"},
        "INJUSDT": {"name": "Injective", "icon": "I", "color": "#00D4CC"},
        "SUIUSDT": {"name": "Sui", "icon": "S", "color": "#6FBCF0"},
        "STXUSDT": {"name": "Stacks", "icon": "S", "color": "#5546FF"},
        "RNDRUSDT": {"name": "Render", "icon": "R", "color": "#000000"},
        "IMXUSDT": {"name": "ImmutableX", "icon": "X", "color": "#0B8FFF"},
        "TIAUSDT": {"name": "Celestia", "icon": "T", "color": "#7B2BF9"},
        "SEIUSDT": {"name": "Sei", "icon": "S", "color": "#B91C1C"},
        "TAOUSDT": {"name": "Bittensor", "icon": "τ", "color": "#000000"},
        "WLDUSDT": {"name": "Worldcoin", "icon": "W", "color": "#000000"},
        "FTMUSDT": {"name": "Fantom", "icon": "◆", "color": "#1969FF"},
        "AAVEUSDT": {"name": "Aave", "icon": "A", "color": "#B6509E"},
        "MKRUSDT": {"name": "Maker", "icon": "M", "color": "#1AAB9B"},
        "GRTUSDT": {"name": "The Graph", "icon": "G", "color": "#6747ED"},
        "SANDUSDT": {"name": "The Sandbox", "icon": "S", "color": "#00ADEF"},
        "MANAUSDT": {"name": "Decentraland", "icon": "M", "color": "#FF2D55"},
        "AXSUSDT": {"name": "Axie Infinity", "icon": "A", "color": "#0055D5"},
        "THETAUSDT": {"name": "Theta", "icon": "Θ", "color": "#2AB8E6"},
        "FLOWUSDT": {"name": "Flow", "icon": "F", "color": "#00EF8B"},
        "EGLDUSDT": {"name": "MultiversX", "icon": "E", "color": "#000000"},
        "XTZUSDT": {"name": "Tezos", "icon": "ꜩ", "color": "#2C7DF7"},
        "EOSUSDT": {"name": "EOS", "icon": "E", "color": "#000000"},
        "KSMUSDT": {"name": "Kusama", "icon": "K", "color": "#000000"},
        "ARUSDT": {"name": "Arweave", "icon": "A", "color": "#222326"},
        "CHZUSDT": {"name": "Chiliz", "icon": "C", "color": "#CD0124"},
        "ENJUSDT": {"name": "Enjin", "icon": "E", "color": "#7866D5"},
        "ZILUSDT": {"name": "Zilliqa", "icon": "Z", "color": "#49C1BF"},
    }
    
    result = []
    for symbol in SYMBOLS:
        result.append({
            "symbol": symbol,
            **coin_info.get(symbol, {"name": symbol.replace("USDT", ""), "icon": "●", "color": "#888888"}),
        })
    
    return result



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for frontend connections"""
    await ws_manager.connect(websocket)

    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            logger.info(f"Received from client: {data}")

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)





@app.get("/api/markets")
async def get_markets():
    """현재 마켓 데이터 스냅샷 (CoinGecko markets 대체)"""
    current_prices = binance_client.get_current_prices()
    
    markets = []
    for symbol, price_data in current_prices.items():
        metadata = COIN_METADATA.get(symbol, {"name": symbol, "icon": "?", "color": "#888888"})
        
        markets.append({
            "id": symbol.lower(),
            "symbol": symbol.replace("USDT", ""),
            "name": metadata["name"],
            "current_price": float(price_data["price"]),
            "price_change_percentage_24h": float(price_data["change_24h"]),
            "high_24h": float(price_data["high_24h"]),
            "low_24h": float(price_data["low_24h"]),
            "total_volume": float(price_data["volume_24h"]),
            "market_cap_rank": SYMBOLS.index(symbol) + 1 if symbol in SYMBOLS else 999,
        })
    
    # market_cap_rank 기준 정렬
    markets.sort(key=lambda x: x["market_cap_rank"])
    return markets


@app.get("/api/global")
async def get_global():
    """글로벌 통계 (CoinGecko global 대체)"""
    current_prices = binance_client.get_current_prices()
    
    # 간단한 통계 계산
    total_volume = sum(float(p["volume_24h"]) for p in current_prices.values())
    
    # BTC 점유율 계산 (간이)
    btc_volume = float(current_prices.get("BTCUSDT", {}).get("volume_24h", 0))
    btc_dominance = (btc_volume / total_volume * 100) if total_volume > 0 else 0
    
    return {
        "data": {
            "active_cryptocurrencies": len(current_prices),
            "markets": 1,  # Binance
            "total_volume": {"usd": total_volume},
            "market_cap_percentage": {
                "btc": btc_dominance
            }
        }
    }


@app.get("/api/history/{symbol}")
async def get_history(symbol: str, interval: str = "1h", limit: int = 168):
    """Binance Klines API로 7일 가격 히스토리 가져오기"""
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")

    url = f"https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            klines = response.json()

            # Klines 형식: [timestamp, open, high, low, close, volume, ...]
            # close price만 추출
            prices = [float(k[4]) for k in klines]
            return {"symbol": symbol, "prices": prices}

    except httpx.HTTPError as e:
        logger.error(f"Binance API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")
