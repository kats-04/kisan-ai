from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.services.market_service import get_market_prices, get_government_schemes
from app.middleware import get_optional_user

router = APIRouter(prefix="/market", tags=["Market Intelligence"])


@router.get("/prices", summary="Get mandi prices with AI recommendations")
async def market_prices(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    crop: Optional[str] = Query(None, description="Specific crop name"),
    language: str = Query("en"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    if current_user and not state:
        profile = current_user.get("profile", {})
        state = profile.get("state")
        district = district or profile.get("district")

    return await get_market_prices(state=state, district=district, crop_name=crop, language=language)


@router.get("/schemes", summary="Get government agricultural schemes")
async def government_schemes(
    state: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="subsidy | loan | insurance | training"),
    query: Optional[str] = Query(None, description="Search query"),
    language: str = Query("en"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    if current_user and not state:
        profile = current_user.get("profile", {})
        state = profile.get("state")

    return await get_government_schemes(state=state, category=category, query=query, language=language)
