@echo off
REM Safe Cache Cleanup - Only removes webpack cache, preserves manifests
REM This prevents Next.js race conditions while still clearing cached bundles

echo.
echo ========================================
echo  Safe Cache Cleanup
echo  (Preserves Manifests and Structure)
echo ========================================
echo.

echo [1/4] Stopping any running Node processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo     ✓ All Node processes stopped

echo.
echo [2/4] Removing webpack cache only...
if exist .next\cache\webpack (
    rmdir /s /q .next\cache\webpack
    echo     ✓ Removed .next\cache\webpack
) else (
    echo     - Webpack cache doesn't exist
)

echo.
echo [3/4] Removing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo     ✓ Removed node_modules\.cache
) else (
    echo     - node_modules\.cache doesn't exist
)

echo.
echo [4/4] Verifying .env.local...
if exist .env.local (
    echo     ✓ .env.local exists
    echo.
    echo     Checking for required variables...
    findstr /C:"NEXT_PUBLIC_SUPABASE_URL" .env.local >nul
    if errorlevel 1 (
        echo     ✗ NEXT_PUBLIC_SUPABASE_URL not found!
        echo     ERROR: Missing required environment variable
        pause
        exit /b 1
    ) else (
        echo     ✓ NEXT_PUBLIC_SUPABASE_URL found
    )

    findstr /C:"NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local >nul
    if errorlevel 1 (
        echo     ✗ NEXT_PUBLIC_SUPABASE_ANON_KEY not found!
        echo     ERROR: Missing required environment variable
        pause
        exit /b 1
    ) else (
        echo     ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY found
    )

    findstr /C:"SUPABASE_SERVICE_ROLE_KEY" .env.local >nul
    if errorlevel 1 (
        echo     ✗ SUPABASE_SERVICE_ROLE_KEY not found!
        echo     ERROR: Missing required environment variable
        pause
        exit /b 1
    ) else (
        echo     ✓ SUPABASE_SERVICE_ROLE_KEY found
    )
) else (
    echo     ✗ ERROR: .env.local not found!
    echo     Create .env.local in project root with your Supabase credentials
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Cache cleaned safely!
echo  Manifests preserved for faster startup
echo ========================================
echo.
echo Ready to start dev server with: npm run dev
echo.
pause
