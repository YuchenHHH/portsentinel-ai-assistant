# PortSentinel AI Assistant

PortSentinel AI Assistant is an AI-powered port operations incident handling and SOP execution system. It intelligently parses incident reports, automatically retrieves relevant SOP recommendations, and generates executable solutions.

## 🚀 Quick Start

### System Requirements

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

### One-Click Launch (Recommended)

```bash
# 1. Clone project
git clone <repository-url>
cd workspace

# 2. Run configuration script
./setup.sh

# 3. Start services
./start.sh
```

### Manual Installation Steps

### 2. Environment Configuration

#### 2.1 Set Environment Variables

Create `.env` file (if not exists):

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://psacodesprint2025.azure-api.net/gpt-4-1-mini/openai/deployments/gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

#### 2.2 Database Configuration

Ensure MySQL service is running and create database:

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE appdb;
```

### 3. Install Dependencies

#### 3.1 Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 3.2 Frontend Dependencies

```bash
cd frontend
npm install
```

#### 3.3 Module Dependencies

```bash
# RAG Module
cd modules/rag_module
pip install -r requirements.txt

# SOP Executor Module
cd ../sop_executor
pip install -r requirements.txt
```

### 4. Start Services

#### 4.1 Start Backend Service

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend service will start at http://localhost:8000

#### 4.2 Start Frontend Service

```bash
cd frontend
npm start
```

Frontend service will start at http://localhost:3000

### 5. Configure Database Connection

Visit frontend interface http://localhost:3000, click "Connect Database" button, enter the following information:

- **Host**: localhost
- **Port**: 3306
- **Username**: root
- **Password**: x1uktrew
- **Database**: appdb

## 📖 User Guide

### Basic Workflow

1. **Input Incident Report**: Enter incident description in frontend interface
2. **AI Parsing**: System automatically parses incident and extracts key information
3. **SOP Retrieval**: Retrieve relevant SOP recommendations based on parsing results
4. **Generate Execution Plan**: AI generates detailed execution steps
5. **Execute SOP**: Step-by-step SOP execution with human approval support

### Features

- 🤖 **Intelligent Incident Parsing**: Automatically extracts container numbers, vessel information and other key entities
- 📚 **SOP Knowledge Base**: Intelligent SOP retrieval based on RAG technology
- 📋 **Execution Plan Generation**: AI generates structured execution steps
- 🔧 **SOP Executor**: Supports automated database operations
- 👥 **Human Approval**: High-risk operations require human confirmation
- 📊 **Real-time Monitoring**: Shows Agent's thinking process and execution status

## 🏗️ Project Structure

```
workspace/
├── backend/                    # Backend service
│   ├── app/
│   │   ├── api/v1/endpoints/   # API endpoints
│   │   ├── services/           # Business logic services
│   │   └── main.py            # FastAPI application entry
│   └── requirements.txt
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── features/          # Feature modules
│   │   ├── services/          # API services
│   │   └── types/             # Type definitions
│   └── package.json
├── modules/                    # AI modules
│   ├── incident_parser/        # Incident parser
│   ├── rag_module/            # RAG retrieval module
│   └── sop_executor/          # SOP executor
├── data/                      # Data files
│   └── knowledge_base_structured.json
└── README.md
```

## 🔧 API Documentation

After starting the backend service, visit http://localhost:8000/docs to view the complete API documentation.

### Main API Endpoints

- `POST /api/v1/incidents/parse` - Incident parsing
- `POST /api/v1/rag/enrich` - SOP retrieval enhancement
- `POST /api/v1/orchestrator/plan` - Generate execution plan
- `POST /api/v1/sop-execution/execute` - Execute SOP plan
- `POST /api/v1/database/configure` - Configure database connection

## 🛠️ Development Guide

### Adding New SOPs

1. Update `data/knowledge_base_structured.json` file
2. Re-vectorize knowledge base (if needed)
3. Test SOP retrieval functionality

### Debugging Tips

- Check backend logs to understand AI Agent execution process
- Use frontend interface's "Agent Thinking Process" feature to view detailed execution information
- Test various endpoints through API documentation

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if MySQL service is running
   - Verify database password is correct
   - Confirm database exists

2. **Frontend Cannot Connect to Backend**
   - Ensure backend service is running on port 8000
   - Check CORS configuration

3. **AI Parsing Failed**
   - Check Azure OpenAI API key configuration
   - Verify network connection

### Log Viewing

```bash
# View backend logs
tail -f backend/logs/app.log

# View real-time logs
ps aux | grep uvicorn
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve the project.

## 📞 Support

If you have questions, please contact through:

- Submit GitHub Issue
- Send email to project maintainers

---

**Note**: Please ensure all environment variables and security settings are properly configured before using in production environment.