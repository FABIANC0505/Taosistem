# ============================================
# START BACKEND ONLY (PowerShell)
# ============================================
# Usage: .\start-backend.ps1

Write-Host "`nStarting BACKEND (API + PostgreSQL + Redis)..." -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$composeFile = "docker-compose.backend.yml"

if (-not (Test-Path $composeFile)) {
    Write-Host "[ERROR] Could not find $composeFile" -ForegroundColor Red
    exit 1
}

try {
    docker --version | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not available" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Stopping previous backend stack..." -ForegroundColor Cyan
docker compose -f $composeFile down 2>$null

Write-Host "[INFO] Starting backend stack..." -ForegroundColor Cyan
docker compose -f $composeFile up -d --build

Write-Host "[INFO] Waiting for backend health check..." -ForegroundColor Cyan
$attempt = 0
while ($attempt -lt 40) {
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($health.StatusCode -eq 200) {
            Write-Host "[OK] Backend ready at http://localhost:8000" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
        $attempt = $attempt + 1
    }
}

Write-Host "`nEndpoints:" -ForegroundColor Cyan
Write-Host "   API:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "   Docs: http://localhost:8000/docs" -ForegroundColor Yellow

Write-Host "`nBackend logs:" -ForegroundColor Cyan
Write-Host "   docker compose -f $composeFile logs -f backend" -ForegroundColor White

Write-Host "`nStop backend stack:" -ForegroundColor Cyan
Write-Host "   docker compose -f $composeFile down" -ForegroundColor White
