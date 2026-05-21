@echo off
echo ========================================
echo   KrishiMitra Frontend - Starting...
echo ========================================
cd /d "%~dp0frontend"

if not exist ".env.local" (
    echo [INFO] Creating .env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
    echo NEXT_PUBLIC_APP_NAME=KrishiMitra >> .env.local
)

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install --legacy-peer-deps
)

echo [INFO] Starting Next.js on http://localhost:3000
echo.
npm run dev
pause
