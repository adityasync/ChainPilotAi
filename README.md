<p align="center">
  <img src="frontend/public/favicon.png" alt="ChainPilot Logo" width="120" />
</p>

<h1 align="center">ChainPilot</h1>

<p align="center">
  <strong>AI-Powered Supply Chain Management Platform</strong>
</p>

<p align="center">
  Demand forecasting · Inventory risk analysis · Supplier delay prediction — all in one modern dashboard.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-api-reference">API</a> ·
  <a href="#-demo">Demo</a>
</p>

---

## 🎬 Demo

<p align="center">
  <a href="https://www.youtube.com/live/qDCKUosnZQg?si=QYV0_Ixw0S65UL62">
    <img src="frontend/public/yt.png" alt="ChainPilot Demo Video" width="600" />
  </a>
</p>

<p align="center">
  <em>Click the image above to watch the full walkthrough on YouTube</em>
</p>

---

## ✨ Features

### 🤖 Machine Learning Engine

| Capability | Description | Model |
|---|---|---|
| **Demand Forecasting** | Predicts future product demand from historical order data | Gradient Boosted Trees |
| **Inventory Risk** | Classifies products as Healthy, Low Stock, Critical, or Overstock | Random Forest Classifier |
| **Supplier Delay Prediction** | Estimates probability of shipment delays per supplier | Logistic Regression |
| **Demand Pattern Detection** | Identifies trending, seasonal, volatile, and stable demand patterns | Statistical Analysis |
| **Anomaly Detection** | Flags unusual spikes or drops in demand | Z-Score Analysis |
| **Feature Importance** | Explains which factors drive each prediction | SHAP-style Decomposition |

### 📊 Dashboard & Analytics

- **Real-time KPI cards** — total products, inventory health, stock risks, supplier alerts
- **Interactive charts** — demand trend (area), inventory breakdown (donut), forecast accuracy (bar)
- **Action-required feed** — ML-powered insights prioritized by severity and business impact
- **Portfolio view** — aggregate demand across all products with period toggles (week/month/quarter)

### 📦 Inventory Management

- Full CRUD for products and warehouse stock levels
- Category, status, and sort filters with instant search
- Per-product detail drawer with ML risk assessment
- Stock level visualizations with health indicators

### 🚚 Supplier Management

- Supplier cards with reliability scores, lead times, and shipment counts
- ML delay risk assessment per supplier
- AI-generated risk narratives (natural language explanations)
- Shipment history tracking

### 📋 Order Management

- Create, edit, and delete orders with product linkage
- Bulk CSV import for rapid data entry
- Region and date-based filtering

### 🔮 Demand Planning

- Portfolio-level demand overview with top movers chart
- Per-product deep dive: forecast vs actual, confidence bands, anomaly markers
- ML vs statistical model comparison
- Demand intelligence panel with pattern analysis and feature importance

### 🧠 AI Assistant (AskAI)

- Natural language chat interface embedded in the dashboard
- Context-aware answers about your inventory, suppliers, and demand data
- Powered by Google Gemini via the backend AI service

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  TypeScript · Vite · TailwindCSS · Recharts             │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                         │
│  Auth · CRUD · Business Logic · AI Chat                  │
├──────────────────────────────────────────────────────────┤
│                   ML Engine (scikit-learn)                │
│  Forecasting · Classification · Risk Scoring              │
├──────────────────────────────────────────────────────────┤
│                   PostgreSQL (Neon)                       │
│  Products · Orders · Inventory · Suppliers · Insights     │
└──────────────────────────────────────────────────────────┘
```

### Project Structure

```
ChainPilotAi/
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   ├── auth.py       # Login, register, JWT
│   │   │   ├── inventory.py  # Products & stock CRUD
│   │   │   ├── orders.py     # Order management
│   │   │   ├── suppliers.py  # Supplier & shipments
│   │   │   ├── demand.py     # Demand history & forecasting
│   │   │   ├── ml.py         # ML predictions & insights
│   │   │   ├── ai.py         # AI chat & narratives
│   │   │   └── dashboard.py  # Aggregated KPIs
│   │   ├── core/             # Config, security, exceptions
│   │   ├── ml/               # ML models & feature engineering
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── database.py       # DB connection & session
│   │   └── main.py           # FastAPI app entry
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Auth & Theme providers
│   │   ├── services/         # API client (axios)
│   │   ├── hooks/            # Custom React hooks
│   │   └── styles/           # CSS animations & variables
│   ├── public/               # Static assets
│   └── package.json
└── README.md
```

### Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite · TailwindCSS · Recharts · React Router · Axios |
| **Backend** | Python 3.10+ · FastAPI · SQLAlchemy · Pydantic · JWT Auth |
| **ML** | scikit-learn · pandas · numpy · joblib |
| **Database** | PostgreSQL (Neon serverless) |
| **AI** | Google Gemini (via backend AI service) |

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** (or a [Neon](https://neon.tech) free-tier project)
- **Git**

### 1. Clone the Repository

```bash
git clone git@github.com:adityasync/ChainPilot.git
cd ChainPilot
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # then edit .env with your DATABASE_URL

# Start the server
uvicorn app.main:app --reload
```

The API will be available at **`http://localhost:8000`**.
Interactive docs at **`http://localhost:8000/docs`** (Swagger UI).

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at **`http://localhost:5173`**.

### 4. Database Setup

#### Option A: Neon (Recommended — Free Tier)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the **Connect** dialog
3. Add it to `backend/.env`:

```env
DATABASE_URL="postgresql://<user>:<password>@<hostname>/<database>?sslmode=require"
```

Tables are created automatically on first boot via SQLAlchemy.

#### Option B: Local PostgreSQL

```bash
createdb chainpilot
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chainpilot"
```

---

## 📡 API Reference

All endpoints are prefixed with their router path (e.g., `/auth`, `/inventory`, `/ml`). Full interactive Swagger UI available at **`/docs`** when the backend is running.

| Domain | Endpoints | Key Operations |
|---|---|---|
| **Auth** | `/auth/*` | Register, login, profile management |
| **Inventory** | `/inventory/*` | Product & stock CRUD, ML risk assessment |
| **Orders** | `/orders/*` | Order CRUD, bulk CSV import |
| **Suppliers** | `/suppliers/*` | Supplier & shipment CRUD, delay prediction |
| **ML** | `/ml/*` | Demand forecast, risk classification, anomaly detection, insights |
| **Demand** | `/demand/*` | Portfolio overview, per-product forecasting, accuracy metrics |
| **Dashboard** | `/dashboard/*` | Aggregated KPIs, charts, alerts |
| **AI** | `/ai/*` | Chat assistant, insight generation, risk narratives |
| **Data** | `/api/*` | CSV upload & bulk processing |

> 📖 **Full API documentation with request/response schemas:** [docs/api_reference.md](docs/api_reference.md)

---

## 🧪 ML Model Details

### Demand Forecasting

- **Algorithm**: Gradient Boosted Trees (scikit-learn `GradientBoostingRegressor`)
- **Features**: Historical order quantities, time-based features (month, quarter, day-of-week), rolling averages, trend indicators
- **Output**: Point forecast + upper/lower confidence bounds
- **Retraining**: Triggered automatically on new CSV uploads or manually via the dashboard

### Inventory Risk Classification

- **Algorithm**: Random Forest Classifier (`RandomForestClassifier`)
- **Features**: Current stock level, reorder point, demand velocity, supplier lead time, days since last restock
- **Output**: Risk category (Healthy / Low / Critical / Overstock) + probability scores
- **Thresholds**: Configurable per-category risk boundaries

### Supplier Delay Prediction

- **Algorithm**: Logistic Regression (`LogisticRegression`)
- **Features**: Historical on-time rate, average lead time, shipment volume, recent delay streak
- **Output**: Delay probability (0–1) + risk label (Low / Medium / High)

---

## 🎨 UI Design

ChainPilot follows an **Apple-inspired design language**:

- Clean white surfaces with subtle dark mode support
- System font stack (SF Pro / Inter fallback)
- Rounded corners (`border-radius: 16px` on cards)
- Blue accent color (`#0071e3`) for interactive elements
- Skeleton loading states for all data-fetching pages
- Smooth fade-in animations on page transitions

---

## 📂 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, data flow, component architecture |
| [API Reference](docs/api_reference.md) | Complete REST API endpoint documentation |
| [Database Schema](docs/database.md) | Tables, columns, relationships, ERD |
| [ML Integration](docs/ml_integration.md) | Model architecture, training, feature engineering |
| [Frontend Guide](docs/frontend.md) | React components, patterns, styling conventions |
| [Deployment](docs/deployment.md) | Render + Vercel + Neon setup guide |
| [Roadmap](docs/roadmap.md) | Completed milestones and future plans |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (Prettier for frontend, Black for backend)
- Add type annotations to all Python functions
- Use TypeScript strict mode for all new frontend code
- Test ML model changes against the existing accuracy benchmarks
- Keep components small and focused — extract when over 200 lines

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/adityasync">Aditya</a>
</p>
