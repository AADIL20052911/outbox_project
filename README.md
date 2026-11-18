# ReachInbox - High-Performance Email Scheduler

A production-grade, compact, operations-focused email scheduling and delivery system built with a React TypeScript frontend and a Node.js Express Prisma BullMQ backend architecture.

## Monorepo Architecture

```
reachinbox/
├── frontend/             # React, TypeScript, Vite, Tailwind CSS operations console
├── backend/              # Node.js, Express, Prisma, BullMQ, Redis, Elasticsearch API core
├── docker-compose.yml    # Infrastructure containers for PostgreSQL, Redis, and Elasticsearch
├── .env.example          # Shared environment configuration template
└── README.md
```

## Stack Overview

### Frontend Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom CSS variables design system (Warm off-white surface `#FAFAFA`, `#FFFFFF`, cool gray borders, crisp 10px rounded radius)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **API Client**: Axios with structured service abstraction & mock data fallback layer

### Backend Stack
- **Runtime**: Node.js + Express + TypeScript
- **ORM**: Prisma (PostgreSQL database models)
- **Queue / Job Scheduling**: BullMQ + Redis for asynchronous rate-limited email processing
- **Email Dispatcher**: Nodemailer (Ethereal SMTP)
- **Search Engine**: Elasticsearch for recipient log indexing and search queries

---

## Infrastructure Setup with Docker Compose

The project includes containerized infrastructure for PostgreSQL, Redis, and Elasticsearch with persistent named volumes and built-in health checks. Neither the frontend nor backend are containerized, allowing fast local development.

### Infrastructure Commands

Start all infrastructure containers in detached mode:
```bash
docker compose up -d
```

Verify service status and health checks:
```bash
docker compose ps
```

Stop and remove infrastructure containers (data persists in named volumes):
```bash
docker compose down
```

### Exposed Service Ports & Data Volumes

| Service | Container Name | Port | Health Check | Persistent Volume |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `reachinbox_postgres` | `5432` | `pg_isready` | `postgres_data` |
| **Redis** | `reachinbox_redis` | `6379` | `redis-cli ping` | `redis_data` |
| **Elasticsearch** | `reachinbox_elasticsearch` | `9200` | `http://localhost:9200/_cluster/health` | `elasticsearch_data` |

---

## Quick Start & Local Development

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### 1. Launch Infrastructure Services
```bash
docker compose up -d
docker compose ps
```

### 2. Backend Local Development
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npm run dev
```
- API Base URL: `http://localhost:5000/api`
- Bull Board Queue UI: `http://localhost:5000/admin/queues`

### 3. Frontend Local Development
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Key Features & Operations Console

1. **Editorial & Auth Flow**:
   - Dark editorial landing split view with product pillars (*Schedule*, *Control*, *Deliver*).
   - One-click Google OAuth authentication workflow.

2. **Dashboard Console**:
   - High information density table with tabs (*Scheduled Emails* / *Sent Emails*).
   - Dynamic search, status pill filtering (`scheduled`, `processing`, `sent`, `failed`), hover state transitions, and empty/loading skeleton states.
   - 220px fixed navigation sidebar with Slack integration indicator and user mini-profile.

3. **Compose Email Drawer & CSV Lead Upload**:
   - CSV / TXT drag-and-drop parser with real-time email regex validation, address deduplication, and invalid format warnings.
   - Granular delivery control: start time schedule, inter-email delay (seconds), hourly sending rate limits, sender account selector.

4. **Slack Integration Drawer**:
   - Compact status drawer to connect Slack workspace webhooks for instant rate-limit warnings and delivery notifications.

5. **Rate-Limit & Window Deferred Toast**:
   - Reusable notification alerts informing operators when hourly limits are reached and remaining emails are automatically deferred to the next available sending window.
