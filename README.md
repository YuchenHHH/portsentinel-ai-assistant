# PortSentinel AI 智能助手

PortSentinel AI 智能助手是一个基于AI技术的港口运营事件处理和SOP执行系统。它能够智能解析事件报告，自动检索相关SOP建议，并生成可执行的解决方案。

## 🚀 快速开始

### 系统要求

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

### 一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd workspace

# 2. 运行配置脚本
./setup.sh

# 3. 启动服务
./start.sh
```

### 手动安装步骤

### 2. 环境配置

#### 2.1 设置环境变量

创建 `.env` 文件（如果不存在）：

```bash
# Azure OpenAI 配置
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://psacodesprint2025.azure-api.net/gpt-4-1-mini/openai/deployments/gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

#### 2.2 数据库配置

确保MySQL服务正在运行，并创建数据库：

```bash
# 连接到MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE appdb;
```

### 3. 安装依赖

#### 3.1 后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 3.2 前端依赖

```bash
cd frontend
npm install
```

#### 3.3 模块依赖

```bash
# RAG模块
cd modules/rag_module
pip install -r requirements.txt

# SOP执行器模块
cd ../sop_executor
pip install -r requirements.txt
```

### 4. 启动服务

#### 4.1 启动后端服务

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动

#### 4.2 启动前端服务

```bash
cd frontend
npm start
```

前端服务将在 http://localhost:3000 启动

### 5. 配置数据库连接

访问前端界面 http://localhost:3000，点击"连接数据库"按钮，输入以下信息：

- **主机**: localhost
- **端口**: 3306
- **用户名**: root
- **密码**: x1uktrew
- **数据库名**: appdb

## 📖 使用指南

### 基本工作流程

1. **输入事件报告**: 在前端界面输入事件描述
2. **AI解析**: 系统自动解析事件并提取关键信息
3. **SOP检索**: 基于解析结果检索相关SOP建议
4. **生成执行计划**: AI生成详细的执行步骤
5. **执行SOP**: 逐步执行SOP计划，支持人工审批

### 功能特性

- 🤖 **智能事件解析**: 自动提取容器号、船舶信息等关键实体
- 📚 **SOP知识库**: 基于RAG技术的智能SOP检索
- 📋 **执行计划生成**: AI生成结构化的执行步骤
- 🔧 **SOP执行器**: 支持数据库操作的自动化执行
- 👥 **人工审批**: 高危操作需要人工确认
- 📊 **实时监控**: 显示Agent的思考过程和执行状态

## 🏗️ 项目结构

```
workspace/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/v1/endpoints/   # API端点
│   │   ├── services/           # 业务逻辑服务
│   │   └── main.py            # FastAPI应用入口
│   └── requirements.txt
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── features/          # 功能模块
│   │   ├── services/          # API服务
│   │   └── types/             # 类型定义
│   └── package.json
├── modules/                    # AI模块
│   ├── incident_parser/        # 事件解析器
│   ├── rag_module/            # RAG检索模块
│   └── sop_executor/          # SOP执行器
├── data/                      # 数据文件
│   └── knowledge_base_structured.json
└── README.md
```

## 🔧 API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

### 主要API端点

- `POST /api/v1/incidents/parse` - 事件解析
- `POST /api/v1/rag/enrich` - SOP检索增强
- `POST /api/v1/orchestrator/plan` - 生成执行计划
- `POST /api/v1/sop-execution/execute` - 执行SOP计划
- `POST /api/v1/database/configure` - 配置数据库连接

## 🛠️ 开发指南

### 添加新的SOP

1. 更新 `data/knowledge_base_structured.json` 文件
2. 重新向量化知识库（如果需要）
3. 测试SOP检索功能

### 调试技巧

- 查看后端日志了解AI Agent的执行过程
- 使用前端界面的"Agent思考过程"功能查看详细执行信息
- 通过API文档测试各个端点

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否运行
   - 确认数据库密码是否正确
   - 验证数据库是否存在

2. **前端无法连接后端**
   - 确认后端服务在8000端口运行
   - 检查CORS配置

3. **AI解析失败**
   - 检查Azure OpenAI API密钥配置
   - 确认网络连接正常

### 日志查看

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看实时日志
ps aux | grep uvicorn
```

## 📝 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📞 支持

如有问题，请通过以下方式联系：

- 提交GitHub Issue
- 发送邮件至项目维护者

---

**注意**: 请确保在生产环境中使用前，正确配置所有环境变量和安全设置。