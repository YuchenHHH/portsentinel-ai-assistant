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

echo "✅ 依赖检查完成"

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "   请创建 .env 文件并配置Azure OpenAI密钥"
    exit 1
fi

# 加载环境变量
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$AZURE_OPENAI_API_KEY" ]; then
    echo "⚠️  警告: AZURE_OPENAI_API_KEY 环境变量未设置"
    echo "   请检查 .env 文件配置"
    exit 1
fi

echo "✅ 环境变量已加载"
echo ""

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv .venv
fi

# 激活虚拟环境
source .venv/bin/activate

echo "🚀 启动服务..."
echo ""

# 启动后端服务
echo "🔧 启动后端服务 (端口 8000)..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端是否成功启动
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ 后端服务启动失败"
    exit 1
fi

echo "✅ 后端服务已启动"

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
echo "   1. 首次使用请先配置Azure OpenAI API密钥"
echo "   2. 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 服务已停止'; deactivate; exit 0" INT

# 保持脚本运行
wait
