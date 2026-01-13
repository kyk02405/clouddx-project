# Crypto Tracker Backend

Python FastAPI backend with Binance WebSocket integration for real-time cryptocurrency price streaming.

## Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health` - Health check
- `WS /ws` - WebSocket endpoint for real-time price updates

## Tracked Symbols

BTC, ETH, SOL, ADA, AVAX, DOT, LINK, UNI
