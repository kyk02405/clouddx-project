"""
============================================
Exchange Rate Service
============================================

환율 정보를 제공합니다.
현재는 하드코딩된 환율을 사용하며, 추후 외부 API와 연동될 예정입니다.

지원 환율:
- USD to KRW: 1300
- JPY to KRW: 9
- 동일 통화: 1.0
"""


async def get_exchange_rate(from_currency: str, to_currency: str) -> float:
    """
    환율 조회
    
    Args:
        from_currency: 원본 통화 (예: USD, JPY, KRW)
        to_currency: 대상 통화 (예: KRW)
    
    Returns:
        환율 (float)
    
    Raises:
        ValueError: 지원하지 않는 통화 조합
    """
    # 동일 통화는 1.0
    if from_currency == to_currency:
        return 1.0
    
    # 하드코딩된 환율
    rates = {
        ("USD", "KRW"): 1300.0,
        ("JPY", "KRW"): 9.0,
    }
    
    # 역방향 환율 계산
    if (from_currency, to_currency) in rates:
        return rates[(from_currency, to_currency)]
    elif (to_currency, from_currency) in rates:
        return 1.0 / rates[(to_currency, from_currency)]
    else:
        raise ValueError(
            f"지원하지 않는 환율 조합: {from_currency} -> {to_currency}"
        )


# TODO: Integrate with external API (e.g., Open Exchange Rates)
