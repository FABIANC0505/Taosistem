#!/usr/bin/env powershell
# Pre-Deployment Validation Script for Full Project
# Validates both backend and frontend

Write-Host "`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Pre-Deployment Validation" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

$backendValid = $false
$frontendValid = $false

# Backend Validation
Write-Host "`n[1/2] Validating Backend..." -ForegroundColor Yellow

if (Test-Path "backend/validate_deployment.py") {
    Write-Host "Running backend validation..." -ForegroundColor Cyan
    Push-Location backend
    python validate_deployment.py
    if ($LASTEXITCODE -eq 0) {
        $backendValid = $true
    }
    Pop-Location
} else {
    Write-Host "✗ Backend validation script not found" -ForegroundColor Red
}

# Frontend Validation
Write-Host "`n[2/2] Validating Frontend..." -ForegroundColor Yellow

if (Test-Path "frontend/validate_deployment.js") {
    Write-Host "Running frontend validation..." -ForegroundColor Cyan
    Push-Location frontend
    node validate_deployment.js
    if ($LASTEXITCODE -eq 0) {
        $frontendValid = $true
    }
    Pop-Location
} else {
    Write-Host "⚠ Frontend validation script not found (npm required)" -ForegroundColor Yellow
    Write-Host "Skipping frontend validation" -ForegroundColor Yellow
    $frontendValid = $true
}

# Final Summary
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Final Summary" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

if ($backendValid) {
    Write-Host "✓ Backend: Ready for deployment" -ForegroundColor Green
} else {
    Write-Host "✗ Backend: Not ready" -ForegroundColor Red
}

if ($frontendValid) {
    Write-Host "✓ Frontend: Ready for deployment" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend: Not ready" -ForegroundColor Red
}

if ($backendValid -and $frontendValid) {
    Write-Host "`n✓ Both backend and frontend are ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Backend to Railway: https://docs.railway.app" -ForegroundColor White
    Write-Host "2. Frontend to Vercel: https://vercel.com/docs" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "`n✗ Fix the issues above before deploying" -ForegroundColor Red
    Write-Host ""
    exit 1
}
