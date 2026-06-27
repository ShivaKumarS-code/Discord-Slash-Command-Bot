# Full-Stack Monorepo Template

A production-ready monorepo template containing a React (Vite + TypeScript + Tailwind CSS) frontend and an Express + TypeScript + Prisma backend.

> [!NOTE]
> Only the project scaffolding, configurations, folder directories, and database mappings have been completed. Business logic, authentication flows, Discord interactions, and AI query pipelines are planned but not yet implemented.

## Stack & Integrations Architecture

The application is structured to support the following data flow:

```text
React (Vite + TS + Tailwind CSS)
  │
  ▼
Supabase Auth (Planned client authentication)
  │
  ▼
Express + TypeScript (REST API server)
  │
  ├──► PostgreSQL (Supabase database target via Prisma ORM)
  │
  ├──► Discord API (Outgoing triggers / Webhook validation)
  │
  └──► Groq (AI model prompting interactions)
```

## Directory Structure

```text
.
├── backend/                  # Express + TypeScript Backend Application
│   ├── prisma/               # Prisma ORM Migrations & Schema Config
│   │   └── schema.prisma     # Central Database schema and relations mapping
│   ├── src/                  # Application Core Logic
│   │   ├── config/           # Configuration Settings (Zod env parser)
│   │   │   └── env.ts
│   │   ├── database/         # Database Engine config folder
│   │   ├── dependencies/     # Dependency Injections (Prisma client, currentUser)
│   │   │   ├── prisma.ts
│   │   │   └── currentUser.ts
│   │   ├── enums/            # Centralized JS enums (interactionStatus, actionStatus, actionType)
│   │   ├── events/           # Dispatch handlers for Discord event types (interactions, buttons, modals)
│   │   ├── integrations/     # Outgoing service clients (discord, groq, supabase)
│   │   ├── middleware/       # Custom Web Request filters (logging, signature checks, errorHandler)
│   │   │   ├── errorHandler.ts
│   │   │   ├── logger.ts
│   │   │   ├── auth.ts
│   │   │   └── discordSignature.ts
│   │   ├── routes/           # Express Router controllers (routes/index.ts)
│   │   ├── services/         # Domain-driven business logic services
│   │   ├── utils/            # Helper utilities (retry logic, signature parsers)
│   │   └── index.ts          # Express application entrypoint
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Node dependencies & scripts
│   └── tsconfig.json         # TypeScript configuration
│
├── frontend/                 # React Frontend Application
│   ├── src/
│   │   ├── assets/           # Static assets
│   │   ├── components/       # Shared UI components
│   │   │   └── ui/           # shadcn/ui components folder
│   │   ├── contexts/         # React Contexts (AuthProvider structure)
│   │   ├── providers/        # Global React Context Wrappers (QueryClient, Auth, Theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions (shadcn 'cn' helper)
│   │   ├── pages/            # Page/View components
│   │   ├── routes/           # React Router route configurations
│   │   ├── services/         # API integration services
│   │   ├── types/            # TypeScript declarations
│   │   ├── App.tsx           # App root & routes provider
│   │   ├── index.css         # Styling sheet (Importing Tailwind CSS)
│   │   └── main.tsx          # Vite React entry point
│   ├── .env.example          # Environment variables template
│   ├── components.json       # shadcn/ui configuration
│   ├── index.html            # Entry HTML template
│   ├── package.json          # Node dependencies & scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration (Tailwind v4 enabled)
│
└── .gitignore                # Global git ignore configuration
```

## Getting Started

### Environment Variables setup

#### Frontend (.env)
Create a `frontend/.env` file with:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Backend (.env)
Create a `backend/.env` file with:
```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DISCORD_APPLICATION_ID=your-discord-application-id
DISCORD_PUBLIC_KEY=your-discord-public-key
DISCORD_BOT_TOKEN=your-discord-bot-token
GROQ_API_KEY=your-groq-api-key
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]
```

### Installation & Execution

#### 1. Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install modules:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```

#### 2. Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install modules:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Start development hot-reload server:
   ```bash
   npm run dev
   ```
