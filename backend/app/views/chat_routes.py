from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.models.chat import ChatRequest
from app.controllers.chat_controller import (
    process_chat, stream_chat, get_chat_sessions,
    get_session_messages, delete_session
)
from app.middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Copilot Chat"])


@router.post("/message", summary="Send a message to AI copilot")
async def chat_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    if request.stream:
        return StreamingResponse(
            stream_chat(request, current_user),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            }
        )
    return await process_chat(request, current_user)


@router.get("/sessions", summary="Get all chat sessions")
async def list_sessions(current_user: dict = Depends(get_current_user)):
    sessions = await get_chat_sessions(current_user)
    return {"sessions": sessions, "total": len(sessions)}


@router.get("/sessions/{session_id}", summary="Get messages in a session")
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await get_session_messages(session_id, current_user)


@router.delete("/sessions/{session_id}", summary="Delete a chat session")
async def remove_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await delete_session(session_id, current_user)
