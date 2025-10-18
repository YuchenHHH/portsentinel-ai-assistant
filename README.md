# PortSentinel AI Assistant

PortSentinel AI Assistant 是一个基于 Web 的智能事件报告解析系统，使用 AI 技术自动解析和结构化事件报告内容。

## 项目架构

本项目采用 Monorepo 架构，使用 Yarn Workspaces 进行管理，包含以下主要组件：

```
portsentinel-ai-assistant/
├── frontend/                 # React + TypeScript + Chakra UI 前端应用
├── backend/                  # FastAPI 后端服务
├── modules/                  # AI 功能模块
│   └── incident_parser/      # 事件解析模块
├── packages/                 # 共享包和工具
└── docs/                     # 项目文档
```

## 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Chakra UI** - 现代化 UI 组件库
- **Axios** - HTTP 客户端
- **React Router** - 路由管理

### 后端
- **FastAPI** - 现代、快速的 Python Web 框架
- **Pydantic** - 数据验证和序列化
- **Uvicorn** - ASGI 服务器
- **Python 3.8+** - 编程语言

### AI 模块
- **Python** - AI 模块开发语言
- **可扩展架构** - 支持多种 AI 功能模块

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- Yarn >= 1.22.0
- Python >= 3.8.0
- pip

### 安装依赖

1. 安装根目录依赖：
```bash
yarn install
```

2. 安装前端依赖：
```bash
yarn workspace frontend install
```

3. 安装后端依赖：
```bash
yarn workspace backend install-deps
```

### 开发环境启动

1. 启动后端服务（端口 8000）：
```bash
yarn workspace backend dev
```

2. 启动前端应用（端口 3000）：
```bash
yarn workspace frontend dev
```

3. 或者同时启动前后端：
```bash
yarn dev
```

### 访问应用

- 前端应用：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 功能特性

### 事件解析功能

- **多源支持**：支持邮件、日志、系统报告等多种来源类型
- **智能解析**：使用 AI 技术自动提取结构化信息
- **实时处理**：快速响应，实时显示解析结果
- **可视化展示**：清晰的结果展示界面

### 技术特性

- **类型安全**：全面的 TypeScript 支持
- **响应式设计**：适配各种设备尺寸
- **现代化 UI**：基于 Chakra UI 的美观界面
- **RESTful API**：标准化的 API 设计
- **可扩展架构**：支持添加新的 AI 功能模块

## API 文档

### 事件解析接口

**POST** `/api/v1/incidents/parse`

请求体：
```json
{
  "source_type": "email|log|manual|system|other",
  "raw_text": "事件报告原始文本"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "incident_id": "INC-20240115-ABC12345",
    "severity": "medium",
    "summary": "事件摘要",
    "description": "详细描述",
    "timestamp": "2024-01-15T14:30:00Z",
    "extracted_entities": {
      "ips": ["192.168.1.100"],
      "emails": ["user@example.com"],
      "urls": ["https://example.com"]
    }
  },
  "message": "事件解析成功"
}
```

## 开发指南

### 添加新的 AI 模块

1. 在 `modules/` 目录下创建新模块
2. 实现模块的核心功能
3. 在后端服务中集成模块
4. 创建对应的前端界面

### 代码规范

- 前端使用 ESLint + Prettier
- 后端使用 Black + isort + flake8
- 提交前请运行代码格式化

### 测试

```bash
# 前端测试
yarn workspace frontend test

# 后端测试
yarn workspace backend test
```

## 部署

### 生产环境构建

```bash
# 构建前端
yarn workspace frontend build

# 启动后端
yarn workspace backend start
```

### Docker 部署

```bash
# 构建镜像
docker build -t portsentinel-ai-assistant .

# 运行容器
docker run -p 8000:8000 -p 3000:3000 portsentinel-ai-assistant
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者：PortSentinel Team
- 邮箱：contact@portsentinel.ai
- 项目地址：https://github.com/portsentinel/ai-assistant

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 基础事件解析功能
- React + FastAPI 架构
- Monorepo 项目结构
