#!/bin/bash

# PortSentinel AI 后端服务启动脚本
echo "🔧 启动 PortSentinel AI 后端服务"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "README.md" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env 文件不存在"
    exit 1
fi

# 加载环境变量
export $(cat .env | grep -v '^#' | xargs)

# 激活虚拟环境
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✅ 虚拟环境已激活"
else
    echo "❌ 虚拟环境不存在"
    exit 1
fi

echo ""
echo "🚀 启动后端服务 (端口 8000)..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

