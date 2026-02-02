# PowerShell Script to Generate Complete Backend Structure
# This creates ALL controllers, routes, services, validators, and utilities

Write-Host "🚀 Generating Complete Backend Structure..." -ForegroundColor Green

# Create directory structure
$directories = @(
    "src\controllers",
    "src\routes",
    "src\services",
    "src\validators",
    "src\middlewares",
    "src\utils",
    "uploads\documents",
    "uploads\logos",
    "logs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Cyan
    }
}

Write-Host "`n📦 All directories created successfully!" -ForegroundColor Green
Write-Host "`n🎯 Next: Creating all service files..." -ForegroundColor Yellow
