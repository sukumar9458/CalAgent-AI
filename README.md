# CalAgent AI — Autonomous Executive Assistant & Calendar Agent 🤖📅🎙️

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Mastra AI](https://img.shields.io/badge/Mastra_AI-Framework-purple?style=for-the-badge)](https://mastra.ai/)
[![MCP Supported](https://img.shields.io/badge/MCP-Protocol_Supported-blueviolet?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-Serverless_Cloud-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**CalAgent AI** is an advanced, full-stack autonomous AI Executive Assistant designed to seamlessly connect users with their Google Calendar, interact via multi-turn conversational AI agents, stream real-time agent responses (SSE), persist thread history, manage meetings through natural language, and expose calendar capabilities over the **Model Context Protocol (MCP)**.

Built specifically to showcase cutting-edge **Agentic AI engineering**, **Model Context Protocol (MCP)**, **LLM tool calling**, and **full-stack modern web architecture**.

---

## 🌟 Key Features

### 1. 🤖 Agentic AI Calendar Management & Google Calendar OAuth
- **Google Calendar Integration**: Direct OAuth 2.0 integration allowing users to connect their personal calendar.
- **Natural Language Meeting Scheduling**: Query daily agendas, book meetings, find open availability slots, and parse attendee vectors dynamically.
- **Autonomous Tool Calling**: Powered by `@mastra/core` agents executing Zod-validated calendar tools.

### 2. ⚡ Real-Time Streaming & Persistent Memory
- **SSE Agent Streaming**: Streams LLM token generation in real time over Server-Sent Events (SSE) for zero-perceived-latency UI updates.
- **Multi-Turn Persistent Memory**: Powered by `@mastra/memory` storing conversational threads across sessions.

### 3. 🔌 Model Context Protocol (MCP) Capabilities
- **Exposed MCP Server**: Mounts an MCP endpoint (`/mcp`) via `@descope/mcp-express` to expose calendar tools directly to external AI systems (Cursor, Claude, third-party agents).

### 4. 🎙️ Hands-Free Voice Assistant (STT & TTS)
- **Speech-to-Text & Synthesizer**: Continuous Web Speech API STT input with TTS voice feedback and dynamic mic visualizer.

### 5. 📝 AI Meeting Notes Extractor & Task Pipeline
- **Action Item Extraction**: Parses transcripts and meeting notes into actionable tasks with assigned priority (`HIGH`, `MEDIUM`, `LOW`) saved in Neon Serverless PostgreSQL.

---

## 🏗️ System Architecture

```
                                +-----------------------------+
                                |      Next.js 16 Client      |
                                |  (React 19 + Tailwind v4)   |
                                +--------------+--------------+
                                               |
                                     HTTP / SSE / Web Speech
                                               |
                                               v
                                +--------------+--------------+
                                |     Node.js Express Server  |
                                |    (MCP Mount + SSE Stream) |
                                +--------------+--------------+
                                               |
                       +-----------------------+-----------------------+
                       |                                               |
                       v                                               v
        +--------------+--------------+                 +--------------+--------------+
        |    Mastra AI Framework      |                 |    Model Context Protocol   |
        | (Persistent Thread Memory)  |                 |    (MCP Endpoint /mcp)      |
        +-------+--------------+------+                 +--------------+--------------+
                |              |                                       |
+---------------+              +---------------+                       |
|                                              |                       v
v                                              v          +------------+------------+
+---------------+--------------+  +------------+------------+ | External MCP Clients    |
|   Neon Serverless PostgreSQL |  | Google Calendar API     | | (Cursor / AI Tools)     |
|   (Tasks & App State)        |  | (Descope OAuth Bridge)  | +-------------------------+
+------------------------------+  +-------------------------+
```

---

## 🛠️ Tech Stack & Tooling

| Layer | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 16.3` (App Router, React 19) | Modern SSR/CSR hybrid application |
| **Styling** | `Tailwind CSS v4`, `Lucide React` | Design system, glassmorphism, responsive components |
| **Voice Processing** | `Web Speech API` (SpeechRecognition & SpeechSynthesis) | STT input & TTS voice feedback |
| **Backend Framework** | `Node.js`, `Express 5.2`, `TypeScript 7` | REST API routes, SSE streaming endpoint |
| **Protocol Integration** | `@descope/mcp-express` | Model Context Protocol (MCP) server integration |
| **Agentic AI Engine** | `@mastra/core`, `@mastra/memory`, `@mastra/libsql` | AI agent workflows, tools, and persistent memory |
| **LLM Provider** | `Google Gemini 3.6 Flash` | Fast, multi-turn reasoning and tool invocation |
| **Cloud Database** | `Neon Postgres` (Serverless PostgreSQL) | Cloud storage & connection pooling for extracted action items/tasks |
| **Authentication** | `Descope SDK` (`@descope/nextjs-sdk`, `@descope/node-sdk`) | User identity management and Google Calendar OAuth 2.0 |

---

## 📁 Repository Structure

```
agentic-calendar-assistant/
├── docker-compose.yml       # PostgreSQL database container configuration
├── README.md                # Project documentation
├── backend/
│   ├── src/
│   │   ├── index.ts         # Express server entrypoint
│   │   ├── repositories/    # Task database repository (PostgreSQL queries)
│   │   ├── routes/          # Express API route handlers (/api/chat, /api/tasks, etc.)
│   │   ├── services/        # Agent service & Mastra agent definitions
│   │   └── tools/           # Custom Mastra tools (Calendar creation, Task creation, Slot lookup)
│   ├── sql/                 # SQL schemas & table definitions
│   ├── scripts/             # Database migration scripts
│   ├── .env.example         # Backend environment variables template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/             # Next.js App Router pages (Dashboard, Sign-In, etc.)
    │   ├── components/      # UI components (ChatPanel, TasksPanel, ConnectionPanel, Sidebar)
    │   └── lib/             # Custom hooks (`use-voice.ts`) and API client helpers
    ├── .env.example         # Frontend environment variables template
    └── package.json
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm** or **pnpm** / **yarn**
- **Docker & Docker Compose**: For running PostgreSQL database
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)
- **Descope Project ID**: [Descope Admin Portal](https://www.descope.com/)

---

### 2. Environment Setup

#### Backend Setup:
Copy `.env.example` in `backend/` to `.env` and fill in your credentials:

```bash
cd backend
cp .env.example .env
```

Config parameters inside `backend/.env`:
```ini
PORT=4000
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5442/agentic_calendar_app_db
DESCOPE_PROJECT_ID=your_descope_project_id
DESCOPE_MANAGEMENT_KEY=your_descope_management_key
DESCOPE_CALENDAR_CONNECTION_ID=google-calendar
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

#### Frontend Setup:
Copy `.env.example` in `frontend/` to `.env`:

```bash
cd ../frontend
cp .env.example .env
```

Config parameters inside `frontend/.env`:
```ini
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### 3. Database Initialization

Start the PostgreSQL database container:

```bash
# Run from repository root directory
docker-compose up -d
```

Run database migrations to initialize tables:

```bash
cd backend
npm run migrate
```

---

### 4. Running the Application

#### Start the Backend Server:
```bash
cd backend
npm run dev
```
*(Backend runs on `http://localhost:4000`)*

#### Start the Frontend Server:
```bash
cd frontend
npm run dev
```
*(Frontend runs on `http://localhost:3000`)*

Open your browser and navigate to **`http://localhost:3000`** to experience **CalAgent AI**.

---

## 🎯 Sample Interactions & Demonstrations

| Intent / Prompt | Agent Response & Execution |
| :--- | :--- |
| **"What's on today?"** | Reads current Google Calendar events for the day via tool calling and presents structured list. |
| **"Create a meeting on 20th Aug at 10am for 30 minutes with alex@example.com"** | Calculates start/end timestamps, invokes `createCalendarEventTool`, schedules the event, and returns confirmation. |
| **"Find a free slot tomorrow morning"** | Audits existing calendar entries and recommends open morning time windows. |
| **"Extract action items from yesterday's meeting: John needs to review the PR by Friday, priority high."** | Automatically recognizes action items and writes them to PostgreSQL, updating the Tasks panel live. |

---

## 🧪 AI & Engineering Highlights (Portfolio Focus)

- **Stateful Conversational Memory**: Utilizes `@mastra/memory` to maintain contextual history across multiple turns of user interaction.
- **Strict Zod Schema Validation**: Tool parameters are defined with Zod schemas to guarantee type-safe argument extraction from Gemini.
- **Resilient Web Speech Handling**: Engineered audio handling fallback patterns to mitigate network interrupts in speech recognition engines.
- **Clean Architecture**: Decoupled repository patterns for data operations, segregated service layers for AI tool execution, and modular UI component structure.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
