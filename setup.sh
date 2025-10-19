#!/bin/bash

# PortSentinel AI 智能助手配置脚本
echo "⚙️  PortSentinel AI 智能助手配置脚本"
echo "===================================="

# 检查是否在正确的目录
if [ ! -f "README.md" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 系统检查..."

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

echo "✅ 系统检查完成"

# 创建.env文件
echo "📝 配置环境变量..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Azure OpenAI 配置
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://psacodesprint2025.azure-api.net/gpt-4-1-mini/openai/deployments/gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=x1uktrew
DB_NAME=appdb
EOF
    echo "✅ 已创建 .env 文件，请编辑其中的API密钥"
else
    echo "✅ .env 文件已存在"
fi

# 检查数据库
echo "🗄️  检查数据库连接..."
mysql -u root -px1uktrew -e "SELECT 1;" &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
    
    # 检查数据库是否存在
    mysql -u root -px1uktrew -e "USE appdb;" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ appdb 数据库已存在"
    else
        echo "📝 创建 appdb 数据库..."
        mysql -u root -px1uktrew -e "CREATE DATABASE IF NOT EXISTS appdb;"
        echo "✅ appdb 数据库创建完成"
    fi
else
    echo "⚠️  数据库连接失败，请检查MySQL服务是否运行"
    echo "   默认密码: x1uktrew"
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
echo "✅ 配置完成!"
echo ""
echo "🚀 下一步:"
echo "   1. 编辑 .env 文件，设置正确的 Azure OpenAI API 密钥"
echo "   2. 运行 ./start.sh 启动服务"
echo "   3. 访问 http://localhost:3000 开始使用"
echo ""
echo "💡 提示:"
echo "   - 数据库密码: x1uktrew"
echo "   - 如果遇到问题，请查看 README.md 中的故障排除部分"
echo ""
