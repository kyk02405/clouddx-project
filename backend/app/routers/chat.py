"""
AI Chat API Router
"""
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import json

from ..models.chat import ChatRequest
from ..services.chat_service import chat_service

router = APIRouter()


@router.post("/")
async def chat(body: ChatRequest):
    """
    AI 채팅 API (SSE 스트리밍)

    - message: 사용자 질문
    - conversation_id: 대화 ID (선택)

    Response: SSE Stream
    - event: start - 대화 시작
    - event: sources - 출처 정보
    - event: delta - 응답 텍스트 청크
    - event: done - 완료
    """
    try:
        return StreamingResponse(
            chat_service.chat_stream(
                message=body.message,
                conversation_id=body.conversation_id
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Nginx buffering 비활성화
            }
        )
    except Exception as e:
        print(f"[ERROR] Chat API Error: {e}")

        async def error_stream():
            yield f"event: error\ndata: {json.dumps({'message': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'})}\n\n"

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream"
        )


@router.get("/health")
async def chat_health():
    """채팅 서비스 상태 확인"""
    return {"status": "ok", "service": "chat"}
