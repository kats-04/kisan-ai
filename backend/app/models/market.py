from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MarketPrice(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    market_name: str
    state: str
    district: str
    min_price: float
    max_price: float
    modal_price: float
    unit: str = "quintal"
    date: str
    trend: str = "stable"  # up | down | stable


class MarketRequest(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    crop_name: Optional[str] = None
    language: str = "en"


class MarketResponse(BaseModel):
    prices: List[MarketPrice] = []
    ai_recommendation: str
    best_time_to_sell: str
    market_trend: str
    fetched_at: datetime = Field(default_factory=datetime.utcnow)


class SchemeInfo(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    eligibility: List[str] = []
    benefits: List[str] = []
    how_to_apply: List[str] = []
    deadline: Optional[str] = None
    ministry: str
    link: Optional[str] = None
    category: str  # subsidy | loan | insurance | training


class SchemeRequest(BaseModel):
    state: Optional[str] = None
    category: Optional[str] = None
    query: Optional[str] = None
    language: str = "en"
