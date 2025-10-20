# PortSentinel AI Assistant

**PortSentinel AI Assistant** is an AI-powered Level 2 (L2) incident handling system designed for port operations, such as PORTNET®.

It empowers duty officers to resolve IT incidents with greater speed and precision through an advanced multi-agent AI pipeline. The system automatically ingests and parses unstructured incident reports, intelligently enriches them using a knowledge base (SOPs) and historical cases, generates executable SOP steps, and executes these steps in a "Human-in-the-Loop" mode. It includes a built-in manual approval process for high-risk operations like database modifications.

## 🌟 Core Features

  * 🤖 **Intelligent Incident Parsing**: Automatically parses unstructured reports from Email, SMS, or calls into structured data (e.g., error codes, modules, entities).
  * 📚 **Dual-Source Intelligent Enrichment**:
    1.  **SOP Knowledge Base (RAG)**: Retrieves relevant Standard Operating Procedures (SOPs) from the "Duty Officer Knowledge Base".
    2.  **Historical Case Matching**: Matches similar past incidents and their resolutions from the "Historical Support Case Log".
  * 📋 **Dynamic Execution Planning**: AI dynamically converts retrieved SOPs (often vague text) into a clear, step-by-step executable plan.
  * 🔧 **Human-in-the-Loop Execution**: The system can automatically execute planned steps (like database queries), but features a critical **Manual Approval** process:
      * **High-Risk Operation Alert**: Execution pauses automatically when a step is identified as high-risk (e.g., `UPDATE` or `DELETE` database operations).
      * **Manual Review & Approval**: The frontend interface (`frontend/src/features/incident-parser/components/ApprovalRequest.tsx`) displays an approval card to the duty officer, showing the full SQL query and step description. The operation only proceeds after manual confirmation ("Approve Execution").
  * 📊 **Automatic Summary & Escalation**: After incident handling (success, failure, or manual rejection), the system automatically:
    1.  **Generates Resolution Summary**: Details the root cause, steps taken, and the final outcome.
    2.  **Drafts Escalation Email**: If L2 resolution fails, it identifies the correct L3 contact (`modules/agent_4_followup/escalation_contacts.csv`) and drafts a detailed escalation email.
  * 🖥️ **Full-Stack Application**:
      * **Frontend**: Modern, responsive chat interface built with **React (TypeScript)** and **Chakra UI**.
      * **Backend**: High-performance API service built with **Python (FastAPI)**.

## 🤖 AI Agent Workflow

The system operates via an API-driven, frontend-coordinated AI agent pipeline:

1.  **Agent 1: Incident Parser**

      * **Module**: `modules/incident_parser`
      * **Trigger**: User submits a raw report in the frontend.
      * **Function**: Calls the `parseIncidentReport` API to convert raw text into a structured JSON object.

2.  **Agent 2: Enrichment Agent**

      * **Modules**: `modules/history_record_rag` and `modules/rag_module`
      * **Trigger**: Automatically called by the frontend after parsing.
      * **Function**: Concurrently calls `matchHistoryCases` and `enrichIncident` APIs to retrieve contextual information from historical cases and the SOP knowledge base, respectively.

3.  **Agent 3 (Planner): Orchestrator**

      * **Module**: `modules/sop_executor/src/orchestrator.py`
      * **Trigger**: Called by the frontend after the enrichment step.
      * **Function**: Calls the `fetchExecutionPlan` API. The AI (SOPPlanner) analyzes the incident and SOPs to generate a step-by-step execution plan.

4.  **Agent 3 (Executor): SOP Executor**

      * **Module**: `modules/sop_executor/src/agent.py`
      * **Trigger**: After the user confirms the execution plan in the frontend.
      * **Function**: Calls the `executeSOPPlan` API. The execution agent (SOPExecutionAgent) starts executing the plan step-by-step. If it encounters a high-risk step, it stops and returns a `needs_approval` status, waiting for the frontend (`frontend/src/features/incident-parser/IncidentParserPage.tsx`) to send an `approveSOPExecution` or `continueSOPExecution` request.

5.  **Agent 4: Follow-up Agent**

      * **Module**: `modules/agent_4_followup`
      * **Trigger**: After the execution flow ends (completed, failed, or rejected).
      * **Function**: Calls the `generateExecutionSummary` API. The AI analyzes the entire process, generates the final Markdown summary, and prepares an escalation email if needed.

## 🏗️ Project Structure

Your project structure is a well-organized "monorepo" clearly separating frontend, backend, and AI logic.

```
portsentinel-ai-assistant/
├── backend/                    # Backend FastAPI service
│   ├── app/
│   │   ├── api/v1/endpoints/   # API routes (incident_parser.py, rag.py, sop_execution.py, etc.)
│   │   ├── services/           # Business logic (sop_execution_service.py, orchestrator_service.py, etc.)
│   │   └── main.py             # FastAPI application entry point
│   └── requirements.txt
│
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── features/incident-parser/  # Core chat interface
│   │   │   ├── IncidentParserPage.tsx # Main page coordinating the AI workflow
│   │   │   └── components/            # Chat bubbles, approval request card (ApprovalRequest.tsx), etc.
│   │   ├── services/
│   │   │   ├── api.ts          # Defines all API calls to the backend
│   │   │   └── auth.ts         # Authentication service
│   │   ├── pages/              # Other pages (Dashboard.tsx, LandingPage.tsx)
│   │   └── App.tsx             # Routing configuration
│   └── package.json
│
├── modules/                    # Core AI agent logic (Python)
│   ├── agent_4_followup/       # Agent 4: Summary & Escalation
│   ├── history_record_rag/     # Agent 2a: Historical Case RAG
│   ├── incident_parser/        # Agent 1: Incident Parsing
│   ├── rag_module/             # Agent 2b: SOP Knowledge Base RAG
│   └── sop_executor/           # Agent 3: Planning Orchestration & Execution
│
├── data/                       # Raw data sources
│   ├── case_log_rag.json       # Historical cases
│   ├── knowledge_base_structured.json # SOP Knowledge Base
│   └── escalation_contacts.csv # L3 Escalation Contacts
│
├── history_vector_db/          # Vector database for historical cases
├──.env.example                 # Environment variable template
└── README.md                   # (This document)
```

## 🚀 Quick Start

### System Requirements

  * Python 3.8+
  * Node.js 16+
  * MySQL 8.0+
  * Git

### 1\. Environment Setup

Create a `.env` file (you can copy from `.env.example`) and fill in your configurations:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT=gpt-4-1-mini # Or your model deployment name

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=appdb
```

### 2\. Database Setup

Ensure your MySQL service is running and create the database:

```bash
# 1. Connect to MySQL
mysql -u root -p

# 2. Create the database
CREATE DATABASE appdb;
```

### 3\. Install Dependencies

You need to install dependencies for both the backend and frontend separately.

```bash
# 1. Install backend dependencies
cd backend
pip install -r requirements.txt

# 2. Install frontend dependencies
cd ../frontend
npm install
```

**Note**: Dependencies for the AI modules (`modules/`) are included in `backend/requirements.txt`.

### 4\. Start Services

You will need two separate terminals to run the backend and frontend.

```bash
# Terminal 1: Start backend service (from root directory)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Backend service will run at http://localhost:8000
```

```bash
# Terminal 2: Start frontend service (from root directory)
cd frontend
npm start
# Frontend service will run at http://localhost:3000
```

### 5\. Configure Database Connection (in UI)

After starting the project, visit `http://localhost:3000`. You might see a "Database Not Connected" prompt at the top of the interface.

1.  Click the "Database Settings" button.
2.  In the modal that appears (`frontend/src/features/incident-parser/components/DatabaseConnectionModal.tsx`), enter your MySQL connection details (matching `DB_USER` and `DB_PASSWORD` from your `.env` file).
3.  Click the "Connect" button.

## 🛠️ Core API Overview

All APIs are available under the `http://localhost:8000/api/v1` path, organized by `backend/app/main.py`.

  * `POST /api/v1/incidents/parse`: (Agent 1) Parses raw incident text.
  * `POST /api/v1/history/match`: (Agent 2a) Matches historical cases.
  * `POST /api/v1/rag/enrich`: (Agent 2b) Retrieves from SOP knowledge base.
  * `POST /api/v1/orchestrator/plan`: (Agent 3 Planner) Generates the execution plan.
  * `POST /api/v1/sop-execution/execute`: (Agent 3 Executor) Starts executing the plan.
  * `POST /api/v1/sop-execution/approve`: (Human) Approves a high-risk step.
  * `POST /api/v1/sop-execution/continue`: (Agent 3 Executor) Continues to the next non-high-risk step.
  * `POST /api/v1/summary/generate`: (Agent 4) Generates the final resolution summary.
  * `POST /api/v1/database/configure`: (UI) Configures the database connection.
  * `POST /api/v1/auth/token`: (Auth) Gets the user login token.