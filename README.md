# FlowChainAI - Supply Chain Management Platform

ML-powered supply chain SaaS platform with AI copilot, demand forecasting, inventory management, and supplier analytics.

## Architecture

```
Frontend (React + Vite)  →  Backend (FastAPI)  →  Database (Neon PostgreSQL)
   Vercel                    Render                 Neon
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Python 3.12, FastAPI, SQLAlchemy (async), Alembic
- **Database**: Neon PostgreSQL (serverless)
- **ML**: scikit-learn, custom demand forecasting & anomaly detection
- **AI**: GLM-4.5-flash for insights & supplier narratives

---

## Deployment

### 1. Database (Neon)

The database is already provisioned on Neon. Connection string goes in the backend `DATABASE_URL` env var.

### 2. Backend (Render)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo: `adityasync/FlowChainAi`
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Region**: Singapore (closest to Neon DB)
4. Set **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `SECRET_KEY` | Random 32+ char string (Render can auto-generate) |
   | `BACKEND_CORS_ORIGINS` | `https://your-vercel-app.vercel.app` |
   | `FORCE_HTTPS` | `true` |
   | `AI_API_KEY` | Your GLM API key |
   | `AI_PROVIDER` | `glm` |
   | `AI_MODEL` | `glm-4.5-flash` |
   | `AI_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` |
   | `AI_REQUEST_TIMEOUT_SECONDS` | `60` |
5. Deploy. After first deploy, run migrations:
   ```bash
   # In Render Shell or locally with production DATABASE_URL
   cd backend && alembic upgrade head
   ```

### 3. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo: `adityasync/FlowChainAi`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set **Environment Variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com` |
5. Deploy.

### Post-Deployment

After both services are live:
1. Update `BACKEND_CORS_ORIGINS` on Render with your actual Vercel URL
2. Run `alembic upgrade head` on the backend to create tables
3. (Optional) Seed demo data via the backend shell

---

## Local Development

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env     # fill in your values
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8000`.

---

## Project Structure

```
FlowChainAi/
├── frontend/          # React + Vite app
│   ├── src/
│   ├── public/
│   ├── vercel.json    # Vercel deployment config
│   └── package.json
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Config, security, exceptions
│   │   ├── ml/        # ML models & inference
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic
│   ├── alembic/       # Database migrations
│   └── requirements.txt
├── ml/                # ML training pipeline
├── docs/              # Documentation
├── render.yaml        # Render deployment blueprint
└── schema.sql         # Database schema reference
```

## API Docs

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
