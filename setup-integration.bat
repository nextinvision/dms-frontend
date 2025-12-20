@echo off
REM DMS Frontend-Backend Integration Setup Script
REM Run this to connect your frontend to the backend

echo.
echo ====================================
echo  DMS Frontend Integration Setup
echo ====================================
echo.

REM Step 1: Create .env.local file
echo [Step 1/4] Creating .env.local file...
(
echo # DMS Frontend Environment Configuration
echo.
echo # Backend API URL ^(CRITICAL!^)
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api
echo.
echo # Disable Mock API to use real backend ^(CRITICAL!^)
echo NEXT_PUBLIC_USE_MOCK_API=false
echo.
echo # API Request Timeout ^(in milliseconds^)
echo NEXT_PUBLIC_API_TIMEOUT=30000
echo.
echo # Environment
echo NEXT_PUBLIC_ENV=development
) > .env.local

if exist .env.local (
    echo ✓ .env.local created successfully!
) else (
    echo ✗ Failed to create .env.local
    exit /b 1
)

echo.

REM Step 2: Check if backend is running
echo [Step 2/4] Checking if backend is running...
curl -s http://localhost:3001/api/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Backend is running on port 3001!
) else (
    echo ⚠ Backend is NOT running on port 3001
    echo   Please start your backend server first:
    echo   cd path\to\backend
    echo   npm run start:dev
    echo.
    echo   Then run this script again.
    pause
    exit /b 1
)

echo.

REM Step 3: Install dependencies (if needed)
echo [Step 3/4] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
) else (
    echo ✓ Dependencies already installed
)

echo.

REM Step 4: Instructions
echo [Step 4/4] Setup complete!
echo.
echo ====================================
echo  NEXT STEPS
echo ====================================
echo.
echo 1. Restart your frontend dev server:
echo    npm run dev
echo.
echo 2. Open your browser:
echo    http://localhost:3000
echo.
echo 3. Try logging in with your backend credentials
echo.
echo 4. Check the Network tab to see API calls
echo.
echo ====================================
echo  VERIFICATION
echo ====================================
echo.
echo • Frontend should connect to: http://localhost:3001/api
echo • Mock API is DISABLED
echo • All requests will hit your real backend
echo.
echo If you see errors, check:
echo 1. Backend is running on port 3001
echo 2. .env.local exists in this directory
echo 3. You restarted the dev server after creating .env
echo.
echo ====================================
echo.

pause
