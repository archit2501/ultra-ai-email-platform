$pythonPath = "C:/Users/U6076979/Downloads/codes/cold email/.venv/Scripts/python.exe"
$backendPath = "c:\Users\U6076979\Downloads\codes\cold email\COLD-EMAIL-WEB-APPLICATION\backend"
$frontendPath = "c:\Users\U6076979\Downloads\codes\cold email\COLD-EMAIL-WEB-APPLICATION\frontend"

Write-Host "Starting Backend..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath $pythonPath -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $backendPath -PassThru -NoNewWindow

Write-Host "Starting Frontend..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendPath -PassThru -NoNewWindow

Start-Sleep -Seconds 8
Write-Host "Services started. Press Enter to stop." -ForegroundColor Green
Read-Host

Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
