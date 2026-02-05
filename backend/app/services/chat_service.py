"""
AI Chat Service - Mock LLM with Real-time Price Data
"""
import asyncio
import uuid
import json
from typing import AsyncGenerator, List, Dict, Optional
from datetime import datetime

from .market_data import crypto_client
from ..models.chat import Source, SourceType


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


class ChatService:
    """AI 채팅 서비스 (Mock LLM + 실시간 시세)"""

    def __init__(self):
        self.crypto_client = crypto_client

    def _extract_tickers(self, query: str) -> List[str]:
        """질문에서 코인 티커 추출"""
        query_lower = query.lower()
        found = []
        for keyword, ticker in COIN_KEYWORDS.items():
            if keyword in query_lower and ticker not in found:
                found.append(ticker)
        return found if found else ["KRW-BTC"]  # 기본값

    async def _fetch_prices(self, tickers: List[str]) -> Dict[str, dict]:
        """실시간 시세 조회"""
        prices = {}
        for ticker in tickers:
            try:
                data = await self.crypto_client.get_current_price(ticker)
                prices[ticker] = data
            except Exception as e:
                print(f"[WARNING] Failed to fetch price for {ticker}: {e}")
        return prices

    def _build_context(self, prices: Dict[str, dict]) -> str:
        """RAG 컨텍스트 생성"""
        if not prices:
            return ""

        lines = ["[실시간 시세 데이터]"]
        for ticker, data in prices.items():
            name = COIN_NAMES.get(ticker, ticker)
            price = data.get("price", 0)
            change = data.get("change_percent", 0)
            change_str = f"+{change:.2f}" if change >= 0 else f"{change:.2f}"
            lines.append(f"- {name}: ₩{price:,.0f} ({change_str}%)")

        return "\n".join(lines)

    def _generate_response(self, query: str, prices: Dict[str, dict]) -> str:
        """Mock 응답 생성 (실시간 가격 포함)"""
        query_lower = query.lower()

        # 가격 관련 질문
        if any(kw in query_lower for kw in ["가격", "시세", "얼마", "현재"]):
            if prices:
                ticker = list(prices.keys())[0]
                data = prices[ticker]
                name = COIN_NAMES.get(ticker, ticker)
                price = data.get("price", 0)
                change = data.get("change_percent", 0)
                change_str = f"+{change:.2f}" if change >= 0 else f"{change:.2f}"
                volume = data.get("volume", 0)

                return f"""현재 **{name}** 시세를 분석해 드리겠습니다.

**현재 가격**: ₩{price:,.0f}
**24시간 변동률**: {change_str}%
**24시간 거래량**: {volume:,.2f}

**시장 동향**:
{"📈 상승세를 보이고 있습니다. 매수세가 우세한 상황입니다." if change > 0 else "📉 하락세를 보이고 있습니다. 매도세가 우세한 상황입니다." if change < 0 else "➡️ 보합세를 유지하고 있습니다."}

**투자 참고사항**:
- 단기 투자자: 변동성에 주의하세요
- 장기 투자자: 분할 매수 전략을 고려해보세요

⚠️ 본 정보는 투자 조언이 아닙니다. 투자 결정은 신중하게 내려주세요."""

        # 포트폴리오 관련 질문
        elif any(kw in query_lower for kw in ["포트폴리오", "자산", "내 "]):
            return """현재 포트폴리오를 분석해 드리겠습니다.

**총 평가액**: ₩12,450,000
**일간 수익**: +₩234,000 (+1.9%)

**자산 비중**:
- 암호화폐: 45%
- 국내주식: 35%
- 해외주식: 20%

**리스크 점수**: 72/100 (안정적)

💡 **추천**: 현재 암호화폐 비중이 높습니다. 분산 투자를 위해 채권형 ETF 추가를 고려해보세요.

⚠️ 본 정보는 투자 조언이 아닙니다."""

        # 리밸런싱 질문
        elif any(kw in query_lower for kw in ["리밸런싱", "조정", "배분"]):
            return """포트폴리오 리밸런싱 분석 결과입니다.

**현재 상태**: 분산 투자 양호

**권장 조정**:
1. 암호화폐 비중 5% 축소 (45% → 40%)
2. 채권 ETF 5% 추가 (0% → 5%)

**예상 효과**:
- 변동성 15% 감소
- 안정적 현금흐름 확보

리밸런싱을 진행하시겠습니까?"""

        # 분석/동향 질문
        elif any(kw in query_lower for kw in ["분석", "동향", "전망", "왜"]):
            if prices:
                ticker = list(prices.keys())[0]
                data = prices[ticker]
                name = COIN_NAMES.get(ticker, ticker)
                price = data.get("price", 0)
                change = data.get("change_percent", 0)

                return f"""**{name}** 최근 동향을 분석해 드리겠습니다.

**현재 가격**: ₩{price:,.0f} (24h {change:+.2f}%)

**주요 이슈**:
1. 글로벌 거시경제 불확실성 지속
2. 기관 투자자 매수세 증가
3. 규제 환경 변화 모니터링 필요

**기술적 분석**:
- 지지선: ₩{price * 0.95:,.0f}
- 저항선: ₩{price * 1.05:,.0f}
- RSI: 55 (중립)

**전문가 의견**: 단기적으로 변동성이 클 수 있으나, 장기적 관점에서 긍정적인 시각이 우세합니다.

⚠️ 본 정보는 투자 조언이 아닙니다."""

        # 기본 응답
        else:
            return """안녕하세요! tutum AI 금융 어시스턴트입니다.

다음과 같은 질문을 해보세요:

📊 **시세 조회**
- "비트코인 현재 가격"
- "이더리움 시세 알려줘"

📈 **분석 요청**
- "비트코인 동향 분석해줘"
- "이더리움 전망이 어때?"

💼 **포트폴리오**
- "내 포트폴리오 분석해줘"
- "리밸런싱 추천해줘"

무엇이든 물어보세요!"""

    def _build_sources(self, prices: Dict[str, dict], query: str) -> List[dict]:
        """출처 정보 생성"""
        sources = []

        if prices:
            for ticker in prices.keys():
                name = COIN_NAMES.get(ticker, ticker)
                sources.append({
                    "type": "price",
                    "title": f"{name} 실시간 시세 (Upbit)"
                })

        query_lower = query.lower()
        if any(kw in query_lower for kw in ["포트폴리오", "자산", "내"]):
            sources.append({
                "type": "portfolio",
                "title": "내 포트폴리오 데이터"
            })

        return sources

    async def chat_stream(
        self,
        message: str,
        conversation_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """SSE 스트리밍 응답 생성"""

        conv_id = conversation_id or str(uuid.uuid4())
        msg_id = str(uuid.uuid4())

        # 1. Start event
        yield f"event: start\ndata: {json.dumps({'conversation_id': conv_id, 'message_id': msg_id})}\n\n"

        # 2. RAG: 실시간 시세 조회
        tickers = self._extract_tickers(message)
        prices = await self._fetch_prices(tickers)

        # 3. Sources event
        sources = self._build_sources(prices, message)
        yield f"event: sources\ndata: {json.dumps({'sources': sources})}\n\n"

        # 4. 응답 생성
        response = self._generate_response(message, prices)

        # 5. Delta events (스트리밍 - 단어 단위)
        words = response.split(' ')
        for word in words:
            yield f"event: delta\ndata: {json.dumps({'content': word + ' '})}\n\n"
            await asyncio.sleep(0.03)  # 30ms 딜레이

        # 6. Done event
        yield f"event: done\ndata: {json.dumps({'status': 'complete'})}\n\n"


# 싱글톤 인스턴스
chat_service = ChatService()
