Write-Host "Building PermitFlow Release (Offline Readiness)..." -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "Building Frontend..."
Set-Location "..\frontend"
npm install
npm run build
if (-not (Test-Path "dist")) {
    Write-Error "Frontend build failed!"
    exit 1
}

# 2. Build Agent (EXE)
Write-Host "Building Agent Executable..."
Set-Location "..\packaging"
pyinstaller agent.spec --noconfirm --clean

# Verify Agent Build
if (-not (Test-Path "dist\PermitFlowAgent.exe")) {
    Write-Error "Agent build failed!"
    exit 1
}

# 3. Move Agent to Backend Static (Using downloads/agent)
# So it can be reached at /downloads/agent/PermitFlowAgent.exe
Write-Host "Embedding Agent into Server..."
$AgentDest = "..\agent\PermitFlowAgent.exe"
Copy-Item -Path "dist\PermitFlowAgent.exe" -Destination $AgentDest -Force

# 4. Build Backend Server
Write-Host "Building Server Executable..."
pyinstaller server.spec --noconfirm --clean

# 5. Build Installer (Inno Setup)
Write-Host "Building Installer..."

# Try to find ISCC
$ISCC_Path = "ISCC.exe" # Assume PATH first
if (-not (Get-Command "ISCC.exe" -ErrorAction SilentlyContinue)) {
    # Check common locations
    $PossiblePaths = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
        "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
    )
    
    foreach ($path in $PossiblePaths) {
        if (Test-Path $path) {
            $ISCC_Path = $path
            break
        }
    }
}

if (-not (Get-Command $ISCC_Path -ErrorAction SilentlyContinue) -and -not (Test-Path $ISCC_Path)) {
    Write-Warning "Inno Setup Compiler (ISCC) not found! Skipping installer generation."
    Write-Host "You can manually compile 'packaging\setup_script.iss' if you have Inno Setup." -ForegroundColor Yellow
} else {
    Write-Host "Using ISCC at: $ISCC_Path"
    & $ISCC_Path "setup_script.iss"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installer Generated Successfully!" -ForegroundColor Green
        Write-Host "Installer: packaging\Output\PermitFlowSetup.exe"
    } else {
        Write-Error "Installer generation failed!"
    }
}

# 6. Done
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "Server Executable: packaging\dist\PermitFlowServer\PermitFlowServer.exe"
if (Test-Path "Output\PermitFlowSetup.exe") {
    Write-Host "Setup Installer: packaging\Output\PermitFlowSetup.exe"
}
Write-Host "Agent Executable is INSIDE the server static folder."
