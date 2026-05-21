import logging
import json
from app.models.crop import (
    CropRecommendationRequest, CropRecommendationResponse,
    CropRecommendation, DiseaseDetectionRequest, DiseaseDetectionResponse
)
from app.ai import get_ai_provider, CROP_RECOMMENDATION_PROMPT

logger = logging.getLogger(__name__)

CROP_DATABASE = {
    "kharif": {
        "alluvial": ["Rice", "Maize", "Cotton", "Sugarcane", "Groundnut", "Soybean"],
        "black": ["Cotton", "Soybean", "Sorghum", "Sunflower", "Maize"],
        "red": ["Groundnut", "Millets", "Pulses", "Maize", "Sorghum"],
        "laterite": ["Cashew", "Coconut", "Rubber", "Tapioca", "Pepper"],
        "sandy": ["Groundnut", "Watermelon", "Millets", "Cowpea"],
    },
    "rabi": {
        "alluvial": ["Wheat", "Mustard", "Peas", "Potato", "Barley"],
        "black": ["Wheat", "Chickpea", "Linseed", "Safflower"],
        "red": ["Wheat", "Chickpea", "Mustard", "Lentil"],
        "laterite": ["Potato", "Tomato", "Cabbage", "Cauliflower"],
        "sandy": ["Mustard", "Barley", "Chickpea"],
    },
    "zaid": {
        "alluvial": ["Watermelon", "Muskmelon", "Cucumber", "Moong", "Sunflower"],
        "black": ["Sunflower", "Moong", "Urad"],
        "red": ["Watermelon", "Moong", "Cowpea"],
        "laterite": ["Vegetables", "Moong"],
        "sandy": ["Watermelon", "Muskmelon", "Moong"],
    }
}

DISEASE_VISION_PROMPT = """You are an expert plant pathologist and agricultural scientist.
Carefully analyze this crop image and provide a detailed disease/pest diagnosis.

Respond ONLY in valid JSON format with this exact structure:
{{
  "disease_name": "Name of disease or pest (e.g. Early Blight, Powdery Mildew, Aphid Infestation)",
  "confidence": 85,
  "severity": "medium",
  "affected_area": "Description of what part is affected and how much",
  "organic_solutions": [
    "Specific organic treatment 1",
    "Specific organic treatment 2",
    "Specific organic treatment 3"
  ],
  "chemical_solutions": [
    "Specific chemical with dosage 1",
    "Specific chemical with dosage 2",
    "Specific chemical with dosage 3"
  ],
  "prevention_tips": [
    "Prevention tip 1",
    "Prevention tip 2",
    "Prevention tip 3",
    "Prevention tip 4"
  ],
  "ai_analysis": "Detailed 2-3 sentence analysis of what you see in the image, the likely cause, and urgency of treatment."
}}

Crop type (if known): {crop_type}
Response language: {language}

Important: severity must be one of: low, medium, high, critical
confidence must be a number 0-100
Return ONLY the JSON, no other text."""


async def get_crop_recommendations(request: CropRecommendationRequest) -> CropRecommendationResponse:
    """Generate AI-powered crop recommendations"""
    try:
        prompt = CROP_RECOMMENDATION_PROMPT.format(
            soil_type=request.soil_type,
            state=request.state,
            region=request.region,
            water_availability=request.water_availability,
            season=request.season,
            farm_size=request.farm_size or "Not specified",
            budget=request.budget or "medium",
            language=request.language
        )

        ai_provider = get_ai_provider()
        ai_response = await ai_provider.generate(prompt, language=request.language)

        recommendations = _parse_ai_recommendations(ai_response, request)
        if not recommendations:
            recommendations = _get_db_recommendations(request)

        best_crop = recommendations[0].crop_name if recommendations else "Consult local agriculture officer"

        # Clean up AI summary — strip JSON blocks, keep readable text
        summary = ai_response
        import re
        summary = re.sub(r'```(?:json)?\s*\{.*?\}\s*```', '', summary, flags=re.DOTALL).strip()
        summary = re.sub(r'\{[^{}]{0,2000}\}', '', summary, flags=re.DOTALL).strip()
        if not summary or len(summary) < 30:
            summary = f"Based on your {request.soil_type} soil in {request.state}, {best_crop} is the best crop for {request.season} season with good yield potential and market demand."

        return CropRecommendationResponse(
            recommendations=recommendations[:5],
            ai_summary=summary[:600],
            best_crop=best_crop,
            season_advice=_get_season_advice(request.season, request.language),
        )

    except Exception as e:
        logger.error(f"Crop recommendation error: {e}")
        recommendations = _get_db_recommendations(request)
        return CropRecommendationResponse(
            recommendations=recommendations,
            ai_summary="Based on your soil and region, here are the best crops for this season.",
            best_crop=recommendations[0].crop_name if recommendations else "Rice",
            season_advice=_get_season_advice(request.season, request.language),
        )


def _parse_ai_recommendations(ai_response: str, request: CropRecommendationRequest) -> list:
    try:
        import re
        json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            recommendations = []
            for item in data[:5]:
                recommendations.append(CropRecommendation(
                    crop_name=item.get("crop_name", "Unknown"),
                    local_name=item.get("local_name"),
                    suitability_score=float(item.get("suitability_score", 75)),
                    expected_yield=item.get("expected_yield", "15-20 quintals/acre"),
                    estimated_profit=item.get("estimated_profit", "₹20,000-30,000/acre"),
                    duration_days=int(item.get("duration_days", 120)),
                    water_requirement=item.get("water_requirement", "Medium"),
                    tips=item.get("tips", [])[:3],
                    risks=item.get("risks", [])[:2],
                ))
            return recommendations
    except Exception:
        pass
    return []


def _get_db_recommendations(request: CropRecommendationRequest) -> list:
    season_crops = CROP_DATABASE.get(request.season.lower(), CROP_DATABASE["kharif"])
    soil_key = request.soil_type.lower().split()[0]
    crops = season_crops.get(soil_key, season_crops.get("alluvial", ["Rice", "Wheat", "Maize"]))

    crop_details = {
        "Rice": {"yield": "20-25 quintals/acre", "profit": "₹25,000-35,000/acre", "days": 120, "water": "High"},
        "Wheat": {"yield": "15-20 quintals/acre", "profit": "₹20,000-28,000/acre", "days": 110, "water": "Medium"},
        "Cotton": {"yield": "8-12 quintals/acre", "profit": "₹40,000-60,000/acre", "days": 180, "water": "Medium"},
        "Maize": {"yield": "25-30 quintals/acre", "profit": "₹20,000-30,000/acre", "days": 90, "water": "Medium"},
        "Soybean": {"yield": "10-15 quintals/acre", "profit": "₹25,000-40,000/acre", "days": 100, "water": "Low"},
        "Groundnut": {"yield": "8-12 quintals/acre", "profit": "₹30,000-45,000/acre", "days": 120, "water": "Low"},
        "Tomato": {"yield": "80-120 quintals/acre", "profit": "₹60,000-1,20,000/acre", "days": 75, "water": "High"},
        "Onion": {"yield": "60-80 quintals/acre", "profit": "₹40,000-80,000/acre", "days": 120, "water": "Medium"},
    }

    recommendations = []
    for i, crop in enumerate(crops[:5]):
        details = crop_details.get(crop, {"yield": "15-20 quintals/acre", "profit": "₹20,000-30,000/acre", "days": 120, "water": "Medium"})
        recommendations.append(CropRecommendation(
            crop_name=crop,
            suitability_score=90 - (i * 5),
            expected_yield=details["yield"],
            estimated_profit=details["profit"],
            duration_days=details["days"],
            water_requirement=details["water"],
            tips=[
                f"Best suited for {request.soil_type} soil",
                f"Ideal for {request.season} season in {request.state}",
                "Use certified seeds for better yield",
            ],
            risks=["Market price fluctuation", "Pest and disease risk"],
        ))
    return recommendations


def _get_season_advice(season: str, language: str) -> str:
    advice = {
        "kharif": "Kharif season (June-November): Sow after first monsoon rains. Ensure proper drainage.",
        "rabi": "Rabi season (November-April): Sow after monsoon. Irrigation is critical.",
        "zaid": "Zaid season (March-June): Short duration crops. Ensure adequate water supply.",
    }
    return advice.get(season.lower(), "Consult local agriculture department for season-specific advice.")


async def detect_disease(request: DiseaseDetectionRequest) -> DiseaseDetectionResponse:
    """Detect crop disease from image using Gemini Vision"""
    try:
        ai_provider = get_ai_provider()

        prompt = DISEASE_VISION_PROMPT.format(
            crop_type=request.crop_type or "Unknown (please identify from image)",
            language=request.language
        )

        # Use vision analysis if Gemini, else text fallback
        if hasattr(ai_provider, 'analyze_image'):
            raw_response = await ai_provider.analyze_image(
                image_base64=request.image_base64,
                prompt=prompt,
                language=request.language,
            )
        else:
            raw_response = await ai_provider.generate(
                f"Analyze a crop disease image. Crop: {request.crop_type or 'unknown'}. {prompt}",
                language=request.language,
            )

        logger.info(f"Disease detection raw response: {raw_response[:200]}")

        # Parse JSON from response
        result = _parse_disease_response(raw_response)

        return DiseaseDetectionResponse(
            disease_name=result.get("disease_name", "Disease Detected"),
            confidence=float(result.get("confidence", 75)),
            severity=result.get("severity", "medium"),
            affected_area=result.get("affected_area", "Visible on leaves and stems"),
            organic_solutions=result.get("organic_solutions", [
                "Spray neem oil @ 5ml/L water",
                "Apply Trichoderma viride solution",
                "Use garlic-chilli extract spray"
            ]),
            chemical_solutions=result.get("chemical_solutions", [
                "Spray Mancozeb 75% WP @ 2g/L",
                "Apply Carbendazim 50% WP @ 1g/L",
                "Use Copper oxychloride @ 3g/L"
            ]),
            prevention_tips=result.get("prevention_tips", [
                "Regular field monitoring",
                "Maintain proper plant spacing",
                "Avoid waterlogging",
                "Use disease-resistant varieties"
            ]),
            ai_analysis=result.get("ai_analysis", raw_response[:500] if len(raw_response) > 500 else raw_response),
        )

    except Exception as e:
        logger.error(f"Disease detection error: {e}", exc_info=True)
        return DiseaseDetectionResponse(
            disease_name="Analysis Failed",
            confidence=0,
            severity="unknown",
            affected_area="Could not analyze image",
            organic_solutions=["Please try again with a clearer image", "Consult local agriculture officer"],
            chemical_solutions=["Consult local agriculture officer"],
            prevention_tips=["Regular crop monitoring", "Maintain field hygiene"],
            ai_analysis=f"Error during analysis: {str(e)}. Please ensure the image is clear and try again.",
        )


def _parse_disease_response(raw: str) -> dict:
    """Extract JSON from AI response"""
    import re
    try:
        # Try direct JSON parse
        return json.loads(raw.strip())
    except Exception:
        pass
    try:
        # Extract JSON block from markdown
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if match:
            return json.loads(match.group(1))
    except Exception:
        pass
    try:
        # Find first { ... } block
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    # Return raw as analysis if all parsing fails
    return {"ai_analysis": raw, "disease_name": "See AI Analysis", "confidence": 70, "severity": "medium", "affected_area": "See AI Analysis"}
