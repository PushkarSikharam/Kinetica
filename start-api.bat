@echo off
echo Starting FastAPI Backend...
cd apps\api
call venv\Scripts\activate.bat
uvicorn app.main:app --reload
