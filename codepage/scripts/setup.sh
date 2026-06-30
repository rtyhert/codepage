#!/usr/bin/env bash
# CodePage 一键安装启动脚本 (Linux/macOS)
# 用法: bash scripts/setup.sh

set -e

echo "=== CodePage Setup ==="

# 检查 Node.js
if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js not found. Install Node.js 20+ from https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js $(node -v)"

# 安装依赖
echo ""
echo "[1/3] Installing server dependencies..."
cd server && npm install && cd ..

echo "[2/3] Installing client dependencies..."
cd client && npm install && cd ..

# 初始化数据库
echo "[3/3] Initializing database..."
cd server && npx prisma generate && npx prisma db push && cd ..

echo ""
echo "=== Setup complete! ==="
echo "Run 'npm run dev' to start"
