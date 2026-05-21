@echo off
echo ========================================
echo   KrishiMitra Backend - Starting...
echo ========================================
cd /d "%~dp0backend"

if not exist ".env" (
    echo [WARNING] .env file not found. Copying from .env.example...
    copy .env.example .env
    echo [ACTION] Please edit backend\.env and add your API keys, then restart.
)

echo [INFO] Starting FastAPI server on http://localhost:8000
echo [INFO] API Docs available at http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
