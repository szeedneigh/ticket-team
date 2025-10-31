@echo off
REM Restart Development Server with Fresh Environment Variables
REM This script stops any running dev servers, cleans cache, and restarts

echo.
echo ========================================
echo  Restarting Dev Server with Fresh Env
echo ========================================
echo.

echo [1/4] Stopping any running Node processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Cleaning Next.js cache...
if exist .next (
    rmdir /s /q .next
    echo     ✓ Removed .next directory
)

if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo     ✓ Removed node_modules\.cache
)

echo [3/4] Verifying .env.local exists...
if exist .env.local (
    echo     ✓ .env.local found
) else (
    echo     ✗ ERROR: .env.local not found!
    echo     Please create .env.local in the project root
    pause
    exit /b 1
)

echo [4/4] Starting development server...
echo.
echo ========================================
echo  Server Starting...
echo  Press Ctrl+C to stop
echo ========================================
echo.

npm run dev

pause
