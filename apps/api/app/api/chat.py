from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
import logging

from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limit import rate_limit_dependency
from app.core.security import get_current_user
from app.models.meal import DailySummary
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat_with_zoro(
    request: ChatRequest,
    db: Session = Depends(get_db),
    _: None = Depends(
        rate_limit_dependency(
            limit=settings.AI_CHAT_RATE_LIMIT_COUNT,
            window_seconds=settings.AI_CHAT_RATE_LIMIT_WINDOW_SECONDS,
            scope="ai-chat",
        )
    ),
    current_user: User = Depends(get_current_user),
):
    """
    Context-aware global endpoint for the Zoro AI.
    It secretly injects the user's current daily summary into the prompt.
    """
    summary = db.query(DailySummary).filter(
        DailySummary.user_id == current_user.id,
        DailySummary.date_logged == date.today()
    ).first()
    
    # 2. Construct the Bio-Context
    target_calories = current_user.target_calories or 2100
    consumed = summary.total_calories if summary else 0
    remaining = target_calories - consumed
    
    system_prompt = f"""
    You are Zoro, the AI assistant for the Zoro Food Tracker application. 
    You are warm, friendly, conversational, and feel deeply alive. 
    
    If the user just says "Hi" or asks how you are, respond naturally and warmly! Do not just dump their data on them unless they ask about it or unless it naturally fits the conversation. 
    Be specific to their question. If they log food, tell them the math. If they say hi, be a friend. Keep responses concise and engaging.
    
    BACKGROUND DATA ON CURRENT USER (Use only if relevant to their prompt):
    - Target: {target_calories} kcal
    - Consumed Today: {consumed} kcal
    - Remaining Budget: {remaining} kcal
    - Baseline Volume Multiplier: {current_user.katori_multiplier}
    
    USER MESSAGE:
    "{request.message}"
    """
    
    # 3. Request inference
    try:
        text_response = ai_service.generate(system_prompt)
        text_response = text_response.replace('*', '')  # Strip markdown asterisks
        
        return ChatResponse(
            response=text_response,
            context_injected=True
        )
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        # Graceful fallback if generation fails
        return ChatResponse(
            response=f"I hear you asking: '{request.message}'. I can see you have {remaining} kcal left today! (AI engine error: {type(e).__name__})",
            context_injected=True
        )
