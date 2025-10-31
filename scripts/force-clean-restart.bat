@echo off
REM NUCLEAR OPTION: Complete cache wipe and restart
REM Use this when environment variables aren't loading

echo.
echo ========================================
echo  FORCE CLEAN RESTART
echo  (Nuclear Option - Wipes All Caches)
echo ========================================
echo.

echo [1/5] Killing all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM next.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo     ✓ All Node processes stopped

echo.
echo [2/5] Removing .next directory...
if exist .next (
    rmdir /s /q .next
    echo     ✓ Removed .next
) else (
    echo     - .next doesn't exist
)

echo.
echo [3/5] Removing node_modules\.cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo     ✓ Removed node_modules\.cache
) else (
    echo     - node_modules\.cache doesn't exist
)

echo.
echo [4/5] Removing TypeScript cache...
if exist tsconfig.tsbuildinfo (
    del /f /q tsconfig.tsbuildinfo
    echo     ✓ Removed tsconfig.tsbuildinfo
) else (
    echo     - tsconfig.tsbuildinfo doesn't exist
)

echo.
echo [5/5] Verifying .env.local...
if exist .env.local (
    echo     ✓ .env.local exists
    echo.
    echo     Checking for required variables...
    findstr /C:"NEXT_PUBLIC_SUPABASE_URL" .env.local >nul
    if errorlevel 1 (
        echo     ✗ NEXT_PUBLIC_SUPABASE_URL not found!
    ) else (
        echo     ✓ NEXT_PUBLIC_SUPABASE_URL found
    )

    findstr /C:"NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local >nul
    if errorlevel 1 (
        echo     ✗ NEXT_PUBLIC_SUPABASE_ANON_KEY not found!
    ) else (
        echo     ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY found
    )
) else (
    echo     ✗ ERROR: .env.local not found!
    echo     Create .env.local in project root with your Supabase credentials
    pause
    exit /b 1
)

echo.
echo ========================================
echo  All caches cleared!
echo  Starting fresh dev server...
echo ========================================
echo.
echo IMPORTANT: After server starts:
echo 1. Wait for "Ready" message
echo 2. Hard refresh browser (Ctrl+Shift+R)
echo 3. Check console for errors
echo.
pause

npm run dev

pause
