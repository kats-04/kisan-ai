from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CropRecommendationRequest(BaseModel):
    soil_type: str
    region: str
    state: str
    water_availability: str  # low | medium | high
    season: str  # kharif | rabi | zaid
    farm_size: Optional[float] = None
    budget: Optional[str] = None  # low | medium | high
    language: str = "en"


class CropRecommendation(BaseModel):
    crop_name: str
    local_name: Optional[str] = None
    suitability_score: float  # 0-100
    expected_yield: str
    estimated_profit: str
    duration_days: int
    water_requirement: str
    tips: List[str] = []
    risks: List[str] = []


class CropRecommendationResponse(BaseModel):
    recommendations: List[CropRecommendation]
    ai_summary: str
    best_crop: str
    season_advice: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class DiseaseDetectionRequest(BaseModel):
    image_base64: str
    crop_type: Optional[str] = None
    language: str = "en"


class DiseaseDetectionResponse(BaseModel):
    disease_name: str
    confidence: float
    severity: str  # low | medium | high | critical
    affected_area: str
    organic_solutions: List[str] = []
    chemical_solutions: List[str] = []
    prevention_tips: List[str] = []
    ai_analysis: str
    detected_at: datetime = Field(default_factory=datetime.utcnow)
