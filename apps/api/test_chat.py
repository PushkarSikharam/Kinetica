import asyncio
import traceback
from app.core.database import SessionLocal
from app.api.chat import chat_with_zoro
from app.schemas.chat import ChatRequest

async def main():
    db = SessionLocal()
    req = ChatRequest(message="hi")
    
    try:
        response = await chat_with_zoro(req, db)
        print("FINAL RESPONSE:", response)
    except Exception as e:
        print("CAUGHT RAW EXCEPTION OUTSIDE:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
