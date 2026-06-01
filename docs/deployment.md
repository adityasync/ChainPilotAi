<p align="center">
  <img src="../frontend/public/favicon.png" alt="ChainPilot Logo" width="80" />
</p>

<h1 align="center">Deployment</h1>

<p align="center">
  How to deploy ChainPilot to production with Render (backend) and Vercel (frontend).
</p>

---

## Deployment Architecture

```mermaid
graph LR
    subgraph Users["Users"]
        Browser["Web Browser"]
    end

    subgraph Vercel["▲ Vercel"]
        FE["React Frontend<br/>Vite Build"]
    end

    subgraph Render["● Render"]
        BE["FastAPI Backend<br/>Docker Container"]
    end

    subgraph Neon["◆ Neon"]
        DB["PostgreSQL<br/>Serverless"]
    end

    Browser -->|"HTTPS"| Vercel
    FE -->|"REST API + JWT"| Render
    BE -->|"SQLAlchemy async"| Neon
```

---

## Prerequisites

- [Neon](https://neon.tech) account (free tier)
- [Render](https://render.com) account (free tier)
- [Vercel](https://vercel.com) account (free tier)
- GitHub repository with the code

---

## 1. Database Setup (Neon)

```mermaid
graph TD
    A["Create Neon project"] --> B["Copy connection string"]
    B --> C["Add to backend .env"]
    C --> D["Tables auto-created on first boot"]
```

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from **Connect** → **Dashboard**
3. Save it — you'll need it for the backend

```
postgresql://user:password@hostname/database?sslmode=require
```

**Notes:**
- Tables are created automatically on first backend boot
- Use a direct connection string (not pooled) for initial setup
- Neon free tier: 0.5 GB storage, 1 project

---

## 2. Backend Deployment (Render)

### Deployment Flow

```mermaid
graph TD
    A["Push to GitHub"] --> B["Render detects render.yaml"]
    B --> C["Build Docker image"]
    C --> D["Install Python deps"]
    D --> E["Start uvicorn server"]
    E --> F["Auto-create DB tables"]
    F --> G["Auto-train ML models"]
    G --> H["✅ Backend ready"]
```

### Option A: Using render.yaml (Recommended)

The `render.yaml` file in the project root configures the service automatically.

1. Connect your GitHub repo to Render
2. Render will detect `render.yaml` and create the service
3. Set environment variables in the Render dashboard

### Option B: Manual Setup

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Runtime:** Docker
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Region:** Singapore (or closest to your Neon region)
   - **Plan:** Free

### Environment Variables

Set these in the Render dashboard under **Environment**:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | Yes |
| `SECRET_KEY` | Random 32+ character string | Yes |
| `ALGORITHM` | `HS256` | No (default) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | No (default) |
| `BACKEND_CORS_ORIGINS` | Your Vercel frontend URL | Yes |
| `ML_ARTIFACTS_PATH` | `app/ml/models` | No (default) |
| `AI_API_KEY` | Your GLM API key | For AI features |

### Generate a Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Dockerfile

```dockerfile
FROM python:3.12.3-slim

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
```

### Health Check

Once deployed, verify:
```
GET https://your-service.onrender.com/docs
```

Should return the Swagger UI.

---

## 3. Frontend Deployment (Vercel)

### Deployment Flow

```mermaid
graph TD
    A["Push to GitHub"] --> B["Vercel detects Vite project"]
    B --> C["npm install"]
    C --> D["npm run build"]
    D --> E["Deploy to CDN"]
    E --> H["✅ Frontend ready"]
```

### Setup

1. Connect your GitHub repo to Vercel
2. Set **Framework Preset** to Vite
3. Set **Root Directory** to `frontend`
4. Set environment variables:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL (e.g., `https://chainpilot-api.onrender.com`) |

### Build Settings

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Vercel Configuration

The `vercel.json` file handles SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Post-Deployment Verification

```mermaid
graph TD
    A["Verify Backend<br/>GET /docs"] --> B["Verify Frontend<br/>Visit Vercel URL"]
    B --> C["Register test account"]
    C --> D["Upload CSV file"]
    D --> E["Check dashboard for data"]
    E --> F["✅ All working!"]
```

### Verify Backend

```bash
# Health check
curl https://your-api.onrender.com/docs

# Register a test user
curl -X POST https://your-api.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123","company_name":"Test Co"}'
```

### CORS Configuration

If you see CORS errors, ensure `BACKEND_CORS_ORIGINS` includes your Vercel URL:

```env
BACKEND_CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SECRET_KEY` | Yes | — | JWT signing key (32+ chars) |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Token expiry |
| `BACKEND_CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated origins |
| `FORCE_HTTPS` | No | `false` | HTTPS redirect |
| `ML_ARTIFACTS_PATH` | No | `app/ml/models` | ML model storage path |
| `AI_PROVIDER` | No | `glm` | AI provider |
| `AI_MODEL` | No | `glm-4.5-flash` | Primary AI model |
| `AI_FALLBACK_MODEL` | No | `glm-4.7` | Fallback AI model |
| `AI_BASE_URL` | No | `https://open.bigmodel.cn/api/paas/v4` | AI API URL |
| `AI_API_KEY` | No | — | AI API key |
| `AI_REQUEST_TIMEOUT_SECONDS` | No | `10` | AI timeout |

### Frontend

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` | Backend API URL |

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env      # edit with your DATABASE_URL
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker (Backend)

```bash
cd backend
docker build -t chainpilot-api .
docker run -p 8000:10000 --env-file ../.env chainpilot-api
```

---

## Troubleshooting

```mermaid
graph TD
    A["Issue?"] --> B{"Which?"}
    B -->|"relation does not exist"| C["Restart backend<br/>Tables auto-create on boot"]
    B -->|"CORS errors"| D["Check BACKEND_CORS_ORIGINS<br/>Include Vercel URL"]
    B -->|"ML models not loading"| E["Check ML_ARTIFACTS_PATH<br/>Models auto-train on boot"]
    B -->|"Connection refused"| F["Verify DATABASE_URL<br/>Use direct Neon connection"]
    B -->|"Cold start delay"| G["Render free tier spins down<br/>First request takes 30-60s"]
```

- **"relation does not exist"** — Tables haven't been created. Restart the service.
- **CORS errors** — Ensure `BACKEND_CORS_ORIGINS` includes your frontend URL with no trailing slash.
- **ML models not loading** — Check `ML_ARTIFACTS_PATH`. Models are trained automatically on first boot if missing.
- **Database connection refused** — Verify `DATABASE_URL`, use direct Neon connection (not pooled).
- **Cold start delays** — Render free tier spins down after inactivity. First request may take 30–60 seconds.

---

## Related Documentation

- [Architecture](architecture.md) — System design
- [API Reference](api_reference.md) — Endpoint docs
- [Database Schema](database.md) — Table reference
- [ML Integration](ml_integration.md) — Model setup
