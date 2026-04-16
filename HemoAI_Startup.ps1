# HemoVision AI: Unified Startup Script
# This script launches the AI Service (Python), Backend (Node.js), and Frontend (Vite)

$PROJECT_ROOT = Get-Location
$ANACONDA_PYTHON = "C:\Users\PRADEEP KUMAR\anaconda3\python.exe"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "Finalyear-Project-Back-end"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "Finalyear-Project-Front-end-"
$AI_SERVICE_DIR = Join-Path $BACKEND_DIR "ai-service"

Write-Host "--- HemoVision AI: Launcher ---" -ForegroundColor Cyan

# 1. Start AI Service (Python/Flask)
Write-Host "[1/3] Starting AI Service (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$AI_SERVICE_DIR'; & '$ANACONDA_PYTHON' app.py" -WindowStyle Normal

# 2. Start Backend (Node.js/Express)
Write-Host "[2/3] Starting Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; npm run dev" -WindowStyle Normal

# 3. Start Frontend (React/Vite)
Write-Host "[3/3] Starting Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND_DIR'; npm run dev" -WindowStyle Normal

Write-Host "`n--- All services launched! ---" -ForegroundColor Green
Write-Host "1. AI Service logs window is open."
Write-Host "2. Backend logs window is open."
Write-Host "3. Frontend logs window is open."
Write-Host "`nVisit http://localhost:5173 to start using the app." -ForegroundColor Cyan
