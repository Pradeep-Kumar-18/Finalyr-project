@echo off
SETLOCAL EnableDelayedExpansion

:: Set directory to script location and handle spaces in paths
SET "BASE_DIR=%~dp0"
CD /D "%BASE_DIR%"

echo ===================================================
echo HemoVision AI - Stable Launcher v5 (Fixed Syntax)
echo ===================================================

:: 1. Verify Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+ and add it to PATH.
    pause
    exit /b 1
)

:: 2. Check for integrity/corruption
if exist "venv\Scripts\python.exe" (
    echo [*] Verifying environment integrity...
    REM Use REM instead of :: inside parentheses to avoid syntax errors
    "%BASE_DIR%venv\Scripts\python.exe" -m pip --version >nul 2>&1
    if errorlevel 1 (
        echo [!] pip corruption detected.
        echo [!] Rebuilding environment...
        rd /s /q "venv"
    )
)

:: 3. Create virtual environment if missing
if not exist "venv\Scripts\python.exe" (
    echo [!] Creating a clean virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [OK] Clean environment created.
)

:: 4. Activation
echo [*] Activating environment...
call "venv\Scripts\activate.bat"

:: 5. Core Tooling Update
echo [*] Bootstrapping core tools...
REM Avoid :: here as well for consistency
python -m pip install --upgrade pip setuptools wheel --no-cache-dir
if errorlevel 1 (
    echo [WARN] Initial bootstrap failed. Re-attempting with forced ensurepip...
    python -m ensurepip --default-pip
    python -m pip install --upgrade pip setuptools wheel --no-cache-dir
)

:: 6. Dependency Installation
echo [*] Syncing dependencies...
python -m pip install -r requirements.txt --no-cache-dir
if errorlevel 1 (
    echo [ERROR] Failed to install project dependencies.
    pause
    exit /b 1
)
echo [OK] Environment verified.

:: 7. Run Application
echo [*] Starting AI Service on Port 5001...
echo ---------------------------------------------------
python app.py
echo ---------------------------------------------------

if errorlevel 1 (
    echo [CRASH] AI Service stopped unexpectedly.
    pause
)

ENDLOCAL
