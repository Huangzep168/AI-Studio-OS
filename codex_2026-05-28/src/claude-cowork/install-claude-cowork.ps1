param(
    [switch]$SkipFeatureEnable
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Please run this script from an elevated PowerShell window: right-click PowerShell and choose 'Run as administrator'."
    }
}

function Get-ClaudeDownloadUrl {
    $arch = $env:PROCESSOR_ARCHITECTURE
    if ($arch -eq 'ARM64') {
        return 'https://storage.googleapis.com/claude_desktop_releases/Claude-arm64.msix'
    }

    return 'https://storage.googleapis.com/claude_desktop_releases/Claude-x64.msix'
}

Assert-Admin

$downloadUrl = Get-ClaudeDownloadUrl
$installer = Join-Path $PSScriptRoot 'Claude.msix'

Write-Host "Downloading Claude Desktop from $downloadUrl"
Invoke-WebRequest -Uri $downloadUrl -OutFile $installer

if (-not $SkipFeatureEnable) {
    Write-Host "Enabling Windows VirtualMachinePlatform feature required by Claude Cowork..."
    DISM /Online /Enable-Feature /FeatureName:VirtualMachinePlatform /All /NoRestart
}

Write-Host "Installing Claude Desktop..."
Add-AppxPackage -Path $installer

Write-Host ""
Write-Host "Claude Desktop installation finished."
Write-Host "Open Claude Desktop, sign in, then choose Cowork from the mode selector."
Write-Host "If Windows says a restart is required, restart before using Cowork."
