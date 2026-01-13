import asyncio
import json
import logging
from typing import Set
import websockets
from websockets.exceptions import ConnectionClosed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BinanceClient:
    def __init__(self, symbols: list[str]):
        self.symbols = symbols
        self.ws_url = "wss://stream.binance.com:9443/ws"
        self.subscribers: Set[asyncio.Queue] = set()
        self.running = False
        self.current_prices: dict[str, dict] = {}  # 현재 가격 캐시

    def subscribe(self, queue: asyncio.Queue):
        """Add a subscriber queue"""
        self.subscribers.add(queue)

    def unsubscribe(self, queue: asyncio.Queue):
        """Remove a subscriber queue"""
        self.subscribers.discard(queue)

    async def broadcast(self, message: dict):
        """Broadcast message to all subscribers"""
        # 캐시에 저장
        self.current_prices[message["symbol"]] = message
        
        for queue in self.subscribers:
            try:
                await queue.put(message)
            except Exception as e:
                logger.error(f"Error broadcasting to subscriber: {e}")

    def get_current_prices(self) -> dict[str, dict]:
        """REST API용 현재 가격 스냅샷 반환"""
        return self.current_prices.copy()

    async def connect(self):
        """Connect to Binance WebSocket and stream price updates"""
        self.running = True

        # Create stream names for all symbols
        streams = [f"{symbol.lower()}@ticker" for symbol in self.symbols]
        stream_url = f"{self.ws_url}/{'/'.join(streams)}"

        while self.running:
            try:
                logger.info(f"Connecting to Binance WebSocket...")
                async with websockets.connect(stream_url) as ws:
                    logger.info("Connected to Binance WebSocket")

                    async for message in ws:
                        try:
                            data = json.loads(message)

                            # Handle single stream vs combined stream format
                            if "stream" in data:
                                ticker_data = data["data"]
                            else:
                                ticker_data = data

                            # Extract relevant price information
                            price_update = {
                                "symbol": ticker_data["s"],
                                "price": ticker_data["c"],
                                "change_24h": ticker_data["P"],
                                "high_24h": ticker_data["h"],
                                "low_24h": ticker_data["l"],
                                "volume_24h": ticker_data["v"],
                            }

                            await self.broadcast(price_update)

                        except json.JSONDecodeError as e:
                            logger.error(f"JSON decode error: {e}")
                        except KeyError as e:
                            logger.error(f"Missing key in data: {e}")

            except ConnectionClosed:
                logger.warning("Connection closed, reconnecting in 5 seconds...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await asyncio.sleep(5)

    async def stop(self):
        """Stop the WebSocket connection"""
        self.running = False
