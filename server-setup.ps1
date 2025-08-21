# Run PowerShell as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator!"
    exit
}

# Create application directories
$frontendPath = "C:\applications\frontend"
$backendPath = "C:\applications\backend"

New-Item -ItemType Directory -Force -Path $frontendPath
New-Item -ItemType Directory -Force -Path $backendPath

# Install Chocolatey (Windows package manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js using Chocolatey
choco install nodejs-lts -y
refreshenv

# Install PM2 globally
npm install -g pm2
npm install -g pm2-windows-startup
pm2 startup

# Enable OpenSSH Server (for GitHub Actions deployment)
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# Start the SSH service
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# Configure Windows Firewall
New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
New-NetFirewallRule -Name 'Frontend-Web-In-TCP' -DisplayName 'Frontend Web Server' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 80,443
New-NetFirewallRule -Name 'Backend-API-In-TCP' -DisplayName 'Backend API Server' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 3000

Write-Host "Server setup completed!"
Write-Host "Frontend directory: $frontendPath"
Write-Host "Backend directory: $backendPath"
Write-Host "Please make sure to configure your environment variables and SSL certificates if needed." 