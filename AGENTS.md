# AGENTS.md

## Project Overview

This project is a production-style Discord Slash Command Bot with a React dashboard.

The system consists of:

- React (Vite) frontend
- Express + TypeScript backend
- PostgreSQL (Supabase) via Prisma ORM
- Discord HTTP Interactions API
- Discord OAuth2 Authentication
- Groq LLM integration
- Multi-server configuration support

---

## Development Principles

When making changes:

- Prefer small, isolated services.
- Reuse existing modules before creating new ones.
- Never duplicate business logic.
- Preserve type safety.
- Keep routes thin and move logic into services.
- Favor composition over large controller files.

---

## Performance

- Avoid unnecessary database queries.
- Batch independent queries with Promise.all().
- Reuse Prisma client.
- Avoid blocking Discord interaction responses.
- Any work that may exceed Discord's response window should be deferred and completed asynchronously.

---

## Discord Integration

Always preserve:

- Ed25519 signature verification
- Interaction deduplication
- Deferred responses where required
- Multi-server isolation
- Configurable command behavior

Never expose:

- Bot token
- Discord public key
- OAuth secrets
- API keys

---

## Frontend

- Use TanStack React Query for server state.
- Keep components presentational when possible.
- Keep loading and error states consistent.
- Prefer reusable UI components.

---

## AI Integration

When modifying the AI functionality:

- Keep all AI-related logic inside `AIService`.
- Do not call the Groq API directly from routes, middleware, or other services.
- Preserve the existing fallback mechanism when the API is unavailable or no API key is configured.
- Keep business logic outside the AI service.
- If prompts need to change, update them inside `AIService` only.
- If a different AI provider is introduced, integrate it through `AIService` rather than changing the rest of the application.
- Preserve graceful error handling so AI failures do not interrupt the Discord interaction pipeline.

---

## Code Style

- TypeScript strict mode
- Descriptive naming
- Small functions
- No commented-out code
- Remove unused imports
- Avoid premature abstraction