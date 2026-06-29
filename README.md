# Discord Slash-Command Bot

A full-stack application that provides an interactive control panel for configuring and monitoring a Discord Slash-Command bot. The system features user authentication, server-specific mirroring logs, and dynamic AI-powered summarization of user reports.

---

## Architecture Overview

```text
React Frontend (Vite + TypeScript + Tailwind)
   │
   ▼
Supabase Auth (User sign-in & JWT management)
   │
   ▼
Express + TypeScript (API Server & Bot Gateway)
   │
   ├──► PostgreSQL Database (Supabase target via Prisma ORM)
   │
   ├──► Discord Bot client (Slash command gateway & Webhooks API)
   │
   └──► Groq AI Cloud (Report summarization with Llama models)
```

---

## Features

- **Dashboard Overview**: Track active connected servers, registered commands, today's interactions, active mirroring channels, successful executions, and command failures at a glance.
- **Server Connections**: Manage connected servers authorized to communicate with the bot, verify bot connection status, and synchronize slash commands.
- **Command Parameters Config**: Toggle specific slash commands (`/report`, `/status`) on/off, toggle AI summarization options, and configure log mirroring behavior.
- **Mirroring Configuration**: Bind server logging and status output to specific Discord text channels.
- **Interaction Logs & Action History**: Real-time auditing of commands executed by users, including details on parameters, execution status, and API logs.
- **Error Propagation & Reliability**: Overhauled error handling to capture all runtime database, Discord REST API, and AI failures.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database instance (or Supabase project)
- Discord Bot Application credentials (from the Discord Developer Portal)
- Groq API Key (for report summarization)

---

### Configuration & Environment Variables

Create `.env` configuration files inside both the `frontend/` and `backend/` directories.

#### 1. Backend (`backend/.env`)
Copy the template from `backend/.env.example` and configure the following variables:
```env
# Database Connection (Supabase PostgreSQL target)
DATABASE_URL="postgresql://username:password@host:6543/postgres?pgbouncer=true&connection_limit=3"

# Supabase Project Configuration
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Discord Developer API Integration
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
DISCORD_PUBLIC_KEY="your-public-key"
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_REDIRECT_URI="http://localhost:8000/api/v1/discord/callback"

# AI Provider Integration
GROQ_API_KEY="your-groq-api-key"

# Link Configuration
GITHUB_REPO_URL="your-repo-link"
DASHBOARD_URL="your-dashboard-link"

# CORS Allowed Origins (JSON Array)
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

#### 2. Frontend (`frontend/.env`)
Create a `frontend/.env` file with the following variables:
```env
VITE_API_URL="http://localhost:8000"
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

### Running Locally

Follow these instructions to run the full-stack system on your machine:

#### Step 1: Run the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the database migration to synchronize your database tables:
   ```bash
   npx prisma db push
   ```
4. Generate the Prisma Client types:
   ```bash
   npx prisma generate
   ```
5. Start the Express backend development server:
   ```bash
   npm run dev
   ```
   *The server runs by default on port `8000`.*

#### Step 2: Run the Frontend
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend runs by default on `http://localhost:3000` (or `http://localhost:5173`).*

---

## Deployment

The application is deployed across the following services:

### 1. Database & Authentication
- **Supabase**: Hosts the managed PostgreSQL database instance and manages user authentication (signup, login, and secure JWT-based authorization).

### 2. Backend API & Discord Bot
- **Render**: Hosts the backend Express.js server and active Discord Gateway Bot client.
  - Configuration details are loaded from environment variables matching `backend/.env`.
  - Set appropriate port configurations (Render detects ports automatically).

### 3. Frontend Client
- **Vercel**: Deploy the static React application.
  - Vercel handles the build configuration and serves the assets globally.
  - Environment variables matching `frontend/.env` (specifically `VITE_API_URL` pointing to your Render backend instance) are configured in the Vercel dashboard.
  - Ensure the Vercel app domain is added to `BACKEND_CORS_ORIGINS` in your backend configuration.
