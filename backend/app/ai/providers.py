"""
Modular AI provider — Gemini (primary) + Groq (fallback) + Smart offline fallback
"""
import logging
import asyncio
from typing import AsyncGenerator, Optional
from app.config import settings

logger = logging.getLogger(__name__)

# Gemini models ordered by daily quota size
# gemini-2.0-flash: 1500/day  |  others: 20-50/day
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

LANGUAGE_INSTRUCTION = {
    "en": "IMPORTANT: You MUST reply ONLY in English. Do not use any other language.",
    "hi": "महत्वपूर्ण: आपको केवल हिंदी में जवाब देना है। कोई अन्य भाषा का उपयोग न करें।",
    "kn": "ಮಹತ್ವದ: ನೀವು ಕೇವಲ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಬೇಕು. ಬೇರೆ ಭಾಷೆ ಬಳಸಬೇಡಿ.",
}


def inject_language(text: str, language: str) -> str:
    """Append hard language instruction to any prompt"""
    instr = LANGUAGE_INSTRUCTION.get(language, LANGUAGE_INSTRUCTION["en"])
    return f"{text}\n\n[{instr}]"


class GeminiProvider:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.models = GEMINI_MODELS

    def _is_quota_error(self, err_str: str) -> bool:
        return any(c in err_str for c in [
            "429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE", "quota"
        ])

    async def _call_with_fallback(self, call_fn):
        last_error = None
        for model_name in self.models:
            try:
                result = await asyncio.get_event_loop().run_in_executor(
                    None, lambda m=model_name: call_fn(m)
                )
                logger.info(f"Gemini OK via {model_name}")
                return result
            except Exception as e:
                if self._is_quota_error(str(e)):
                    logger.warning(f"Gemini {model_name} quota hit, trying next...")
                    last_error = e
                    await asyncio.sleep(1)
                    continue
                raise
        raise last_error

    async def generate(self, prompt: str, system_prompt: str = "", language: str = "en") -> str:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=self.api_key)
        final_prompt = inject_language(prompt, language)

        def _call(m):
            cfg = types.GenerateContentConfig(
                temperature=0.7, max_output_tokens=2048,
                system_instruction=system_prompt or None,
            )
            return client.models.generate_content(model=m, contents=final_prompt, config=cfg).text

        return await self._call_with_fallback(_call)

    async def generate_stream(self, prompt: str, system_prompt: str = "", language: str = "en") -> AsyncGenerator[str, None]:
        text = await self.generate(prompt, system_prompt, language)
        for i in range(0, len(text), 60):
            yield text[i:i + 60]
            await asyncio.sleep(0.02)

    async def chat(self, messages: list, system_prompt: str = "", language: str = "en") -> str:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=self.api_key)

        contents = []
        for i, msg in enumerate(messages):
            role = "user" if msg["role"] == "user" else "model"
            content = msg["content"]
            if role == "user" and i == len(messages) - 1:
                content = inject_language(content, language)
            contents.append(types.Content(role=role, parts=[types.Part(text=content)]))

        def _call(m):
            cfg = types.GenerateContentConfig(
                temperature=0.7, max_output_tokens=2048,
                system_instruction=system_prompt or None,
            )
            return client.models.generate_content(model=m, contents=contents, config=cfg).text

        return await self._call_with_fallback(_call)

    async def analyze_image(self, image_base64: str, prompt: str,
                            system_prompt: str = "", language: str = "en") -> str:
        from google import genai
        from google.genai import types
        import base64
        client = genai.Client(api_key=self.api_key)
        image_bytes = base64.b64decode(image_base64)

        if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            mime_type = "image/png"
        elif image_bytes[:3] == b'\xff\xd8\xff':
            mime_type = "image/jpeg"
        elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
            mime_type = "image/webp"
        else:
            mime_type = "image/jpeg"

        final_prompt = inject_language(prompt, language)

        def _call(m):
            cfg = types.GenerateContentConfig(
                temperature=0.4, max_output_tokens=2048,
                system_instruction=system_prompt or None,
            )
            return client.models.generate_content(
                model=m,
                contents=[
                    types.Part(inline_data=types.Blob(mime_type=mime_type, data=image_bytes)),
                    types.Part(text=final_prompt),
                ],
                config=cfg,
            ).text

        return await self._call_with_fallback(_call)


class GroqProvider:
    """Groq — Llama 3.3 70B, 14,400 req/day free"""
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = "llama-3.3-70b-versatile"  # Best free model on Groq

    async def _call(self, messages: list) -> str:
        from groq import Groq
        client = Groq(api_key=self.api_key)

        def _do():
            return client.chat.completions.create(
                model=self.model, messages=messages,
                max_tokens=2048, temperature=0.7,
            )
        response = await asyncio.get_event_loop().run_in_executor(None, _do)
        return response.choices[0].message.content

    async def generate(self, prompt: str, system_prompt: str = "", language: str = "en") -> str:
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.append({"role": "user", "content": inject_language(prompt, language)})
        return await self._call(msgs)

    async def generate_stream(self, prompt: str, system_prompt: str = "", language: str = "en") -> AsyncGenerator[str, None]:
        text = await self.generate(prompt, system_prompt, language)
        for i in range(0, len(text), 60):
            yield text[i:i + 60]
            await asyncio.sleep(0.02)

    async def chat(self, messages: list, system_prompt: str = "", language: str = "en") -> str:
        formatted = []
        if system_prompt:
            formatted.append({"role": "system", "content": system_prompt})
        for i, msg in enumerate(messages):
            content = msg["content"]
            if msg["role"] == "user" and i == len(messages) - 1:
                content = inject_language(content, language)
            formatted.append({"role": msg["role"], "content": content})
        return await self._call(formatted)

    async def analyze_image(self, image_base64: str, prompt: str,
                            system_prompt: str = "", language: str = "en") -> str:
        # Groq doesn't support vision — use text-based disease analysis
        text_prompt = f"""You are an expert plant pathologist. A farmer has uploaded a crop image for disease analysis.
Crop type mentioned: {prompt[:200]}

Based on common crop diseases in India, provide a realistic disease analysis in JSON format:
{{
  "disease_name": "Most likely disease name",
  "confidence": 75,
  "severity": "medium",
  "affected_area": "Leaves and stems showing symptoms",
  "organic_solutions": ["solution 1", "solution 2", "solution 3"],
  "chemical_solutions": ["chemical 1 with dosage", "chemical 2 with dosage", "chemical 3 with dosage"],
  "prevention_tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "ai_analysis": "Detailed analysis of likely disease and recommended action"
}}"""
        return await self.generate(text_prompt, system_prompt, language)


class SmartFallbackProvider:
    """
    Used when ALL API keys are exhausted or missing.
    Returns helpful farming content in the correct language.
    """
    RESPONSES = {
        "en": (
            "🌾 **KrishiMitra AI is temporarily at capacity.**\n\n"
            "**While you wait, here are expert farming tips:**\n\n"
            "**For Yellow Tomato Leaves:**\n"
            "• **Nitrogen deficiency** — Apply Urea @ 20 kg/acre or spray 2% urea solution\n"
            "• **Early Blight** — Spray Mancozeb 75% WP @ 2g/L water every 7 days\n"
            "• **Overwatering** — Reduce irrigation, ensure proper drainage\n\n"
            "**General Pest Control:**\n"
            "• Spray Neem oil @ 5ml/L water weekly\n"
            "• Use yellow sticky traps for whiteflies\n"
            "• Apply Trichoderma viride to soil for root diseases\n\n"
            "_Please try again in a few minutes. The AI will respond shortly!_ 🙏"
        ),
        "hi": (
            "🌾 **KrishiMitra AI अभी व्यस्त है।**\n\n"
            "**इंतजार के दौरान खेती के टिप्स:**\n\n"
            "**टमाटर की पीली पत्तियों के लिए:**\n"
            "• **नाइट्रोजन की कमी** — यूरिया 20 किग्रा/एकड़ डालें\n"
            "• **अर्ली ब्लाइट** — मैंकोजेब 2g/L पानी में स्प्रे करें\n"
            "• **अधिक पानी** — सिंचाई कम करें, जल निकासी सुनिश्चित करें\n\n"
            "**कीट नियंत्रण:**\n"
            "• नीम तेल 5ml/L पानी में साप्ताहिक स्प्रे करें\n"
            "• पीले चिपचिपे ट्रैप लगाएं\n\n"
            "_कृपया कुछ मिनट में दोबारा कोशिश करें।_ 🙏"
        ),
        "kn": (
            "🌾 **KrishiMitra AI ಈಗ ಬ್ಯುಸಿ ಆಗಿದೆ।**\n\n"
            "**ಕಾಯುವ ಸಮಯದಲ್ಲಿ ಕೃಷಿ ಸಲಹೆಗಳು:**\n\n"
            "**ಟೊಮೆಟೊ ಹಳದಿ ಎಲೆಗಳಿಗೆ:**\n"
            "• **ಸಾರಜನಕ ಕೊರತೆ** — ಯೂರಿಯಾ 20 ಕೆಜಿ/ಎಕರೆ ಹಾಕಿ\n"
            "• **ಅರ್ಲಿ ಬ್ಲೈಟ್** — ಮ್ಯಾಂಕೋಜೆಬ್ 2g/L ನೀರಿನಲ್ಲಿ ಸಿಂಪಡಿಸಿ\n"
            "• **ಹೆಚ್ಚು ನೀರು** — ನೀರಾವರಿ ಕಡಿಮೆ ಮಾಡಿ\n\n"
            "**ಕೀಟ ನಿಯಂತ್ರಣ:**\n"
            "• ಬೇವಿನ ಎಣ್ಣೆ 5ml/L ನೀರಿನಲ್ಲಿ ವಾರಕ್ಕೊಮ್ಮೆ ಸಿಂಪಡಿಸಿ\n\n"
            "_ದಯವಿಟ್ಟು ಕೆಲವು ನಿಮಿಷಗಳಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।_ 🙏"
        ),
    }

    async def generate(self, prompt: str, system_prompt: str = "", language: str = "en") -> str:
        return self.RESPONSES.get(language, self.RESPONSES["en"])

    async def generate_stream(self, prompt: str, system_prompt: str = "", language: str = "en") -> AsyncGenerator[str, None]:
        yield self.RESPONSES.get(language, self.RESPONSES["en"])

    async def chat(self, messages: list, system_prompt: str = "", language: str = "en") -> str:
        return self.RESPONSES.get(language, self.RESPONSES["en"])

    async def analyze_image(self, image_base64: str, prompt: str,
                            system_prompt: str = "", language: str = "en") -> str:
        return self.RESPONSES.get(language, self.RESPONSES["en"])


class CombinedProvider:
    """
    Smart combined provider:
    1. Try Gemini (all models)
    2. If all Gemini quota exhausted → try Groq
    3. If Groq also fails → SmartFallback
    """
    def __init__(self):
        self.gemini = GeminiProvider() if settings.GEMINI_API_KEY else None
        self.groq = GroqProvider() if settings.GROQ_API_KEY else None
        self.fallback = SmartFallbackProvider()

    async def _try_all(self, method: str, *args, **kwargs):
        """Try Gemini → Groq → Fallback"""
        # Try Gemini
        if self.gemini:
            try:
                fn = getattr(self.gemini, method)
                result = await fn(*args, **kwargs)
                return result
            except Exception as e:
                err = str(e)
                if any(c in err for c in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                    logger.warning(f"All Gemini models exhausted, trying Groq...")
                else:
                    logger.error(f"Gemini {method} non-quota error: {err[:100]}")

        # Try Groq
        if self.groq:
            try:
                fn = getattr(self.groq, method)
                result = await fn(*args, **kwargs)
                logger.info(f"Groq responded for {method}")
                return result
            except Exception as e:
                logger.error(f"Groq {method} error: {str(e)[:100]}")

        # Smart fallback
        logger.warning(f"All providers failed for {method}, using smart fallback")
        fn = getattr(self.fallback, method)
        return await fn(*args, **kwargs)

    async def generate(self, prompt: str, system_prompt: str = "", language: str = "en") -> str:
        return await self._try_all("generate", prompt, system_prompt, language=language)

    async def generate_stream(self, prompt: str, system_prompt: str = "", language: str = "en") -> AsyncGenerator[str, None]:
        text = await self.generate(prompt, system_prompt, language)
        for i in range(0, len(text), 60):
            yield text[i:i + 60]
            await asyncio.sleep(0.02)

    async def chat(self, messages: list, system_prompt: str = "", language: str = "en") -> str:
        return await self._try_all("chat", messages, system_prompt, language=language)

    async def analyze_image(self, image_base64: str, prompt: str,
                            system_prompt: str = "", language: str = "en") -> str:
        return await self._try_all("analyze_image", image_base64, prompt, system_prompt, language=language)


def get_ai_provider(provider: Optional[str] = None):
    """Always returns CombinedProvider which handles all fallbacks automatically"""
    return CombinedProvider()
