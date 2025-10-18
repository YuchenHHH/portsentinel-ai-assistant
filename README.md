# PortSentinel AI Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)

> 🚀 **智能港口事件报告解析与知识检索系统** - 基于混合检索技术的 RAG 增强 AI 助手

## 📋 项目概述

PortSentinel AI Assistant 是一个先进的智能事件报告解析系统，专门为港口运营场景设计。系统结合了自然语言处理、混合检索技术和知识库增强生成（RAG），能够自动解析事件报告并提供相关的标准操作程序（SOP）建议。

### 🎯 核心功能

- **📝 智能事件解析**: 自动提取事件关键信息（紧急程度、影响模块、实体等）
- **🔍 混合检索技术**: BM25 + 向量检索 + Multi-Query + RRF + 重排序
- **📚 知识库增强**: 基于 77 个结构化 SOP 文档的智能检索
- **💬 对话式界面**: 现代化的聊天机器人交互体验
- **📊 检索指标可视化**: 详细的检索过程指标展示
- **🎨 响应式设计**: 基于 Chakra UI 的美观界面

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │   后端 (FastAPI) │    │   AI 模块      │
│                 │    │                 │    │                 │
│ • TypeScript    │◄──►│ • Python 3.12+ │◄──►│ • LangChain     │
│ • Chakra UI     │    │ • Pydantic      │    │ • Azure OpenAI  │
│ • Axios         │    │ • Uvicorn       │    │ • Chroma DB     │
│ • Framer Motion │    │ • CORS          │    │ • Hybrid RAG    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0+
- **Python**: 3.12+
- **Git**: 2.0+

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/YuchenHHH/portsentinel-ai-assistant.git
cd portsentinel-ai-assistant
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量文件
# 添加你的 Azure OpenAI API 配置
```

4. **构建知识库**
```bash
# 运行向量化脚本
cd modules/rag_module
python vectorize_knowledge_base.py
```

5. **启动服务**
```bash
# 启动后端服务 (端口 8000)
cd backend
python -m uvicorn app.main:app --reload --port 8000

# 启动前端服务 (端口 3000)
cd frontend
npm start
```

6. **访问应用**
- 前端界面: http://localhost:3000
- 后端 API 文档: http://localhost:8000/docs

## 🎮 使用指南

### 基本使用流程

1. **输入事件报告**: 在聊天界面输入事件描述
2. **自动解析**: 系统自动提取关键信息
3. **知识检索**: 基于混合检索技术找到相关 SOP
4. **查看结果**: 浏览解析结果和推荐的解决方案

### 支持的事件类型

- **📧 Email 报告**: 邮件形式的事件报告
- **📱 SMS 消息**: 短信形式的事件通知
- **☎️ 电话记录**: 电话沟通的事件记录

### 支持的模块

- **📦 Container**: 集装箱相关事件
- **🚢 Vessel**: 船舶相关事件
- **🔄 EDI/API**: 数据交换和 API 相关事件

## 🔧 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | 用户界面框架 |
| TypeScript | 5.0+ | 类型安全 |
| Chakra UI | 2.8+ | UI 组件库 |
| Axios | 1.6+ | HTTP 客户端 |
| Framer Motion | 10.16+ | 动画效果 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.104+ | Web 框架 |
| Python | 3.12+ | 编程语言 |
| Pydantic | 2.5+ | 数据验证 |
| Uvicorn | 0.24+ | ASGI 服务器 |
| LangChain | 0.1+ | LLM 框架 |

### AI 技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Azure OpenAI | Latest | 大语言模型 |
| Chroma DB | 0.4+ | 向量数据库 |
| Rank-BM25 | 0.2+ | 关键词检索 |
| Scikit-learn | 1.3+ | 机器学习 |

## 📁 项目结构

```
portsentinel-ai-assistant/
├── frontend/                    # React 前端应用
│   ├── src/
│   │   ├── features/           # 功能模块
│   │   ├── services/           # API 服务
│   │   ├── types/              # TypeScript 类型
│   │   └── theme/              # UI 主题
│   └── package.json
├── backend/                     # FastAPI 后端应用
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── core/              # 核心配置
│   │   ├── services/          # 业务逻辑
│   │   └── main.py            # 应用入口
│   └── requirements.txt
├── modules/                     # AI 模块
│   ├── incident_parser/        # 事件解析模块
│   └── rag_module/            # 混合检索 RAG 模块
├── data/                       # 数据文件
│   ├── Knowledge Base.docx    # 原始知识库
│   └── knowledge_base_structured.json
└── README.md
```

## 🔍 核心特性

### 混合检索技术

系统采用先进的混合检索架构，结合多种检索方法：

- **🔤 BM25 检索**: 基于关键词的精确匹配
- **🧠 向量检索**: 基于语义的相似性匹配
- **🔄 Multi-Query**: 多查询变体生成
- **⚖️ RRF 融合**: 倒数排名融合算法
- **📊 重排序**: 语义重排序优化

### 智能事件解析

- **自动实体提取**: 识别容器号、船舶名、错误代码等
- **紧急程度评估**: 自动判断事件紧急程度
- **模块分类**: 智能识别影响模块
- **原因分析**: 提供潜在原因提示

### 知识库增强

- **77 个结构化 SOP**: 涵盖港口运营各个方面
- **完整解决方案**: 包含概述、前置条件、解决步骤、验证方法
- **检索指标**: 详细的检索过程指标展示
- **相关性评分**: 多维度评分系统

## 📊 API 文档

### 事件解析 API

```http
POST /api/v1/incidents/parse
Content-Type: application/json

{
  "source_type": "Email",
  "raw_text": "事件描述文本"
}
```

### RAG 增强 API

```http
POST /api/v1/rag/enrich
Content-Type: application/json

{
  "incident_id": "ALR-861600",
  "problem_summary": "问题摘要",
  "affected_module": "Container",
  "urgency": "High",
  "entities": [...]
}
```

完整的 API 文档请访问: http://localhost:8000/docs

## 🧪 测试

### 运行测试

```bash
# 后端测试
cd backend
python -m pytest

# 前端测试
cd frontend
npm test
```

### 集成测试

```bash
# 运行完整集成测试
python test_integration.py
```

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 生产环境

```bash
# 构建前端
cd frontend
npm run build

# 启动后端
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 遵循 PEP 8 Python 代码规范
- 使用 TypeScript 严格模式
- 编写单元测试
- 更新文档

## 📝 更新日志

### v1.0.0 (2025-01-18)

- ✨ 初始版本发布
- 🚀 混合检索 RAG 系统
- 💬 对话式用户界面
- 📚 77 个结构化 SOP 知识库
- 🔍 多维度检索指标
- 🎨 响应式 UI 设计

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

- **黄宇辰** - 项目负责人 & 全栈开发

## 🙏 致谢

- [LangChain](https://langchain.com/) - LLM 应用框架
- [Chakra UI](https://chakra-ui.com/) - React UI 库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代 Web 框架
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) - AI 服务

## 📞 联系方式

- **项目链接**: [https://github.com/YuchenHHH/portsentinel-ai-assistant](https://github.com/YuchenHHH/portsentinel-ai-assistant)
- **问题反馈**: [Issues](https://github.com/YuchenHHH/portsentinel-ai-assistant/issues)

---

⭐ **如果这个项目对你有帮助，请给它一个星标！**