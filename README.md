# Nexus Research — Multi-Agent Research Platform

Full-stack app around your existing `pipeline.py` / `agents.py` (search →
read → write → critique). Adds auth, a MongoDB-backed research workspace,
history, exports, feedback, and a React dashboard with live agent status.

```
project/
├── backend/     FastAPI + MongoDB (Motor/PyMongo) + JWT auth
└── frontend/    React (Vite) + Tailwind
```

## 1. Backend setup

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Also install whatever your existing agent stack needs (LangGraph,
LangChain, your search/scrape tools, LLM SDKs) — those aren't pinned here
since they depend on your current `agents.py`.

**Plug in your real agents:** open `backend/app/agents.py` and replace its
stub contents with your actual, working `agents.py` (the one that already
defines `buid_search_agent`, `build_reader_agent`, `writer_chain`,
`critic_chain`). Nothing else needs to change — `pipeline_service.py`
calls those four exactly the way your original `pipeline.py` did.

**Configure environment:**

```bash
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string (Atlas SRV URI or local `mongodb://localhost:27017`)
- `JWT_SECRET` — any long random string
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `TAVILY_API_KEY` / etc. — whatever your agents.py needs

**Run it:**

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # points VITE_API_BASE_URL at your backend
npm run dev
```

App runs at `http://localhost:5173`.

## How research runs work

1. `POST /api/research` inserts a `queued` document in MongoDB and kicks off
   your pipeline in a background thread — the request returns immediately
   with the new report's id.
2. The pipeline (`app/services/pipeline_service.py`) runs your four agents
   in order, writing `status` (`searching` → `reading` → `writing` →
   `reviewing` → `completed`/`failed`), timings, and results into MongoDB
   after each step.
3. The frontend's report page polls `GET /api/research/{id}/status` every
   2 seconds and re-renders the pipeline stepper live until it's done.

## Feature → endpoint map

| Feature | Endpoint(s) |
|---|---|
| Register / login (JWT) | `POST /api/auth/register`, `POST /api/auth/login` |
| Profile | `GET/PUT /api/users/profile`, `PUT /api/users/settings`, `PUT /api/users/password` |
| New research | `POST /api/research` |
| Research status (live) | `GET /api/research/{id}/status` |
| History (search/sort/filter/pagination) | `GET /api/research?search=&status=&sort_by=&sort_dir=&page=` |
| Full report | `GET /api/research/{id}` |
| Delete report | `DELETE /api/research/{id}` |
| Download PDF / Markdown | `GET /api/research/{id}/export?fmt=pdf\|markdown` |
| Sources | included in `GET /api/research/{id}` (`sources[]`) |
| Agent execution timings | included in `GET /api/research/{id}` (`agent_timings`) |
| Feedback (rating + comment) | `POST /api/research/{id}/feedback` |
| Dark/light mode | client-side only (`ThemeContext`, persisted to `localStorage`) |

## Notes / things you'll likely want to change

- **Auth model:** currently one flat JWT with no refresh token / expiry
  renewal — fine for a first version, add refresh tokens before production.
- **Background execution:** uses FastAPI `BackgroundTasks`, which is
  in-process and fine for one server instance. If you scale to multiple
  workers/instances, move this to a real task queue (Celery / RQ / Arq)
  so a research run isn't tied to the worker process that received the
  HTTP request.
- **PDF export** uses `reportlab` with a simple layout — swap in
  `weasyprint` (HTML/CSS-based) later if you want closer-to-Markdown
  visual fidelity.
- **CORS** is currently wide open (`allow_methods=["*"]`) for local dev —
  tighten before deploying.
