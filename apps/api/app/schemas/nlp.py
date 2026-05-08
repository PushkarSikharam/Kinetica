from pydantic import BaseModel
from typing import Optional

class NLPLogRequest(BaseModel):
    text: str

class NLPLogResponse(BaseModel):
    success: bool
    food_identified: str
    quantity: float
    unit: str
    confidence: float
    message: Optional[str] = None
