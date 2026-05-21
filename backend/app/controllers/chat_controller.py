from datetime import datetime
from typing import AsyncGenerator, Optional
import json
import logging
from fastapi import HTTPException
from bson import ObjectId
from app.models.chat import ChatRequest, ChatResponse, MessageRole
from app.ai import get_ai_provider, SYSTEM_PROMPT_EN, SYSTEM_PROMPT_HI, SYSTEM_PROMPT_KN
from app.database import get_database

logger = logging.getLogger(__name__)

SYSTEM_PROMPTS = {
    "en": SYSTEM_PROMPT_EN,
    "hi": SYSTEM_PROMPT_HI,
    "kn": SYSTEM_PROMPT_KN,
}


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "kn": "Kannada (ಕನ್ನಡ)",
}


def _build_system_prompt(language: str, user: dict) -> str:
    """Build system prompt with strict language instruction and user context"""
    base = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPT_EN)
    lang_name = LANGUAGE_NAMES.get(language, "English")

    profile = user.get("profile", {})
    parts = []
    if profile.get("state"):
        parts.append(f"State: {profile['state']}")
    if profile.get("district"):
        parts.append(f"District: {profile['district']}")
    if profile.get("soil_type"):
        parts.append(f"Soil Type: {profile['soil_type']}")
    if profile.get("crop_types"):
        parts.append(f"Crops grown: {', '.join(profile['crop_types'])}")
    if profile.get("farm_size"):
        parts.append(f"Farm size: {profile['farm_size']} acres")

    if parts:
        base += "\n\nFarmer's Profile:\n" + "\n".join(f"- {p}" for p in parts)

    # Add a final hard override at the end — Gemini respects the last instruction
    base += f"\n\n⚠️ FINAL INSTRUCTION: You MUST respond ONLY in {lang_name}. Do NOT use any other language under any circumstances. The farmer has selected {lang_name} as their language."

    return base


async def _get_or_create_session(user_id: str, session_id: Optional[str], language: str) -> dict:
    db = get_database()
    if session_id:
        try:
            session = await db.chat_sessions.find_one({
                "_id": ObjectId(session_id),
                "user_id": user_id
            })
            if session:
                session["_id"] = str(session["_id"])
                return session
        except Exception:
            pass
    # Create new session
    new_session = {
        "user_id": user_id,
        "title": "New Conversation",
        "messages": [],
        "language": language,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.chat_sessions.insert_one(new_session)
    new_session["_id"] = str(result.inserted_id)
    return new_session


async def process_chat(request: ChatRequest, user: dict) -> ChatResponse:
    """Process a chat message and return AI response"""
    db = get_database()
    user_id = user["_id"]

    session = await _get_or_create_session(user_id, request.session_id, request.language)
    session_id = session["_id"]

    # Add user message to history
    messages = session.get("messages", [])
    messages.append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.utcnow().isoformat(),
    })

    system_prompt = _build_system_prompt(request.language, user)

    # Format last 10 messages for AI context
    ai_messages = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in messages[-10:]
    ]

    # Get AI response — pass language so provider injects it into the message
    ai_provider = get_ai_provider()
    logger.info(f"Chat using provider: {type(ai_provider).__name__}, language: {request.language}")

    try:
        ai_response = await ai_provider.chat(ai_messages, system_prompt, language=request.language)
    except Exception as e:
        logger.error(f"AI chat error: {e}", exc_info=True)
        # Return a friendly message in the correct language instead of raw error
        lang_errors = {
            "en": "I'm temporarily unavailable due to high demand. Please try again in a moment. 🌾",
            "hi": "मैं अभी व्यस्त हूँ। कृपया 1-2 मिनट में दोबारा कोशिश करें। 🌾",
            "kn": "ನಾನು ಈಗ ಬ್ಯುಸಿ ಆಗಿದ್ದೇನೆ. ದಯವಿಟ್ಟು 1-2 ನಿಮಿಷದಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. 🌾",
        }
        ai_response = lang_errors.get(request.language, lang_errors["en"])

    # Add AI response to history
    messages.append({
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.utcnow().isoformat(),
    })

    # Auto-generate title from first message
    title = session.get("title", "New Conversation")
    if len(messages) <= 2:
        title = request.message[:60] + ("..." if len(request.message) > 60 else "")

    # Save to DB (keep last 50 messages)
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "messages": messages[-50:],
            "title": title,
            "language": request.language,
            "updated_at": datetime.utcnow(),
        }}
    )

    return ChatResponse(
        session_id=session_id,
        message=ai_response,
        role=MessageRole.ASSISTANT,
    )


async def stream_chat(request: ChatRequest, user: dict) -> AsyncGenerator[str, None]:
    """Stream chat response token by token"""
    db = get_database()
    user_id = user["_id"]

    session = await _get_or_create_session(user_id, request.session_id, request.language)
    session_id = session["_id"]

    messages = session.get("messages", [])
    messages.append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.utcnow().isoformat(),
    })

    system_prompt = _build_system_prompt(request.language, user)
    ai_provider = get_ai_provider()
    full_response = ""

    yield f"data: {json.dumps({'session_id': session_id, 'type': 'start'})}\n\n"

    try:
        async for chunk in ai_provider.generate_stream(request.message, system_prompt, language=request.language):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
    except Exception as e:
        logger.error(f"Stream error: {e}", exc_info=True)
        lang_errors = {
            "en": "I'm temporarily unavailable. Please try again in a moment. 🌾",
            "hi": "मैं अभी व्यस्त हूँ। कृपया दोबारा कोशिश करें। 🌾",
            "kn": "ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. 🌾",
        }
        error_msg = lang_errors.get(request.language, lang_errors["en"])
        full_response = error_msg
        yield f"data: {json.dumps({'type': 'chunk', 'content': error_msg})}\n\n"

    # Save complete response
    messages.append({
        "role": "assistant",
        "content": full_response,
        "timestamp": datetime.utcnow().isoformat(),
    })

    title = session.get("title", "New Conversation")
    if len(messages) <= 2:
        title = request.message[:60] + ("..." if len(request.message) > 60 else "")

    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "messages": messages[-50:],
            "title": title,
            "updated_at": datetime.utcnow(),
        }}
    )

    yield f"data: {json.dumps({'type': 'end', 'session_id': session_id})}\n\n"


async def get_chat_sessions(user: dict) -> list:
    db = get_database()
    cursor = db.chat_sessions.find(
        {"user_id": user["_id"]},
        {"messages": 0}
    ).sort("updated_at", -1).limit(20)
    sessions = []
    async for session in cursor:
        session["_id"] = str(session["_id"])
        sessions.append(session)
    return sessions


async def get_session_messages(session_id: str, user: dict) -> dict:
    db = get_database()
    try:
        session = await db.chat_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": user["_id"]
        })
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session["_id"] = str(session["_id"])
        return session
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Session not found")


async def delete_session(session_id: str, user: dict) -> dict:
    db = get_database()
    result = await db.chat_sessions.delete_one({
        "_id": ObjectId(session_id),
        "user_id": user["_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}
