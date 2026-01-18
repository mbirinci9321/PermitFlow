param (
    [string]$ServerUrl = "http://localhost:8000"
)

$InstallPath = "C:\PermitFlowAgent"
$AgentExeUrl = "$ServerUrl/downloads/agent/PermitFlowAgent.exe"

Write-Host "Installing PermitFlow Agent to $InstallPath..." -ForegroundColor Cyan

# 1. Create Directory
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
}

# 2. Download Agent.exe
Write-Host "Downloading Agent Executable..."
try {
    Invoke-WebRequest -Uri "$AgentExeUrl" -OutFile "$InstallPath\PermitFlowAgent.exe"
}
catch {
    Write-Error "Failed to download agent from $AgentExeUrl. Ensure server is running."
    exit 1
}

# 3. Create Config (Environment Variables)
# The Agent needs to know where the server is.
# We can pass this as env var or a config file.
# Our agent code reads env.py or env vars.
$ConfigContent = @"
SERVER_URL = "$ServerUrl"
AGENT_ID = "$($env:COMPUTERNAME)"
"@
Set-Content -Path "$InstallPath\env.py" -Value $ConfigContent

# 4. Create Service (NSSM or SC) - Simple SC creation
# 'sc' is tricky with powershell strings, using simple startup script for now
$StartupScript = @"
cd "$InstallPath"
.\PermitFlowAgent.exe
"@
Set-Content -Path "$InstallPath\start_agent.cmd" -Value $StartupScript

Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "Launching PermitFlow Agent..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/c `"$InstallPath\start_agent.cmd`"" -WindowStyle Normal

Write-Host "Agent is now running in a separate window." -ForegroundColor Yellow
Write-Host "To auto-start on boot, create a Scheduled Task pointing to $InstallPath\start_agent.cmd."
