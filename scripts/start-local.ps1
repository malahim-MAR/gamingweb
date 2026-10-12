$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    $taskPortableRoot = Join-Path $env:USERPROFILE '.codex/tmp/playroom-tools'
    $taskPortableNode = Get-ChildItem -LiteralPath $taskPortableRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'node.exe') } |
        Select-Object -First 1
    if (-not $taskPortableNode) { throw 'Install Node.js 22 LTS, then run this script again.' }
    $env:PATH = $taskPortableNode.FullName + ';' + $env:PATH
}
if (-not (Test-Path -LiteralPath 'node_modules')) { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
& npm.cmd run dev
exit $LASTEXITCODE
