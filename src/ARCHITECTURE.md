# Architeture Plan: World Cup 2026 Ultimate Tracker

## High-Level Requirements
- **Scale:** 100,000 concurrent users (especially during live matches).
- **Core Features:** Real-time scores, Monte Carlo simulations, global rankings, private leagues, social hub.
- **Goal:** Transform a heavy client-side mock into a highly available, robust distributed platform.

## 1. Directory Structure (Monorepo approach)

```text
/
├── apps/
│   ├── web/                (Vite + React, Client SPA)
│   ├── api-gateway/        (Express Node.js entry point)
│   └── worker-sim/         (Go or Rust High-Perf Microservice for Monte Carlo)
├── packages/
│   ├── db/                 (Drizzle ORM & Postgres schemas)
│   ├── shared/             (Shared TS types, interfaces, utility models)
│   └── realtime/           (Socket/PubSub shared logic)
└── infrastructure/         (Terraform scripts, k8s specs)
```

## 2. Infrastructure & Compute

- **Frontend:** Deployed globally to CDN via Vercel or Cloudflare Pages for ultra-low latency static asset delivery.
- **API Gateway (BFF):** Node.js running on GCP Cloud Run (Serverless). Auto-scales up to thousands of instances in seconds during traffic spikes.
- **Compute Cluster (Monte Carlo):** GKE (Google Kubernetes Engine) executing Go-based Microservices. Why Go? Generates 1,000,000 statistical iterations at 20x the speed of Node, critical for live tournament probability updates.

## 3. Database & Data Storage

- **Primary RDS:** Google Cloud SQL (PostgreSQL 16) with High Availability (Active-Passive) and Read Replicas across multiple availability zones. Read replicas handle the massive volume of dashboard reads, while the Writer handles Prediction Saves and League updates.
- **Cache / Real-time State:** Redis Cluster (Memorystore). Caches match states, AI probablities, and leaderboards.
- **Social Feed Data:** Depending on velocity, either stored in Postgres using JSONB for metadata or offloaded to a NoSQL store like Firestore for native real-time capabilities if chat/feed becomes massive.

## 4. Real-time Architecture (WebSockets & PubSub)

Handling 100k concurrent WebSocket connections requires a decoupled approach:
- **Client Connection:** Clients connect to a managed WebSocket tier (e.g. Socket.io with Redis Adapter, or ideally a managed service like Pusher / GCP PubSub / Firebase Realtime DB).
- **Data Push Model:**
    - Live Match Ticker -> Webhook from sports data API -> Cloud Function -> PubSub -> Clients.
    - User completes a prediction -> API -> DB Update -> Redis Cache invalidate.

## 5. Caching Strategy

Aggressive caching is vital for the target scale:
- **Tier 1 (CDN):** Static assets and general tournament metadata.
- **Tier 2 (API Cache):** Next.js / API Gateway caches standard JSON responses (Group Standings, Tournament Brackets) with short TTLs (1-5 seconds during matches).
- **Tier 3 (Redis Database):** High-computation outputs (Monte Carlo run aggregates, Global Top 100 ranks) are stored in Redis instead of re-calculating them on every user request.

## 6. Security

- **Authentication:** Firebase Auth handling JWT generation, Social Logins (Google, Apple), and session management.
- **Rate Limiting:** IP and Token-based rate limiting via API Gateway / Cloud Armor to prevent brute force and API scraping.
- **Data Integrity:** Strict validation schemas (Zod). Predictions mutate with ACID compliance (Transactions) to ensure score integrity exactly at Match Kickoff locks.
- **Zero Trust:** Microservices communicate over gRPC with internal mTLS.

## 8. Digital Twin Engine (Parallel Universes)

The **Digital Twin** feature allows users to branch the tournament's live state into an isolated sandbox, altering results to run "What If" scenarios.

### Architecture & Compute
- **State Forking:** When a twin is created, it copies pointers to all `teams` and `matches`, but creates an override layer in `twin_matches` to store mutated scores.
- **Rules Engine (WebAssembly):** The tournament rules (tiebreakers: Points, GD, GF, H2H, Fair Play) and bracket progressions are encoded into a WebAssembly module (compiled from Rust) executed directly in the browser for ultra-fast UI updates, avoiding server round-trips for every goal change.
- **Asynchronous AI Recalculation:** When a result is altered, the new tournament state is sent to the Go Monte Carlo workers. They run a targeted sub-simulation (e.g., 10,000 iterations from the current node) to update live probabilities and return the "Probable Champion" shift within ~400ms.

### Data Model
- `digital_twins`: Represents an isolated sandbox owned by a user.
- `twin_matches`: Stores the delta (user-altered scores) against the real `matches` table. Unaltered matches fall back to actual or predicted outcomes.

## 9. TV Mode & Large Screen Displays

The **TV Mode** serves as a dedicated dashboard optimized for large-format displays (Televisions, Projectors) with the following features:

- **Full-Screen Layout:** Fixed UI overlaying the standard views, maximizing display area constraint-free.
- **Auto-Refresh Logic:** Client polls data or uses WebSockets to ensure clocks, tickers, live match scores, and shifting probabilities stay fresh without manual reloads.
- **Marquee Tickers:** Constant influx of real-time insights (events, results, bracket changes) displayed via performant CSS marquee animations.

## 10. AI World Cup Assistant (RAG & LLM)

A specialized conversational AI agent designed to answer complex domain-specific questions ("Who qualifies if X draws with Y?", "Compare the midfields of Spain and Germany").

### Architecture & RAG Pipeline
- **Orchestration:** LangChain or LlamaIndex running on the Node.js backend.
- **Router:** A semantic router determines if a query needs *Live Data* (SQL Query Tool), *Historical Data* (Vector Search), or *Simulation Data* (Monte Carlo Tool).
- **Data Sources:** 
  1. **PostgreSQL (pgvector):** Embeddings of historical matches, player biographies, tactical analyses, and historical World Cup records.
  2. **Live Database:** Standard PostgreSQL tables (Teams, Matches, Groups) queried via executed SQL or predefined functions.
  3. **WASM/Go Simulation Engine:** The AI can programmatically call `run_scenario({ match_id: X, force_result: Y })` to answer "What if" questions accurately instead of hallucinating.

### System Prompt & Context
- **Persona Context:** "You are the Ultimate World Cup Tactical Analyst. You rely strictly on provided data, live DB stats, and Monte Carlo probabilities. Do not hallucinate match outcomes. If asked for a prediction, use the simulator tools."
- **Conversational Memory:** Chat history is managed per user session in Redis (`session_id:chat_history`) to maintain multi-turn context (e.g., "What if they lose instead?").
- **Function Calling:** The Assistant uses OpenAI Function Calling or Gemini Tool Use to fetch live standings or execute complex mathematical probability recalculations dynamically.
