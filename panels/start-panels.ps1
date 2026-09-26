$ErrorActionPreference = 'Stop'
$panelRoot = $PSScriptRoot
$nodePath = (Get-Command node.exe).Source
$services = @(
    @{ Name = 'api'; Port = 5004; Directory = $panelRoot; Arguments = 'local-api.mjs' },
    @{ Name = 'client'; Port = 5174; Directory = (Join-Path $panelRoot 'punjabship-panels/courier-cart-client'); Arguments = 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort' },
    @{ Name = 'admin'; Port = 3001; Directory = (Join-Path $panelRoot 'punjabship-panels/admin-dashboard'); Arguments = 'node_modules/react-scripts/bin/react-scripts.js start' }
)
foreach ($service in $services) {
    if (Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue) {
        Write-Host "$($service.Name): port $($service.Port) already running"
        continue
    }
    $process = Start-Process -FilePath $nodePath -ArgumentList $service.Arguments -WorkingDirectory $service.Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $panelRoot "$($service.Name).log") -RedirectStandardError (Join-Path $panelRoot "$($service.Name).error.log")
    Write-Host "$($service.Name) started (PID $($process.Id))"
}
Write-Host 'Client: http://127.0.0.1:5174 | client@punjabshiplogistics.com / Demo@123'
Write-Host 'Admin: http://127.0.0.1:3001 | admin@punjabshiplogistics.com / Demo@123'
Write-Host 'First admin compilation can take a few minutes. Logs are in the panels folder.'
