import logging
import random
from datetime import datetime
from typing import Optional
from app.models.market import MarketPrice, MarketResponse, SchemeInfo
from app.ai import get_ai_provider, SCHEME_QUERY_PROMPT

logger = logging.getLogger(__name__)

# Realistic mandi price ranges (₹/quintal) — updated May 2024 averages
CROP_PRICES = {
    "Tomato":     {"min": 600,  "max": 3200,  "modal": 1800, "unit": "quintal", "trend_bias": 0.4},
    "Onion":      {"min": 800,  "max": 2400,  "modal": 1400, "unit": "quintal", "trend_bias": 0.3},
    "Potato":     {"min": 500,  "max": 1500,  "modal": 900,  "unit": "quintal", "trend_bias": 0.2},
    "Rice":       {"min": 1900, "max": 3200,  "modal": 2400, "unit": "quintal", "trend_bias": 0.1},
    "Wheat":      {"min": 2100, "max": 2800,  "modal": 2400, "unit": "quintal", "trend_bias": 0.1},
    "Cotton":     {"min": 5800, "max": 8200,  "modal": 6800, "unit": "quintal", "trend_bias": 0.3},
    "Sugarcane":  {"min": 290,  "max": 380,   "modal": 330,  "unit": "quintal", "trend_bias": 0.1},
    "Maize":      {"min": 1500, "max": 2200,  "modal": 1800, "unit": "quintal", "trend_bias": 0.2},
    "Soybean":    {"min": 4000, "max": 5800,  "modal": 4800, "unit": "quintal", "trend_bias": 0.2},
    "Groundnut":  {"min": 4800, "max": 7200,  "modal": 5800, "unit": "quintal", "trend_bias": 0.3},
    "Turmeric":   {"min": 7000, "max": 16000, "modal": 11000,"unit": "quintal", "trend_bias": 0.4},
    "Chilli":     {"min": 5000, "max": 18000, "modal": 9000, "unit": "quintal", "trend_bias": 0.5},
    "Banana":     {"min": 700,  "max": 2200,  "modal": 1400, "unit": "quintal", "trend_bias": 0.2},
    "Mango":      {"min": 1800, "max": 6000,  "modal": 3200, "unit": "quintal", "trend_bias": 0.4},
    "Garlic":     {"min": 2000, "max": 8000,  "modal": 4500, "unit": "quintal", "trend_bias": 0.5},
    "Ginger":     {"min": 3000, "max": 12000, "modal": 6000, "unit": "quintal", "trend_bias": 0.4},
}

MARKETS_BY_STATE = {
    "Karnataka":    [("APMC Bangalore", "Bangalore"), ("APMC Hubli", "Dharwad"), ("APMC Mysore", "Mysore"), ("APMC Belgaum", "Belgaum")],
    "Maharashtra":  [("Vashi APMC", "Navi Mumbai"), ("Gultekdi Market", "Pune"), ("Lasalgaon APMC", "Nashik"), ("Nagpur APMC", "Nagpur")],
    "Delhi":        [("Azadpur Mandi", "Delhi"), ("Okhla Mandi", "Delhi")],
    "Tamil Nadu":   [("Koyambedu Market", "Chennai"), ("Coimbatore APMC", "Coimbatore")],
    "Telangana":    [("Gaddiannaram Market", "Hyderabad"), ("Bowenpally Market", "Hyderabad")],
    "Andhra Pradesh": [("Kurnool APMC", "Kurnool"), ("Guntur APMC", "Guntur")],
    "Uttar Pradesh": [("Lucknow APMC", "Lucknow"), ("Agra APMC", "Agra"), ("Kanpur APMC", "Kanpur")],
    "Punjab":       [("Amritsar APMC", "Amritsar"), ("Ludhiana APMC", "Ludhiana")],
    "Gujarat":      [("Ahmedabad APMC", "Ahmedabad"), ("Rajkot APMC", "Rajkot")],
    "Rajasthan":    [("Jaipur APMC", "Jaipur"), ("Jodhpur APMC", "Jodhpur")],
}
DEFAULT_MARKETS = [("APMC Market", "Local"), ("State APMC", "District HQ")]

MARKET_AI_PROMPT = """You are an expert agricultural market analyst for India.

Current mandi prices (₹/quintal):
{price_data}

Today's date: {today}
State: {state}

Provide a concise market analysis in {language}:
1. **Market Trend**: Overall price trend (2-3 sentences)
2. **Best Crops to Sell Now**: Which crops have favorable prices and why
3. **Hold Recommendation**: Which crops farmers should hold for better prices
4. **Price Forecast**: Expected price movement in next 2 weeks
5. **Selling Tips**: 2-3 practical tips for farmers

Keep the response practical, specific, and farmer-friendly. Use simple language."""

GOVERNMENT_SCHEMES = [
    SchemeInfo(
        id="pm-kisan",
        name="PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        description="Direct income support of ₹6,000 per year to eligible farmer families in 3 installments",
        eligibility=["Small and marginal farmers", "Land holding up to 2 hectares", "Valid Aadhaar card required", "Bank account linked to Aadhaar"],
        benefits=["₹6,000 per year in 3 installments of ₹2,000 each", "Direct bank transfer — no middlemen", "Covers all crop seasons"],
        how_to_apply=["Visit pmkisan.gov.in or nearest CSC center", "Register with Aadhaar and bank account details", "Village Patwari/Lekhpal verification", "Funds transferred directly to bank within 2 weeks"],
        ministry="Ministry of Agriculture & Farmers Welfare",
        link="https://pmkisan.gov.in",
        category="subsidy",
    ),
    SchemeInfo(
        id="pmfby",
        name="PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        description="Comprehensive crop insurance providing financial support against crop loss due to natural calamities",
        eligibility=["All farmers growing notified crops", "Both loanee and non-loanee farmers", "Sharecroppers and tenant farmers eligible"],
        benefits=["Premium as low as 1.5% for Rabi, 2% for Kharif crops", "Full coverage for crop loss due to drought, flood, pest", "Quick claim settlement within 2 months"],
        how_to_apply=["Contact nearest bank or insurance company before sowing", "Fill application form with land and crop details", "Pay premium amount", "Get policy document and keep safe"],
        ministry="Ministry of Agriculture & Farmers Welfare",
        link="https://pmfby.gov.in",
        category="insurance",
    ),
    SchemeInfo(
        id="kcc",
        name="Kisan Credit Card (KCC)",
        description="Flexible credit facility for farmers to meet agricultural, allied, and personal needs at low interest",
        eligibility=["All farmers including tenant farmers", "Self Help Groups (SHGs)", "Joint Liability Groups (JLGs)"],
        benefits=["Credit up to ₹3 lakh at just 4% interest (with subsidy)", "Flexible repayment aligned with harvest season", "Personal accident insurance of ₹50,000 included", "No collateral required up to ₹1.6 lakh"],
        how_to_apply=["Visit nearest bank branch with land documents", "Fill KCC application form", "Submit Aadhaar, land records, passport photo", "Card issued within 2 weeks of approval"],
        ministry="Ministry of Finance / NABARD",
        link="https://www.nabard.org",
        category="loan",
    ),
    SchemeInfo(
        id="soil-health-card",
        name="Soil Health Card Scheme",
        description="Free soil testing every 2 years with crop-wise fertilizer recommendations to reduce input costs",
        eligibility=["All farmers across India", "Completely free of cost"],
        benefits=["Free soil testing for 12 parameters", "Crop-specific fertilizer recommendations", "Reduces fertilizer costs by 10-15%", "Improves soil health and yield"],
        how_to_apply=["Contact local agriculture department or Krishi Vigyan Kendra", "Submit soil sample (500g from 6-inch depth)", "Receive card with recommendations within 30 days"],
        ministry="Ministry of Agriculture & Farmers Welfare",
        link="https://soilhealth.dac.gov.in",
        category="subsidy",
    ),
    SchemeInfo(
        id="pm-kusum",
        name="PM-KUSUM (Solar Pump Scheme)",
        description="Solar-powered irrigation pumps with up to 90% subsidy to reduce diesel and electricity costs",
        eligibility=["Individual farmers", "Farmer groups and cooperatives", "Water User Associations"],
        benefits=["90% subsidy on solar pump installation", "Eliminate diesel/electricity costs for irrigation", "Sell surplus solar power to grid and earn extra income", "Pumps of 2HP to 10HP capacity available"],
        how_to_apply=["Apply on state agriculture department portal", "Submit land ownership and bank documents", "Pay 10% farmer contribution", "Installation completed within 90 days"],
        ministry="Ministry of New and Renewable Energy",
        link="https://mnre.gov.in",
        category="subsidy",
    ),
    SchemeInfo(
        id="e-nam",
        name="e-NAM (National Agriculture Market)",
        description="Online trading platform connecting farmers directly to buyers across India for better prices",
        eligibility=["All farmers with produce to sell", "Registered with local APMC mandi"],
        benefits=["Access to buyers across India", "Transparent price discovery", "Direct payment to bank account", "Reduced commission charges"],
        how_to_apply=["Register at enam.gov.in with Aadhaar and bank details", "Get produce quality tested at mandi", "List produce on platform", "Accept best bid and receive payment"],
        ministry="Ministry of Agriculture & Farmers Welfare",
        link="https://enam.gov.in",
        category="subsidy",
    ),
]


async def get_market_prices(
    state: Optional[str] = None,
    district: Optional[str] = None,
    crop_name: Optional[str] = None,
    language: str = "en"
) -> MarketResponse:
    """Get market prices with AI-powered recommendations"""
    try:
        prices = []
        crops_to_show = [crop_name] if crop_name else list(CROP_PRICES.keys())

        # Get markets for the state
        markets = MARKETS_BY_STATE.get(state, DEFAULT_MARKETS) if state else [
            m for ms in list(MARKETS_BY_STATE.values())[:3] for m in ms[:2]
        ]

        today = datetime.now().strftime("%Y-%m-%d")

        for crop in crops_to_show:
            if crop not in CROP_PRICES:
                continue
            base = CROP_PRICES[crop]
            # Each crop appears in 2-3 markets with slight price variation
            selected_markets = random.sample(markets, min(3, len(markets)))
            for market_name, market_district in selected_markets:
                variation = random.uniform(0.88, 1.12)
                modal = round(base["modal"] * variation)
                min_p = round(base["min"] * variation)
                max_p = round(base["max"] * variation)

                # Determine trend based on bias + randomness
                rand = random.random()
                if rand < base["trend_bias"]:
                    trend = "up"
                elif rand < base["trend_bias"] + 0.3:
                    trend = "down"
                else:
                    trend = "stable"

                prices.append(MarketPrice(
                    crop_name=crop,
                    market_name=market_name,
                    state=state or "India",
                    district=market_district,
                    min_price=min_p,
                    max_price=max_p,
                    modal_price=modal,
                    unit=base["unit"],
                    date=today,
                    trend=trend,
                ))

        # Build price summary for AI
        price_summary_lines = []
        seen_crops = set()
        for p in prices:
            if p.crop_name not in seen_crops:
                seen_crops.add(p.crop_name)
                price_summary_lines.append(
                    f"- {p.crop_name}: ₹{p.min_price}–₹{p.max_price}/qtl (modal ₹{p.modal_price}) | Trend: {p.trend}"
                )

        price_summary = "\n".join(price_summary_lines[:12])

        ai_prompt = MARKET_AI_PROMPT.format(
            price_data=price_summary,
            today=today,
            state=state or "India",
            language=language
        )

        ai_provider = get_ai_provider()
        ai_recommendation = await ai_provider.generate(ai_prompt, language=language)

        # Determine best time to sell
        up_trending = [p.crop_name for p in prices if p.trend == "up"]
        best_time = f"Sell {', '.join(up_trending[:3])} now (prices rising)" if up_trending else "Morning hours (6–10 AM) for best prices at mandi"

        return MarketResponse(
            prices=prices,
            ai_recommendation=ai_recommendation,
            best_time_to_sell=best_time,
            market_trend="Mixed — some crops rising, others stable",
        )

    except Exception as e:
        logger.error(f"Market service error: {e}", exc_info=True)
        return MarketResponse(
            prices=[],
            ai_recommendation="Unable to fetch market data. Please try again.",
            best_time_to_sell="Morning hours (6–10 AM)",
            market_trend="Unknown",
        )


async def get_government_schemes(
    state: Optional[str] = None,
    category: Optional[str] = None,
    query: Optional[str] = None,
    language: str = "en"
) -> dict:
    """Get government schemes with optional AI explanation"""
    try:
        schemes = GOVERNMENT_SCHEMES
        if category:
            schemes = [s for s in schemes if s.category == category]

        if query:
            ai_prompt = SCHEME_QUERY_PROMPT.format(
                query=query,
                state=state or "India",
                profile="General farmer",
                language=language
            )
            ai_provider = get_ai_provider()
            ai_explanation = await ai_provider.generate(ai_prompt, language=language)
        else:
            ai_explanation = (
                "Here are the key government schemes for Indian farmers. "
                "PM-KISAN gives ₹6,000/year directly to your bank. "
                "PMFBY provides crop insurance at very low premium. "
                "Apply for Kisan Credit Card for easy credit at 4% interest."
            )

        return {
            "schemes": [s.dict() for s in schemes],
            "ai_explanation": ai_explanation,
            "total": len(schemes),
        }

    except Exception as e:
        logger.error(f"Schemes service error: {e}", exc_info=True)
        return {"schemes": [s.dict() for s in GOVERNMENT_SCHEMES], "ai_explanation": "", "total": len(GOVERNMENT_SCHEMES)}
