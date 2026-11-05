# Usage: $env:OLD_NAMES="pattern"; .\scripts\name_sweep.ps1
$ErrorActionPreference = "Stop"
if (-not $env:OLD_NAMES) {
    Write-Error "Set OLD_NAMES environment variable to a pipe-separated regex pattern"
    exit 1
}

$matches = Get-ChildItem -Recurse -File | Where-Object {
    $_.FullName -notmatch "[\/\\](\.git|node_modules)[\/\\]" -and
    $_.Name -notmatch "name_sweep\.(sh|ps1)$"
} | Select-String -Pattern $env:OLD_NAMES

if ($matches) {
    Write-Host "FAIL: old-name references found" -ForegroundColor Red
    $matches | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
    exit 1
}

Write-Host "OK: zero old-name references" -ForegroundColor Green
exit 0

