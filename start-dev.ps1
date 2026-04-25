$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "RestauTech - desarrollo local" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

function Get-PythonCommand {
    if (Test-Path "backend\\venv\\Scripts\\python.exe") {
        return (Resolve-Path "backend\\venv\\Scripts\\python.exe").Path
    }

    if (Get-Command python -ErrorAction SilentlyContinue) {
        return "python"
    }

    throw "No se encontro Python. Instala Python 3.11+."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "No se encontro Node.js."
}

$pythonCmd = Get-PythonCommand

Write-Host "Asegurate de tener MySQL iniciado y backend/.env configurado." -ForegroundColor Yellow

if (-not (Test-Path "backend\\venv\\Scripts\\python.exe")) {
    Write-Host "Creando entorno virtual del backend..." -ForegroundColor Yellow
    & $pythonCmd -m venv backend\\venv
    $pythonCmd = (Resolve-Path "backend\\venv\\Scripts\\python.exe").Path
}

Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
Push-Location backend
& $pythonCmd -m pip install -r requirements.txt
Pop-Location

if (-not (Test-Path "frontend\\node_modules")) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Push-Location frontend
    npm.cmd install
    Pop-Location
}

Write-Host "Iniciando backend..." -ForegroundColor Yellow
$backendScript = @"
cd '$PWD\\backend'
& '$pythonCmd' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

Start-Sleep -Seconds 3

Write-Host "Iniciando frontend..." -ForegroundColor Yellow
$frontendScript = @"
cd '$PWD\\frontend'
npm.cmd run dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "Docs:     http://localhost:8000/docs" -ForegroundColor Green
