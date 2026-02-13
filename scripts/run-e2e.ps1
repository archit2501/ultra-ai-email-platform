param(
  [string]$BaseUrl = $(if ($env:E2E_BASE_URL) { $env:E2E_BASE_URL } else { "http://localhost:3000" }),
  [string]$TestPattern = ""
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$frontendPath = Join-Path $repoRoot "frontend"
$workspaceRoot = Split-Path -Parent $repoRoot
$venvPython = Join-Path $workspaceRoot ".venv\Scripts\python.exe"
$pythonExe = if (Test-Path $venvPython) { $venvPython } else { "python" }
$npmExe = "npm.cmd"

if (-not $env:E2E_USER -or -not $env:E2E_PASS) {
  Write-Host "E2E_USER and E2E_PASS must be set before running E2E tests." -ForegroundColor Red
  exit 1
}

function Wait-ForPort {
  param(
    [int]$Port,
    [int]$TimeoutSec = 120
  )

  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($TimeoutSec)) {
    $result = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
      return $true
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

Write-Host "Starting backend (FastAPI)..." -ForegroundColor Cyan
$backendProc = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --reload --port 8000" -WorkingDirectory $backendPath -PassThru

Write-Host "Starting frontend (Next.js)..." -ForegroundColor Cyan
$frontendProc = Start-Process -FilePath $npmExe -ArgumentList "run dev" -WorkingDirectory $frontendPath -PassThru

Write-Host "Waiting for services to be ready..." -ForegroundColor Cyan
if (-not (Wait-ForPort -Port 8000 -TimeoutSec 180)) {
  Write-Host "Backend did not start on port 8000." -ForegroundColor Red
  if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
  if ($frontendProc) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
  exit 1
}

if (-not (Wait-ForPort -Port 3000 -TimeoutSec 180)) {
  Write-Host "Frontend did not start on port 3000." -ForegroundColor Red
  if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
  if ($frontendProc) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
  exit 1
}

$env:E2E_BASE_URL = $BaseUrl

try {
  Write-Host "Running Playwright E2E tests..." -ForegroundColor Cyan
  Push-Location $frontendPath
  if ([string]::IsNullOrWhiteSpace($TestPattern)) {
    npm run test:e2e
  } else {
    npx playwright test $TestPattern
  }
} finally {
  Pop-Location
  Write-Host "Stopping services..." -ForegroundColor Cyan
  if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
  if ($frontendProc) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
}
