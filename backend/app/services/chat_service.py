import logging
"""
AI Chat Service - AWS Bedrock + RAG (??? + ? + ????
"""
import asyncio
import uuid
import json
import boto3
from botocore.config import Config
from typing import AsyncGenerator, List, Dict, Optional
from datetime import datetime

from .market_data import crypto_client
from ..config import get_settings
from ..database import get_news_collection, get_assets_collection
from ..services.exchange_rate import get_exchange_rate
from ..mariadb import get_user_portfolios

try:
    from elasticsearch import AsyncElasticsearch
    _ES_AVAILABLE = True
except ImportError:
    _ES_AVAILABLE = False

logger = logging.getLogger(__name__)

# 코인 키워드 매핑
COIN_KEYWORDS = {
    "비트코인": "KRW-BTC",
    "btc": "KRW-BTC",
    "이더리움": "KRW-ETH",
    "eth": "KRW-ETH",
    "이더": "KRW-ETH",
    "리플": "KRW-XRP",
    "xrp": "KRW-XRP",
    "솔라나": "KRW-SOL",
    "sol": "KRW-SOL",
}

# 코인 한글 이름
COIN_NAMES = {
    "KRW-BTC": "비트코인(BTC)",
    "KRW-ETH": "이더리움(ETH)",
    "KRW-XRP": "리플(XRP)",
    "KRW-SOL": "솔라나(SOL)",
}

# 시스템 프롬프트
SYSTEM_PROMPT = """당신은 "tutum AI"라는 금융 AI 어시스턴트입니다.

## 역할
- 사용자의 암호화폐 및 주식 포트폴리오 분석을 도와주는 전문 어시스턴트
- 실시간 시세 데이터와 뉴스를 기반으로 시장 분석 및 투자 인사이트 제공

## 지원 기능
1. **시세 조회**: 비트코인(BTC), 이더리움(ETH), 리플(XRP), 솔라나(SOL) 등 암호화폐 실시간 가격 분석
2. **포트폴리오 분석**: 사용자 자산 구성, 수익률, 리스크 점수 분석
3. **리밸런싱 추천**: 자산 배분 최적화 제안
4. **시장 동향 분석**: 뉴스 기반 분석 및 거시경제 동향
5. **뉴스 기반 추론**: 제공된 뉴스 데이터를 근거로 가격 변동 원인 분석

## 응답 규칙
- 한국어로 응답하세요
- 금액은 원(₩) 단위로, 소수점 없이 표시하세요 (예: ₩95,702,000)
- 마크다운 볼드(**텍스트**)를 활용하여 가독성 좋게 구성하세요
- 모든 응답 마지막에 반드시 다음 면책 문구를 포함하세요: "본 정보는 투자 조언이 아닙니다. 투자 결정은 신중하게 내려주세요."
- 답변은 간결하되 핵심 정보를 빠짐없이 포함하세요
- 금융과 관련 없는 질문에는 정중히 금융 관련 질문으로 안내하세요

## 컨텍스트
사용자 메시지와 함께 [내 포트폴리오], [실시간 시세 데이터], [관련 뉴스]가 제공될 수 있습니다. 이 데이터를 활용하여 정확한 정보 기반으로 응답하세요.
- [내 포트폴리오]가 있으면 사용자의 실제 보유 자산을 기반으로 분석하세요, 리밸런싱 추천 시 현재 비중과 수익률을 고려하세요"""

def _next_stream_event(iterator):
    try:
        return next(iterator), False
    except StopIteration:
        return None, True


class ChatService:
    """AI  ???(Bedrock + ??? + ? RAG)"""

    def __init__(self):
        self.crypto_client = crypto_client
        self.settings = get_settings()
        self.bedrock_client = None
        self.es_client = None

        # Elasticsearch 클라이언트 초기화
        if _ES_AVAILABLE:
            try:
                self.es_client = AsyncElasticsearch(
                    hosts=[self.settings.ELASTICSEARCH_URL],
                    request_timeout=5,
                )
                logger.info("Elasticsearch client initialized: %s", self.settings.ELASTICSEARCH_URL)
            except Exception as e:
                logger.warning("Elasticsearch 초기화 실패: %s", e)

        # Bedrock ??????
        if self.settings.AWS_ACCESS_KEY_ID and self.settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.bedrock_client = boto3.client(
                    "bedrock-runtime",
                    region_name=self.settings.AWS_REGION,
                    aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
                    config=Config(
                        connect_timeout=getattr(self.settings, "BEDROCK_CONNECT_TIMEOUT_SECONDS", 10),
                        read_timeout=getattr(self.settings, "BEDROCK_READ_TIMEOUT_SECONDS", 60),
                        retries={"max_attempts": 3, "mode": "standard"},
                    ),
                )
                logger.info("Bedrock client initialized")
            except Exception as e:
                logger.warning("Bedrock ???????: %s", e)
        else:
            logger.info("AWS credentials not configured; running in mock mode")

    def _extract_keywords(self, query: str) -> List[str]:
        """? ????? ( + ? )"""
        query_lower = query.lower()
        keywords = []

        #  ???
        for keyword in COIN_KEYWORDS:
            if keyword in query_lower:
                keywords.append(keyword)

        # ?  ???(???  ? ? )
        stock_keywords = [
            "삼성전자",
            "SK하이닉스",
            "네이버",
            "카카오",
            "LG에너지솔루션",
            "현대차",
            "기아",
            "셀트리온",
            "포스코",
            "삼성SDI",
            "애플",
            "테슬라",
            "엔비디아",
            "마이크로소프트",
            "아마존",
            "구글",
            "메타",
        ]
        for kw in stock_keywords:
            if kw in query:
                keywords.append(kw)

        return keywords

    def _extract_tickers(self, query: str) -> List[str]:
        """?  ? """
        query_lower = query.lower()
        found = []
        for keyword, ticker in COIN_KEYWORDS.items():
            if keyword in query_lower and ticker not in found:
                found.append(ticker)
        return found

    async def _fetch_prices(self, tickers: List[str]) -> Dict[str, dict]:
        """??? """
        prices = {}
        for ticker in tickers:
            try:
                data = await self.crypto_client.get_current_price(ticker)
                prices[ticker] = data
            except Exception as e:
                logger.warning("Failed to fetch price for {ticker}: %s", e)
        return prices

    async def _fetch_news(self, keywords: List[str], limit: int = 5) -> List[dict]:
        """MongoDB??? ??????? ????"""
        try:
            news_col = get_news_collection()
            if news_col is None:
                return []

            if keywords:
                search_conditions = []
                for kw in keywords:
                    regex = {"$regex": kw, "$options": "i"}
                    search_conditions.append({"$or": [
                        {"title": regex},
                        {"body": regex},
                        {"content": regex},
                    ]})
                query_filter = {"$or": search_conditions}
            else:
                query_filter = {}

            cursor = news_col.find(query_filter).sort("published_at", -1).limit(limit)

            news_list = []
            async for doc in cursor:
                body = doc.get("body") or doc.get("content") or doc.get("description") or ""
                body_truncated = body[:200] + "..." if len(body) > 200 else body

                pub_at = doc.get("published_at")
                if isinstance(pub_at, datetime):
                    pub_at = pub_at.strftime("%Y-%m-%d")
                else:
                    pub_at = str(pub_at or "")[:10]

                news_list.append({
                    "title": doc.get("title", ""),
                    "body": body_truncated,
                    "source": doc.get("source", ""),
                    "published_at": pub_at,
                    "url": doc.get("link") or doc.get("url"),
                })

            return news_list
        except Exception as e:
            logger.warning("??? ???????: %s", e)
            return []


    async def _fetch_news_es(self, keywords: List[str], limit: int = 5) -> List[dict]:
        """Elasticsearch multi_match 검색 (빠른 전문 검색)"""
        if not self.es_client:
            return []
        try:
            if keywords:
                query = {
                    "query": {
                        "multi_match": {
                            "query": " ".join(keywords),
                            "fields": ["title^3", "content", "summary"],
                            "type": "best_fields",
                            "fuzziness": "AUTO",
                        }
                    },
                    "sort": [{"_score": "desc"}, {"published_at": "desc"}],
                    "size": limit,
                    "_source": ["title", "content", "summary", "source", "press", "published_at", "url", "finance_origin_link"],
                }
            else:
                query = {
                    "query": {"match_all": {}},
                    "sort": [{"published_at": "desc"}],
                    "size": limit,
                    "_source": ["title", "content", "summary", "source", "press", "published_at", "url", "finance_origin_link"],
                }

            resp = await self.es_client.search(index=self.settings.ELASTICSEARCH_INDEX, body=query)
            news_list = []
            for hit in resp["hits"]["hits"]:
                src = hit["_source"]
                body = src.get("summary") or src.get("content") or ""
                body_truncated = body[:200] + "..." if len(body) > 200 else body
                pub_at = src.get("published_at", "")
                if pub_at:
                    pub_at = str(pub_at)[:10]
                news_list.append({
                    "title": src.get("title", ""),
                    "body": body_truncated,
                    "source": src.get("press") or src.get("source", ""),
                    "published_at": pub_at,
                    "url": src.get("finance_origin_link") or src.get("url"),
                })
            logger.info("ES 뉴스 검색 성공: %d건 (keywords=%s)", len(news_list), keywords)
            return news_list
        except Exception as e:
            logger.warning("ES 뉴스 검색 실패, MongoDB fallback: %s", e)
            return []

    async def _fetch_portfolio(self, user_id: str) -> tuple[List[dict], bool]:
        """MariaDB ???? (MongoDB fallback)"""
        try:
            # FX rate (KRW base)
            try:
                usd_to_krw = await get_exchange_rate("USD", "KRW")
            except Exception:
                usd_to_krw = 1.0

            # 1) MariaDB ? 
            try:
                items = await get_user_portfolios(int(user_id))
                if items:
                    portfolio = []
                    for item in items:
                        currency = (item.currency or "KRW").upper()
                        avg_price = float(item.avg_buy_price or 0)
                        cur_price = avg_price  # ???? API? ??

                        if currency == "USD":
                            avg_price = avg_price * usd_to_krw
                            cur_price = cur_price * usd_to_krw
                            currency = "KRW"

                        portfolio.append({
                            "name": item.asset_name or "",
                            "symbol": item.asset_code or "",
                            "asset_type": item.asset_type or "",
                            "quantity": float(item.quantity or 0),
                            "average_price": avg_price,
                            "current_price": cur_price,
                            "currency": currency,
                        })
                    return portfolio, False
            except Exception as e:
                logger.warning("MariaDB portfolio lookup failed, trying MongoDB: %s", e)

            # 2) MongoDB fallback
            assets_col = get_assets_collection()
            if assets_col is None:
                return [], True

            cursor = assets_col.find({"user_id": user_id})
            portfolio = []
            async for doc in cursor:
                currency = (doc.get("currency") or "KRW").upper()
                avg_price = doc.get("average_price", 0)
                cur_price = doc.get("current_price", 0)

                if currency == "USD":
                    avg_price = avg_price * usd_to_krw
                    cur_price = cur_price * usd_to_krw
                    currency = "KRW"

                portfolio.append({
                    "name": doc.get("name", ""),
                    "symbol": doc.get("symbol", ""),
                    "asset_type": doc.get("asset_type", ""),
                    "quantity": doc.get("quantity", 0),
                    "average_price": avg_price,
                    "current_price": cur_price,
                    "currency": currency,
                })
            return portfolio, False
        except Exception as e:
            logger.warning("Portfolio fetch failed: %s", e)
            return [], True


    def _build_price_context(self, prices: Dict[str, dict]) -> str:
        """Build price RAG context (ASCII safe)."""
        if not prices:
            return ""

        lines = ["[PRICE DATA]"]
        for ticker, data in prices.items():
            name = COIN_NAMES.get(ticker, ticker)
            price = data.get("price", 0)
            change = data.get("change_percent", 0)
            volume = data.get("volume", 0)
            change_str = f"+{change:.2f}" if change >= 0 else f"{change:.2f}"
            lines.append(f"- {name}: {price:,.0f} ({change_str}%), volume {volume:,.2f}")

        return "\n".join(lines)

    def _build_news_context(self, news_list: List[dict]) -> str:
        """Build news RAG context (ASCII safe)."""
        if not news_list:
            return ""

        lines = ["\n[NEWS]"]
        for i, news in enumerate(news_list, 1):
            lines.append(f"{i}. [{news.get('published_at','')}] '{news.get('title','')}' ({news.get('source','')})")
            body = news.get("body") or ""
            if body:
                lines.append(f"   Summary: {body}")

        return "\n".join(lines)

    def _build_portfolio_context(
        self,
        portfolio: List[dict],
        prices: Dict[str, dict],
        portfolio_fetch_failed: bool = False,
    ) -> str:
        """????RAG ? ?"""
        if portfolio_fetch_failed:
            return "\n[PORTFOLIO]\n- Portfolio lookup failed. Continue analysis without holdings data."

        if not portfolio:
            return ""

        lines = ["\n[??????"]
        total_eval = 0
        total_invested = 0

        for asset in portfolio:
            name = asset["name"] or asset["symbol"]
            qty = asset["quantity"]
            avg = asset["average_price"]
            cur = asset["current_price"]

            #  ? ????? ??
            for ticker, price_data in prices.items():
                if asset["symbol"].upper() in ticker.upper():
                    cur = price_data.get("price", cur)

            invested = avg * qty
            evaluation = cur * qty
            total_invested += invested
            total_eval += evaluation

            if avg > 0:
                profit_pct = ((cur - avg) / avg) * 100
                profit_str = f"+{profit_pct:.1f}" if profit_pct >= 0 else f"{profit_pct:.1f}"
            else:
                profit_str = "N/A"

            asset_type_kr = {"crypto": "암호화폐", "stock": "주식", "etf": "ETF"}.get(
                asset["asset_type"], asset["asset_type"]
            )
            lines.append(
                f"- {name}({asset['symbol']}): {qty}개, 평균가 {avg:,.0f}, 현재가 {cur:,.0f} ({profit_str}%) [{asset_type_kr}]"
            )

        if total_invested > 0:
            total_profit_pct = ((total_eval - total_invested) / total_invested) * 100
            total_str = f"+{total_profit_pct:.1f}" if total_profit_pct >= 0 else f"{total_profit_pct:.1f}"
        else:
            total_str = "N/A"

        lines.append(
            f"총 투자금: {total_invested:,.0f} | 총 평가금: {total_eval:,.0f} | 총 수익률: {total_str}%"
        )

        return "\n".join(lines)

    def _build_sources(
        self,
        prices: Dict[str, dict],
        news_list: List[dict],
        portfolio: Optional[List[dict]] = None,
        portfolio_fetch_failed: bool = False,
    ) -> List[dict]:
        """?? ?? ??"""
        sources: List[dict] = []

        if prices:
            for ticker in prices.keys():
                name = COIN_NAMES.get(ticker, ticker)
                sources.append({
                    "type": "price",
                    "title": f"{name} ??? ?? (Upbit)",
                })

        for news in news_list[:3]:
            sources.append({
                "type": "news",
                "title": news.get("title", "")[:40],
                "url": news.get("url"),
            })

        if portfolio:
            sources.append({
                "type": "portfolio",
                "title": f"?? ?? {len(portfolio)}?? ??",
            })
        elif portfolio_fetch_failed:
            sources.append({
                "type": "portfolio",
                "title": "Portfolio lookup failed (no holdings context)",
            })

        return sources

    def _generate_mock_response(self, query: str, prices: Dict[str, dict]) -> str:
        """Mock ? ? (Bedrock ???Fallback)"""
        query_lower = query.lower()

        if any(kw in query_lower for kw in ["가격", "시세", "얼마", "현재"]):
            if prices:
                ticker = list(prices.keys())[0]
                data = prices[ticker]
                name = COIN_NAMES.get(ticker, ticker)
                price = data.get("price", 0)
                change = data.get("change_percent", 0)
                change_str = f"+{change:.2f}" if change >= 0 else f"{change:.2f}"
                return f"현재 **{name}** 가격은 {price:,.0f} ({change_str}%) 입니다.\n\n본 정보는 투자 조언이 아닙니다."

        return "안녕하세요. tutum AI 금융 어시스턴트입니다. 현재 Mock 모드로 동작 중입니다.\n\n본 정보는 투자 조언이 아닙니다."

    async def _call_bedrock_stream(self, user_message: str) -> AsyncGenerator[str, None]:
        """Bedrock InvokeModelWithResponseStream ?"""
        invoke_timeout = int(getattr(self.settings, "BEDROCK_INVOKE_TIMEOUT_SECONDS", 30))
        chunk_timeout = int(getattr(self.settings, "BEDROCK_STREAM_CHUNK_TIMEOUT_SECONDS", 30))

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.settings.BEDROCK_MAX_TOKENS,
            "temperature": self.settings.BEDROCK_TEMPERATURE,
            "system": SYSTEM_PROMPT,
            "messages": [
                {"role": "user", "content": user_message}
            ]
        })

        response = await asyncio.wait_for(
            asyncio.to_thread(
                self.bedrock_client.invoke_model_with_response_stream,
                modelId=self.settings.BEDROCK_MODEL_ID,
                contentType="application/json",
                accept="application/json",
                body=body,
            ),
            timeout=invoke_timeout,
        )

        stream = response.get("body")
        stream_iter = iter(stream)
        while True:
            event, done = await asyncio.wait_for(
                asyncio.to_thread(_next_stream_event, stream_iter),
                timeout=chunk_timeout,
            )
            if done:
                break
            chunk = event.get("chunk")
            if chunk:
                data = json.loads(chunk.get("bytes").decode())
                if data.get("type") == "content_block_delta":
                    delta = data.get("delta", {})
                    if delta.get("type") == "text_delta":
                        yield delta.get("text", "")

    async def chat_stream(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """SSE stream response"""

        conv_id = conversation_id or str(uuid.uuid4())
        msg_id = str(uuid.uuid4())

        # 1. Start event
        yield f"event: start\ndata: {json.dumps({'conversation_id': conv_id, 'message_id': msg_id})}\n\n"

        # 2. RAG: keywords -> prices/news/portfolio
        try:
            tickers = self._extract_tickers(message)
            keywords = self._extract_keywords(message)

            prices = await self._fetch_prices(tickers)

            # ES 우선 검색, 실패 시 MongoDB fallback
            news_list = await self._fetch_news_es(keywords)
            if not news_list:
                news_list = await self._fetch_news(keywords)

            portfolio = []
            portfolio_fetch_failed = False
            if user_id:
                portfolio, portfolio_fetch_failed = await self._fetch_portfolio(user_id)

            sources = self._build_sources(prices, news_list, portfolio, portfolio_fetch_failed)
        except Exception as e:
            logger.error("Chat pre-processing failed: %s", e)
            yield f"event: error\ndata: {json.dumps({'message': '?? ??? ??????. ?? ? ?? ??????.'})}\n\n"
            return

        # 3. Sources event
        yield f"event: sources\ndata: {json.dumps({'sources': sources})}\n\n"

        # 4. Build context + LLM
        price_context = self._build_price_context(prices)
        news_context = self._build_news_context(news_list)
        portfolio_context = self._build_portfolio_context(portfolio, prices, portfolio_fetch_failed)
        user_message = f"{portfolio_context}\n{price_context}\n{news_context}\n\n??? ??: {message}".strip()

        # 5. Bedrock stream or Mock fallback
        if self.bedrock_client:
            try:
                async for token in self._call_bedrock_stream(user_message):
                    yield f"event: delta\ndata: {json.dumps({'content': token})}\n\n"
            except Exception as e:
                logger.error("Bedrock ?? ??: %s", e)
                response = self._generate_mock_response(message, prices)
                for word in response.split(' '):
                    yield f"event: delta\ndata: {json.dumps({'content': word + ' '})}\n\n"
                    await asyncio.sleep(0.03)
        else:
            response = self._generate_mock_response(message, prices)
            for word in response.split(' '):
                yield f"event: delta\ndata: {json.dumps({'content': word + ' '})}\n\n"
                await asyncio.sleep(0.03)

        # 6. Done event
        yield f"event: done\ndata: {json.dumps({'status': 'complete'})}\n\n"

chat_service = ChatService()




