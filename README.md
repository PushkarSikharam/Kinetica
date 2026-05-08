<div align="center">

# Kinetic

**An ML-backed adaptive metabolic engine and nutrition platform.**

<p>
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Next.js%2015-black">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-FastAPI-05998b">
  <img alt="Database" src="https://img.shields.io/badge/Database-SQLite%20now%20%7C%20PostgreSQL%20ready-3f7ad6">
  <img alt="AI" src="https://img.shields.io/badge/AI-Gemini-f9ab00">
  <img alt="Status" src="https://img.shields.io/badge/Phase-2%20Complete-2ea44f">
</p>

</div>

## Overview

Kinetic is a full-stack nutrition tracking application that moves beyond static calorie counting formulas. It acts as a dynamic metabolic engine, combining:

- Context-aware food logging
- Exponentially Weighted Moving Average (EWMA) weight trend analysis
- Adaptive calorie recommendations based on real metabolic flux
- Natural-language meal parsing
- Contextual AI chat
- Admin feedback review

The project is designed as a product system. The core philosophy:
> **Track user behavior, calculate the true physiological state, and adapt calorie targets using deterministic logic rather than static formulas alone.**

---

---

## 🛠️ Tech Stack

- ⚡ **Frontend:** Next.js 15, React, TailwindCSS, TypeScript
- 🚀 **Backend:** FastAPI, Python, Pydantic
- 🗄️ **Database:** SQLite (Migrating to PostgreSQL + Alembic)
- 🧠 **Intelligence:** Google Gemini AI, EWMA Smoothing, OLS Linear Regression

---

## 🌟 Core Features

### Adaptive Engine Capabilities
- **EWMA Smoothing:** Filters out daily scale noise to find the true weight trend.
- **OLS Trend Estimation:** Uses Ordinary Least Squares regression to calculate precise weight velocity.
- **Maintenance Calorie Estimation:** Dynamically back-calculates true TDEE based on intake vs. trend.
- **Confidence Gating & Safety:** Applies calorie floor logic and bounds adjustments to a safe +/-150 kcal range.

### Indian-First Nutrition Tracking
- Native support for katori-based and roti-based logging.
- Seeded Indian food catalog with regional variations.
- Custom oil-level calibration.

### Seamless User Experience
- JWT-based authenticated API access.
- Natural language meal parsing (e.g., "I ate 2 rotis and a bowl of dal").
- Contextual floating AI chat that understands the user's current nutritional state.
- Integrated feedback submission and admin review dashboard.

---

## Full System Architecture

Kinetic is organized into three main layers:

1. **Application Layer**
2. **Intelligence Layer**
3. **Persistence Layer**

### Architecture Map

```mermaid
flowchart TD
    U[User] --> FE[Next.js Frontend]

    subgraph Frontend
        FE --> AUTHUI[Auth Screens]
        FE --> ONBOARD[Onboarding]
        FE --> DASH[Dashboard]
        FE --> ANALYTICS[Analytics]
        FE --> SETTINGS[Settings]
        FE --> FEEDBACKUI[Feedback]
        FE --> ADMINUI[Admin Review]
        FE --> CHATUI[Global Chatbot]
    end

    FE --> API[FastAPI Backend]

    subgraph Backend
        API --> AUTH[Auth API]
        API --> USERS[Users API]
        API --> FOODS[Foods API]
        API --> MEALS[Meals API]
        API --> WEIGHT[Weight API]
        API --> INSIGHTS[Insights API]
        API --> CHAT[Chat API]
        API --> FEEDBACK[Feedback API]
    end

    MEALS --> TDEE[Deterministic TDEE Engine]
    WEIGHT --> TDEE
    INSIGHTS --> TDEE

    CHAT --> AI[Gemini AI Service]
    MEALS --> AI
    INSIGHTS --> AI

    AUTH --> DB[(SQLite)]
    USERS --> DB
    FOODS --> DB
    MEALS --> DB
    WEIGHT --> DB
    INSIGHTS --> DB
    FEEDBACK --> DB
```

### Request Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as FastAPI Backend
    participant Engine as TDEE / AI Services
    participant DB as SQLite

    User->>Frontend: performs an action
    Frontend->>Backend: sends authenticated API request
    Backend->>DB: read/write transactional data
    Backend->>Engine: optional deterministic or AI processing
    Engine-->>Backend: result
    Backend-->>Frontend: JSON response
    Frontend-->>User: updated UI state
```

---

## Layer-by-Layer Breakdown

### 1. Application Layer

This is the user-facing product experience.

#### Frontend responsibilities
- render login and registration flows
- collect onboarding inputs
- allow food search and meal logging
- show daily calories and macros
- show weight history and adaptive analytics
- submit feedback
- provide admin feedback review
- host the floating AI chat experience

#### Backend responsibilities
- validate and authenticate requests
- expose stable REST APIs
- compute meal-derived nutrition values
- maintain daily nutrition summaries
- store weight trends and insights
- manage feedback lifecycle

### 2. Intelligence Layer

This layer is the core differentiator, separated into deterministic and AI-driven logic.

#### Deterministic Engine (The Math)
This is the analytical source of truth. Standard TDEE formulas (like Mifflin-St Jeor) are static and often inaccurate. Kinetic solves this using data science:
- **EWMA Smoothing:** $S_t = \alpha Y_t + (1 - \alpha) S_{t-1}$ is used to smooth daily weight fluctuations (water retention, sodium, etc.).
- **OLS Regression:** Applies linear regression over the smoothed trend to determine true weight loss/gain velocity.
- **Dynamic Adjustments:** Calculates required calorie adjustments based on the delta between expected weight velocity and actual velocity, gated by statistical confidence.

#### AI Layer (The UX)
This is the UX augmentation layer.
- natural-language meal parsing
- contextual nutrition chat
- plain-English explanation of system outputs

**Important:** AI handles the unstructured data and usability, but the adaptive recommendation logic strictly comes from the deterministic math engine.

### 3. Persistence Layer

This layer stores both raw activity and derived application state.

| Table | Purpose |
|---|---|
| `users` | identity, role, goals, target calories, Indian household multipliers |
| `foods` | normalized food catalog with macro values per 100g |
| `meal_entries` | every logged meal event |
| `daily_summaries` | daily aggregate calories and macros |
| `user_weights` | raw weights and EWMA trend weights |
| `zoro_insights` | stored adaptive recommendation snapshots |
| `user_feedbacks` | user-to-admin feedback records |

---

## Codebase Layout

```text
apps/
  api/
    app/
      api/
        auth.py
        users.py
        foods.py
        meals.py
        weight.py
        insights.py
        chat.py
        feedback.py
      core/
        config.py
        database.py
        security.py
      models/
        user.py
        food.py
        meal.py
        user_weight.py
        zoro_insight.py
        feedback.py
      schemas/
        user.py
        food_meal.py
        chat.py
        nlp.py
        feedback.py
      services/
        tdee_engine.py
        ai_service.py
      main.py
  web/
    src/
      app/
        (auth)/
        (user)/
        admin/
        onboarding/
      components/
        GlobalChatbot.tsx
      lib/
        api.ts
        auth.ts
```

---

## API Surface

Current FastAPI routes:

```text
GET    /api/v1/openapi.json
GET    /docs
GET    /docs/oauth2-redirect
GET    /redoc
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/foods/search
GET    /api/v1/foods/
POST   /api/v1/meals/
GET    /api/v1/meals/today
GET    /api/v1/meals/today/entries
GET    /api/v1/meals/history
PUT    /api/v1/meals/{meal_entry_id}
DELETE /api/v1/meals/{meal_entry_id}
POST   /api/v1/meals/parse-text
POST   /api/v1/ai/chat/
POST   /api/v1/weight/
GET    /api/v1/weight/history
GET    /api/v1/insights/latest
POST   /api/v1/insights/apply
POST   /api/v1/feedback/
GET    /api/v1/feedback/mine
GET    /api/v1/feedback/admin
PATCH  /api/v1/feedback/admin/{feedback_id}
GET    /
GET    /health
```

---

## Local Setup

### Start the backend

```bash
cd "E:\Calorie Tracker\apps\api"
venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start the frontend

```bash
cd "E:\Calorie Tracker\apps\web"
npm run dev
```

### Open in browser

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

---

## Local Development Notes

- SQLite is still used for local persistence
- PostgreSQL is now supported by setting `SQLALCHEMY_DATABASE_URI`
- Alembic now manages schema creation and versioning
- the frontend expects `http://localhost:8000/api/v1` by default
- `admin@zoro.com` is treated as an admin account in local registration to simplify testing
- some older landing/admin screens still need lint cleanup outside the main app flow

### Apply migrations

```bash
cd "E:\Calorie Tracker\apps\api"
venv\Scripts\python scripts\init_db.py
```

---

## Recommended Demo Flow

1. Register a standard user account
2. Complete onboarding
3. Log meals on the dashboard
4. Log daily weights in Analytics
5. Generate and review adaptive insights
6. Submit feedback as a user
7. Register `admin@zoro.com`
8. Review feedback in `/admin/feedback`

---

## What Is Not Production-Ready Yet

| Area | Current Status |
|---|---|
| Secrets | moved to environment-driven config, but secure secret storage and rotation are still pending |
| Database | PostgreSQL-ready, though local development still defaults to SQLite |
| Migrations | Alembic is in place, but future schema changes still need new revisions |
| Auth hardening | backend protection is enforced, but frontend middleware still relies on cookies rather than server-side token introspection |
| AI safety | endpoint rate limiting is in place, but quota monitoring and abuse analytics are still pending |
| Deployment | containerization and production infra still pending |

---

## Roadmap

### Phase 1: Application Completion

Completed:
- real auth flow
- onboarding and profile persistence
- persistent meal logging and meal history
- weight, insights, and feedback wired to authenticated users
- admin feedback review
- removal of prototype-style single-user assumptions

Why it mattered:
- this turned the product from a partially mocked prototype into a real multi-user application flow

### Phase 2: Backend Hardening

Completed:
- environment-driven configuration
- Alembic migration system
- PostgreSQL-ready SQLAlchemy configuration
- JWT hardening and admin access enforcement
- AI endpoint rate limiting
- stronger database constraints and validation

Why it mattered:
- this made the backend production-shaped without forcing an immediate runtime database switch

Important note:
- the current local runtime database is still SQLite
- PostgreSQL support is implemented, but not yet activated in the default local environment

### Phase 3: Data Engineering Foundation

Planned:
- switch the active runtime database from SQLite to PostgreSQL
- provision local PostgreSQL and update `SQLALCHEMY_DATABASE_URI`
- run Alembic against PostgreSQL and reseed baseline food data
- verify that new writes are landing in PostgreSQL
- add a top-level `data/` workspace
- introduce dbt staging models and marts
- add data quality checks
- add the first orchestrated analytics pipeline
- prepare ML-ready feature tables

Why this phase:
- PostgreSQL is the right base before building a serious analytics and data-engineering layer

### Phase 4: Intelligence Expansion

Planned:
- increase TDEE engine test coverage
- improve NLP parsing reliability
- add stronger AI output validation
- prepare recommendation and prediction feature sets
- improve explainability around adaptive calorie changes

Why this phase:
- once app and data layers are stable, intelligence work becomes much easier to trust and scale

### Phase 5: Production Readiness

Planned:
- add broader backend and frontend test coverage
- improve observability and structured error handling
- clean remaining frontend lint issues
- containerize the stack
- prepare deployment workflows and operational setup

Why this phase:
- this turns the project from a strong local system into a deployable product platform

---

## Summary

Kinetic is now a real authenticated application with persisted nutrition data, feedback workflows, AI augmentation, and a deterministic adaptive recommendation engine. The next major step is Phase 3: activate PostgreSQL as the runtime database and build the data engineering layer cleanly on top of it.
