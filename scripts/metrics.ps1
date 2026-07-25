# Project Technical Metrics
param([switch]$Json)

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$src = Join-Path $backend "src"
$test = Join-Path $backend "test"

Write-Host "`n=== Project Technical Metrics ===" -ForegroundColor Cyan
Write-Host "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

# ── Module count ──
$modules = Get-ChildItem -Path (Join-Path $src "modules") -Directory
$moduleCount = ($modules | Measure-Object).Count
Write-Host "Modules: $moduleCount" -ForegroundColor Green

# ── Service count ──
$services = Get-ChildItem -Path $src -Recurse -Filter "*.service.ts" -File
$serviceCount = ($services | Measure-Object).Count
Write-Host "Services: $serviceCount" -ForegroundColor Green

# ── Controller count ──
$controllers = Get-ChildItem -Path $src -Recurse -Filter "*.controller.ts" -File
$controllerCount = ($controllers | Measure-Object).Count
Write-Host "Controllers: $controllerCount" -ForegroundColor Green

# ── Endpoint count ──
$endpointMatches = Select-String -Path $src -Pattern "@(Get|Post|Put|Patch|Delete)\(['\""]" -Recurse -SimpleMatch | Select-Object -Unique
$endpointCount = ($endpointMatches | Measure-Object).Count
Write-Host "Endpoints (approx): $endpointCount" -ForegroundColor Green

# ── Table count (Prisma models) ──
$schemaPath = Join-Path $backend "prisma\schema.prisma"
$modelMatches = Select-String -Path $schemaPath -Pattern "^model " -SimpleMatch
$tableCount = ($modelMatches | Measure-Object).Count
Write-Host "Tables (Prisma models): $tableCount" -ForegroundColor Green

# ── Enum count ──
$enumMatches = Select-String -Path $schemaPath -Pattern "^enum " -SimpleMatch
$enumCount = ($enumMatches | Measure-Object).Count
Write-Host "Enums: $enumCount" -ForegroundColor Green

# ── Event count (from domain-events.md) ──
$eventsDoc = Join-Path $root "docs\technical\domain-events.md"
if (Test-Path $eventsDoc) {
    $eventMatches = Select-String -Path $eventsDoc -Pattern "^\| \`" -SimpleMatch
    $eventCount = ($eventMatches | Measure-Object).Count
} else { $eventCount = 0 }
Write-Host "Domain events (catalogued): $eventCount" -ForegroundColor Green

# ── Integration providers ──
$providersDir = Join-Path $src "modules\integrations\providers"
$providerDirs = Get-ChildItem -Path $providersDir -Directory -Exclude "payment"
$providerCount = ($providerDirs | Measure-Object).Count
$paymentProviders = Get-ChildItem -Path (Join-Path $providersDir "payment") -Filter "*.provider.ts" -File
$paymentCount = ($paymentProviders | Measure-Object).Count
Write-Host "Integration providers: $($providerCount + $paymentCount)" -ForegroundColor Green

# ── Test count ──
$jestOutput = & npx jest --passWithNoTests --json 2>$null | ConvertFrom-Json
if ($jestOutput) {
    $testCount = $jestOutput.numTotalTests
    $testSuites = $jestOutput.numTotalTestSuites
    $testTime = [math]::Round($jestOutput.testResults.time / 1000, 1)
    Write-Host "Tests: $testCount" -ForegroundColor Green
    Write-Host "Test suites: $testSuites" -ForegroundColor Green
    Write-Host "Test time: ${testTime}s" -ForegroundColor Green
}

# ── Code lines ──
$tsFiles = Get-ChildItem -Path $src -Recurse -Include "*.ts" -File
$totalLines = ($tsFiles | ForEach-Object { (Get-Content $_.FullName | Measure-Object).Count } | Measure-Object -Sum).Sum
Write-Host "Source lines (TypeScript): $totalLines" -ForegroundColor Green

# ── TODO/FIXME count ──
$todos = Select-String -Path $src -Pattern "TODO|FIXME|HACK|XXX" -Recurse -SimpleMatch
$todoCount = ($todos | Measure-Object).Count
Write-Host "TODOs/FIXMEs: $todoCount" -ForegroundColor Yellow

# ── Circular dependencies (via madge if available) ──
$hasMadge = Get-Command "npx" -ErrorAction SilentlyContinue
$circularCount = "?"
if ($hasMadge) {
    try {
        $madge = & npx --yes madge --circular $src\app.module.ts 2>&1 | Out-String
        if ($madge -match "No circular") { $circularCount = 0 }
    } catch { $circularCount = "?" }
}
Write-Host "Circular dependencies: $circularCount" -ForegroundColor Yellow

# ── npm audit ──
Write-Host "`n--- npm audit (critical/high) ---" -ForegroundColor Cyan
$audit = & npm audit --prefix $backend 2>&1 | Out-String
if ($audit -match "found (\d+) vulnerabilities") {
    Write-Host "Vulnerabilities: $($Matches[1])" -ForegroundColor Yellow
} else {
    Write-Host "Vulnerabilities: 0" -ForegroundColor Green
}

Write-Host "`n=== End ===" -ForegroundColor Cyan
