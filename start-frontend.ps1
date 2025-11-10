# Requires: Python 3 installed (python or py launcher)
param(
  [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root 'frontend'
$serve = Join-Path $frontend 'serve.py'

if (-not (Test-Path $serve)) {
  Write-Error "serve.py not found at $serve"
}

function Test-Command($name){
  $old = $ErrorActionPreference; $ErrorActionPreference = 'SilentlyContinue'
  $cmd = Get-Command $name
  $ErrorActionPreference = $old
  return $null -ne $cmd
}

$pythonCmd = $null
if (Test-Command 'python') { $pythonCmd = 'python' }
elseif (Test-Command 'py') { $pythonCmd = 'py -3' }
else { Write-Error 'Python 3 not found. Please install Python 3.' }

Write-Host "Starting front-end server with no-cache headers on port $Port ..." -ForegroundColor Cyan
Push-Location $root
try {
  $env:PORT = "$Port"
  & $pythonCmd $serve
}
finally {
  Pop-Location
}

