from fastapi import APIRouter, Depends
from app.models.crop import CropRecommendationRequest, DiseaseDetectionRequest
from app.services.crop_service import get_crop_recommendations, detect_disease
from app.middleware import get_current_user, get_optional_user
from typing import Optional

router = APIRouter(prefix="/crops", tags=["Crop Intelligence"])


@router.post("/recommend", summary="Get AI crop recommendations")
async def recommend_crops(
    request: CropRecommendationRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    # Auto-fill from user profile if available
    if current_user:
        profile = current_user.get("profile", {})
        if not request.soil_type and profile.get("soil_type"):
            request.soil_type = profile["soil_type"]
        if not request.state and profile.get("state"):
            request.state = profile["state"]
        if not request.region and profile.get("district"):
            request.region = profile["district"]

    return await get_crop_recommendations(request)


@router.post("/detect-disease", summary="Detect crop disease from image")
async def disease_detection(
    request: DiseaseDetectionRequest,
    current_user: dict = Depends(get_current_user)
):
    return await detect_disease(request)
