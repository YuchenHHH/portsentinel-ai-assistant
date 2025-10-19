#!/bin/bash

# PortSentinel AI 智能助手启动脚本
echo "🚀 PortSentinel AI 智能助手启动脚本"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "README.md" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 检查依赖..."

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python 3.8+"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js 16+"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装npm"
    exit 1
fi

echo "✅ 依赖检查完成"

# 检查环境变量
if [ -z "$AZURE_OPENAI_API_KEY" ]; then
    echo "⚠️  警告: AZURE_OPENAI_API_KEY 环境变量未设置"
    echo "   请设置环境变量或创建 .env 文件"
fi

echo ""
echo "🔧 安装依赖..."

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi

# 安装模块依赖
echo "📦 安装RAG模块依赖..."
cd ../modules/rag_module
pip install -r requirements.txt

echo "📦 安装SOP执行器模块依赖..."
cd ../sop_executor
pip install -r requirements.txt

cd ../..

echo ""
echo "✅ 所有依赖安装完成"
echo ""
echo "🚀 启动服务..."
echo ""

# 启动后端服务
echo "🔧 启动后端服务 (端口 8000)..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务 (端口 3000)..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动完成!"
echo ""
echo "📱 访问地址:"
echo "   前端界面: http://localhost:3000"
echo "   API文档:  http://localhost:8000/docs"
echo ""
echo "💡 提示:"
echo "   1. 首次使用请先配置数据库连接"
echo "   2. 数据库密码: x1uktrew"
echo "   3. 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 服务已停止'; exit 0" INT

# 保持脚本运行
wait
