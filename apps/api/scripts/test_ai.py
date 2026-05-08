import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from google import genai
from app.core.config import settings

print(f"Key length: {len(settings.GEMINI_API_KEY)}")
client = genai.Client(api_key=settings.GEMINI_API_KEY)
r = client.models.generate_content(model='gemini-2.0-flash', contents='Say hi in one sentence')
print("SUCCESS:", r.text)
