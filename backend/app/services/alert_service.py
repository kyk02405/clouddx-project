import asyncio
import uuid
from datetime import datetime
from typing import List, Dict
from ..models.notification import Notification

class MarketMonitor:
    def __init__(self):
        self.price_history: Dict[str, List[dict]] = {}
        self.notifications: List[Notification] = []
        self.cooldowns: Dict[str, datetime] = {}
        self.is_running = False
        
        # 임계값 (기본 3%, .env로 조정 가능하도록 하면 좋음)
        self.THRESHOLD = 0.03
        
        # 모니터링 대상 코인
        self.TARGET_COINS = ["KRW-BTC", "KRW-ETH", "KRW-XRP", "KRW-SOL"]

    async def start_monitoring(self):
        """백그라운드 모니터링 시작"""
        self.is_running = True
        print("[INFO] Market Monitor Started")
        
        from .market_data import crypto_client
        
        while self.is_running:
            try:
                # 1. 현재가 조회 (순차 조회)
                # TODO: 추후 get_multiple_prices 배치 조회로 최적화 권장
                current_prices = {}
                for ticker in self.TARGET_COINS:
                    try:
                        data = await crypto_client.get_current_price(ticker)
                        current_prices[ticker] = data["price"]
                    except Exception as e:
                        print(f"[WARNING] Failed to fetch price for {ticker}: {e}")

                # 2. 가격 변동 체크
                self._check_price_drops(current_prices)

            except Exception as e:
                print(f"[ERROR] Market Monitor Loop Error: {e}")
            
            # 60초 대기
            await asyncio.sleep(60)

    def _check_price_drops(self, current_prices: Dict[str, float]):
        """가격 급락 감지 로직"""
        now = datetime.now()
        
        for ticker, current_price in current_prices.items():
            # 히스토리 초기화
            if ticker not in self.price_history:
                self.price_history[ticker] = []
            
            # 현재 가격 기록 추가
            self.price_history[ticker].append({
                "price": current_price,
                "time": now
            })
            
            # 10분 넘은 데이터 제거 (메모리 관리)
            self.price_history[ticker] = [
                p for p in self.price_history[ticker] 
                if (now - p["time"]).total_seconds() < 600
            ]
            
            # 5분 전 가격 찾기 (가장 가까운 과거 데이터)
            # 5분 = 300초
            five_min_ago_price = None
            for p in self.price_history[ticker]:
                # 4분 30초 ~ 5분 30초 사이의 데이터
                age = (now - p["time"]).total_seconds()
                if 270 <= age <= 330:
                    five_min_ago_price = p["price"]
                    break
            
            # 데이터가 아직 충분하지 않으면 스킵
            if not five_min_ago_price:
                continue
                
            # 변동률 계산
            change_rate = (current_price - five_min_ago_price) / five_min_ago_price
            
            # 급락 체크 (< -3%)
            if change_rate < -self.THRESHOLD:
                self._create_notification(
                    type="PRICE_DROP",
                    title=f"{ticker.replace('KRW-', '')} 급락 주의",
                    message=f"{ticker.replace('KRW-', '')} 가격이 5분 전 대비 {abs(change_rate)*100:.1f}% 하락했습니다."
                )
            
            # 급등 체크 (> 3%)
            elif change_rate > self.THRESHOLD:
                self._create_notification(
                    type="PRICE_SURGE",
                    title=f"{ticker.replace('KRW-', '')} 급등 알림",
                    message=f"{ticker.replace('KRW-', '')} 가격이 5분 전 대비 {change_rate*100:.1f}% 상승했습니다."
                )

    def _create_notification(self, type: str, title: str, message: str):
        """알림 생성 (Cooldown 적용)"""
        now = datetime.now()
        
        # Cooldown 체크 (10분)
        # 키: "KRW-BTC:PRICE_DROP"
        cooldown_key = f"{title}:{type}"
        last_alert = self.cooldowns.get(cooldown_key)
        
        if last_alert and (now - last_alert).total_seconds() < 600:
            return  # 쿨다운 중
            
        # 알림 생성
        notification = Notification(
            id=str(uuid.uuid4()),
            type=type,
            title=title,
            message=message,
            created_at=now,
            is_read=False
        )
        
        # 리스트 앞에 추가 (최신순)
        self.notifications.insert(0, notification)
        
        # 최대 100개 유지
        if len(self.notifications) > 100:
            self.notifications.pop()
            
        # 쿨다운 갱신
        self.cooldowns[cooldown_key] = now
        
        print(f"[ALERT] New Notification Created: {title}")

    def get_notifications(self, limit: int = 20, unread_only: bool = False):
        """알림 조회"""
        results = self.notifications
        if unread_only:
            results = [n for n in results if not n.is_read]
        return results[:limit]
