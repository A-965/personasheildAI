@echo off
REM DeepGuard Backend Start Script for Windows

echo.
echo ================================
echo   DeepGuard Backend - Startup
echo ================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found. Creating from .env.example...
    copy .env.example .env
    echo Please edit .env with your settings
    echo.
)

REM Check Python version
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✓ Python version: %PYTHON_VERSION%

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update requirements
echo Installing requirements...
pip install -q -r requirements.txt

REM Initialize database
echo Initializing database...
python -c "from app.database import init_db; init_db()" 2>nul

REM Start server
echo.
echo Starting DeepGuard API Server...
echo Server running at: http://localhost:8000
echo Docs at: http://localhost:8000/api/docs
echo Health check: http://localhost:8000/api/health
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo Server stopped
pause
