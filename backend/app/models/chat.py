from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatSession(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str = "New Conversation"
    messages: List[ChatMessage] = []
    language: str = "en"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"
    stream: bool = False


class ChatResponse(BaseModel):
    session_id: str
    message: str
    role: MessageRole = MessageRole.ASSISTANT
    timestamp: datetime = Field(default_factory=datetime.utcnow)
