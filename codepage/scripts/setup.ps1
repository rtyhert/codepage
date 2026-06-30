# CodePage Windows 一键安装启动脚本
# 用法: PowerShell 中运行 .\scripts\setup.ps1

Write-Host "=== CodePage Setup ===" -ForegroundColor Cyan

# 检查 Node.js
$nodeVer = node -v 2>$null
if (-not $nodeVer) {
    Write-Host "[ERROR] Node.js 未安装，请先安装 Node.js 20+ https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green

# 安装依赖
Write-Host "`n[1/3] Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] npm install failed" -ForegroundColor Red; exit 1 }

Write-Host "[2/3] Installing client dependencies..." -ForegroundColor Yellow
Set-Location ../client
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] npm install failed" -ForegroundColor Red; exit 1 }

# 初始化数据库
Write-Host "[3/3] Initializing database..." -ForegroundColor Yellow
Set-Location ../server
npx prisma generate
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Database init failed" -ForegroundColor Red; exit 1 }

Set-Location ..
Write-Host "`n=== Setup complete! ===" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start" -ForegroundColor Cyan
