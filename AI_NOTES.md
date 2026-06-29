# AI Notes

## AI Tools Used

Throughout development I primarily used AI as a development assistant for brainstorming, reviewing architecture, debugging, and generating boilerplate code.

Tools used:

- ChatGPT (GPT-5.5)
- Claude (for code review and refactoring assistance)
- Gemini 3.5 Flash (using Antigravity IDE)


AI accelerated implementation, but every major architectural decision and debugging session was validated manually.

---

## How I Split the Work

AI helped with:

- code generation
- UI refinement
- refactoring suggestions
- API design
- deployment guidance
- debugging assistance
- documentation

I was responsible for:

- overall architecture
- database design
- feature prioritization
- Discord integration decisions
- reviewing and validating generated code
- debugging incorrect AI suggestions

---

## Key Decisions I Made

### 1. HTTP Interactions instead of Gateway Commands

Although a Gateway client was initially implemented, I chose to process commands exclusively through Discord's HTTP Interactions API because it aligns with Discord's recommended architecture and the project requirements.

---

### 2. Modular Service Architecture

Instead of placing business logic inside Express routes, interaction handling, Discord integration, AI processing, and logging were separated into dedicated services to improve maintainability.

---

### 3. React Query for Dashboard State

The dashboard originally reloaded data whenever browser focus changed.

I introduced TanStack React Query with caching and disabled unnecessary refetches to significantly improve responsiveness while reducing backend requests.

---

## Hardest Bug

The most significant issue involved Discord signature verification.

Initially, endpoint validation continually failed despite the implementation appearing correct.

After investigation, I discovered that the version of the `discord-interactions` library being used exposes `verifyKey()` as an asynchronous function returning `Promise<boolean>`.

The middleware treated it as a synchronous boolean value, causing invalid signatures to be accepted during Discord's endpoint verification process.

Updating the middleware to await `verifyKey()` resolved the issue and allowed Discord to successfully validate the interactions endpoint.

This reinforced the importance of verifying library behavior rather than relying solely on assumptions or generated code.

---

## What I'd Improve With More Time

Given additional time I would add:

- richer dashboard analytics
- real-time updates using WebSockets or Server-Sent Events
- comprehensive automated testing
- retry queues for downstream failures
- additional Discord interactive components
- improved UI polish and accessibility

---

## Overall Reflection

AI significantly accelerated development by handling repetitive implementation tasks and offering debugging suggestions.

However, successful completion required manually validating generated code, reviewing documentation, testing integrations end-to-end, and correcting several inaccurate AI-generated solutions.

The final application reflects a combination of AI-assisted development and manual engineering decisions.