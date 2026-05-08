from google import genai
from google.genai import types
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set. AI features will fail.")
            self.client = None
        else:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate(self, prompt: str) -> str:
        """Synchronous text generation using the new google.genai SDK."""
        if not self.client:
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1024,
            )
        )
        return response.text

    async def parse_meal_log(self, text: str) -> dict:
        """
        Parses a natural language meal string into structured data.
        e.g., 'I ate two katoris of dal and three standard rotis with high oil'
        """
        prompt = f"""
        You are a highly precise Indian nutrition API.
        Parse the following user meal text and return ONLY valid JSON representing the food items, 
        estimated calories, and macros. DO NOT provide medical advice.
        
        User Text: '{text}'
        """
        text_response = self.generate(prompt)
        return {"raw_ai_response": text_response}

    async def explain_insight(self, insight_data: dict) -> str:
        """
        Takes deterministic calculated insights (e.g., TDEE drops) and explains them 
        factually to the user without coaching or preaching.
        """
        prompt = f"""
        You are a transparent, deterministic data-driven engine.
        Explain the following metric insight to the user simply and factually.
        Do not use emojis. Do not sound like a coach.
        Insight: {insight_data}
        """
        return self.generate(prompt)


ai_service = AIService()
