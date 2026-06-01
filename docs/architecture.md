<p align="center">
  <img src="../frontend/public/favicon.png" alt="ChainPilot Logo" width="80" />
</p>

<h1 align="center">Architecture</h1>

<p align="center">
  System design, data flow, and component architecture for ChainPilot.
</p>

---

## System Overview

ChainPilot is a full-stack SaaS platform with three major layers:

```mermaid
graph TB
    subgraph Frontend["🖥️ React Frontend"]
        direction TB
        FE_Tech["TypeScript · Vite · TailwindCSS · Recharts"]
        FE_Pages["Dashboard · Inventory · Orders · Suppliers<br/>Demand · Insights · Settings · Data Upload"]
    end

    subgraph Backend["⚙️ FastAPI Backend"]
        direction TB
        API["9 API Routers · Pydantic Validation · CORS Middleware"]
        subgraph Services["Service Layer"]
            SVC["Dashboard · Inventory · Orders<br/>Suppliers · Demand · Insight · AI Chat<br/>Data Ingestion"]
        end
        subgraph ML["ML Engine"]
            MLModels["Demand Forecasting · Inventory Risk<br/>Supplier Delay · Cost Anomaly<br/>Statistical Forecasting · Insight Engine"]
        end
    end

    subgraph Database["🗄️ PostgreSQL (Neon)"]
        DB["8 Tables · Multi-tenant via company_id<br/>Async SQLAlchemy 2.0"]
    end

    Frontend -->|"REST API (JSON)<br/>Bearer JWT Auth"| Backend
    Services --> Database
    ML --> Database
```

---

## Project Structure

```
ChainPilotAi/
├── backend/
│   ├── app/
│   │   ├── api/                    # Route handlers
│   │   │   ├── auth.py             # Register, login, JWT, profile
│   │   │   ├── inventory.py        # Products & stock CRUD
│   │   │   ├── orders.py           # Order management + bulk import
│   │   │   ├── supplier.py         # Suppliers & shipments CRUD
│   │   │   ├── demand.py           # Demand history, forecasting, accuracy
│   │   │   ├── ml_integration.py   # ML predictions & insights
│   │   │   ├── dashboard.py        # Aggregated KPIs
│   │   │   ├── ai.py               # AI chat & narratives
│   │   │   └── data_ingestion.py   # CSV upload & bulk processing
│   │   ├── core/
│   │   │   ├── config.py           # Environment variables
│   │   │   ├── security.py         # JWT + bcrypt password hashing
│   │   │   ├── exceptions.py       # Custom error classes
│   │   │   └── company_isolation.py # Multi-tenant data filtering
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user_company.py     # User, Company
│   │   │   ├── product_inventory.py # Product, Inventory
│   │   │   ├── order.py            # Order
│   │   │   ├── supplier_shipment.py # Supplier, Shipment
│   │   │   └── ml_models.py        # Prediction, Insight
│   │   ├── schemas/                # Pydantic request/response models
│   │   ├── services/               # Business logic layer
│   │   │   ├── dashboard_service.py
│   │   │   ├── demand_service.py
│   │   │   ├── inventory_service.py
│   │   │   ├── supplier_service.py
│   │   │   ├── order_service.py
│   │   │   ├── insight_service.py
│   │   │   └── ai/                 # AI chat, narratives, context
│   │   ├── ml/                     # Machine learning pipeline
│   │   │   ├── models/             # Model classes + .pkl artifacts
│   │   │   ├── inference/          # Prediction orchestrator
│   │   │   ├── evaluation/         # Insight engine & explanations
│   │   │   ├── preprocessing/      # Data cleaning
│   │   │   ├── training/           # Training pipeline & data generation
│   │   │   └── startup.py          # Auto-training on boot
│   │   ├── database.py             # SQLAlchemy engine & session
│   │   ├── main.py                 # FastAPI app entry point
│   │   └── models.py               # Model registry
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Route pages (8 protected + 3 public)
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Skeleton.tsx        # Skeleton loading states
│   │   │   ├── ProtectedRoute.tsx  # Auth route guard
│   │   │   ├── PaginationControls.tsx
│   │   │   ├── AskAI.tsx           # AI chat widget
│   │   │   └── landing/            # Landing page sections
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth state & JWT management
│   │   │   └── ThemeContext.tsx     # Dark mode toggle
│   │   ├── services/
│   │   │   └── apiService.ts       # Axios API client
│   │   ├── hooks/                  # Custom React hooks
│   │   └── styles/                 # CSS animations & variables
│   ├── public/                     # Static assets
│   └── package.json
├── docs/                           # This documentation
├── ml/training/config.yaml         # ML hyperparameter config
├── render.yaml                     # Render deployment config
├── vercel.json                     # Vercel deployment config
└── .env.example                    # Environment template
```

---

## Backend Architecture

### Request Lifecycle

```mermaid
graph TD
    A["🌐 Client Request"] --> B["CORS Middleware<br/><i>Origins from BACKEND_CORS_ORIGINS</i>"]
    B --> C["FastAPI Router<br/><i>Matched by prefix + method</i>"]
    C --> D["Authentication<br/><i>get_current_user dependency</i>"]
    D --> D1["Decode JWT, extract email, look up user"]
    D --> D2["Company isolation: filter by company_id"]
    D --> E["Pydantic Validation<br/><i>Request body / query params</i>"]
    E --> F["Service Layer<br/><i>Business logic</i>"]
    F --> G["SQLAlchemy ORM<br/><i>Async queries via AsyncSession</i>"]
    G --> H["🗄️ PostgreSQL (Neon)"]
```

### Error Handling

All errors return a standardized JSON envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product with id 42 not found",
    "field": "product_id"
  }
}
```

Exception hierarchy (`backend/app/core/exceptions.py`):

| Exception | HTTP Code | Use Case |
|---|---|---|
| `NotFoundError` | 404 | Resource doesn't exist |
| `UnauthorizedError` | 401 | Invalid/expired token |
| `ForbiddenError` | 403 | Insufficient permissions |
| `ValidationError` | 422 | Invalid input data |
| `ConflictError` | 409 | Duplicate resource |
| `RateLimitError` | 429 | Too many requests |
| `ServiceUnavailableError` | 503 | External service down |

### Multi-Tenancy

Every data query is scoped to the authenticated user's `company_id`:

```python
# Company isolation middleware
async def get_current_user_company_id(user = Depends(get_current_company_id)):
    return user.company_id

# All queries filter by company
products = await db.execute(
    select(Product).where(Product.company_id == company_id)
)
```

This ensures complete data isolation between companies sharing the same database.

---

## Frontend Architecture

### Routing

```mermaid
graph LR
    subgraph Public["Public Routes"]
        P1["/ → LandingPage"]
        P2["/login → LoginPage"]
        P3["/register → RegisterPage"]
    end

    subgraph Protected["Protected Routes (require JWT)"]
        R1["/dashboard → DashboardPage<br/>KPIs, charts, insights"]
        R2["/inventory → InventoryPage<br/>Products, stock, ML risk"]
        R3["/demand → DemandPlanningPage<br/>Forecasting, patterns"]
        R4["/orders → OrdersPage<br/>Order CRUD, bulk import"]
        R5["/suppliers → SupplierPage<br/>Supplier cards, delay risk"]
        R6["/insights → InsightsPage<br/>ML insights, predictions"]
        R7["/upload-data → DataUploadPage<br/>CSV drag & drop"]
        R8["/settings → SettingsPage<br/>Profile, theme"]
        R9["* → redirect to /dashboard"]
    end

    User --> Public
    User --> Protected
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API

    U->>FE: Enter credentials
    FE->>API: POST /auth/login
    API-->>FE: JWT access_token
    FE->>FE: Store token in localStorage

    loop Every API Request
        FE->>API: Request + Bearer token
        API-->>FE: Response (or 401)
    end

    Note over FE: On 401 response
    FE->>FE: Clear session, redirect to /login

    Note over FE: On app load
    FE->>API: GET /auth/me (validate token)
    API-->>FE: User data or 401

    Note over FE: Cross-tab sync
    FE->>FE: StorageEvent listener for logout
```

### State Management

- **Auth**: `AuthContext` — user object, token, login/register/logout functions
- **Theme**: `ThemeContext` — dark mode toggle, persisted in localStorage
- **Page state**: Local `useState` per page (no global store like Redux)
- **API data**: Fetched on mount via `useEffect`, stored in component state

### Component Patterns

- **Skeleton loading**: All data-fetching pages show skeleton placeholders while loading
- **Floating labels**: Login/signup inputs use animated floating labels
- **Error boundaries**: `ErrorBoundary` component wraps protected routes
- **Pagination**: Shared `usePagination` hook + `PaginationControls` component
- **Modals**: Inline modal state per page (create, edit, delete confirmations)

---

## Data Flow Diagrams

### CSV Upload → ML Analysis

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database
    participant ML as ML Engine

    U->>FE: Drag & Drop CSV
    FE->>API: POST /api/upload/data
    activate API
    API->>API: Parse CSV (Pandas)
    API->>DB: Upsert Products & Inventory
    API->>ML: Trigger Analysis (Background)
    
    par Async Analysis
        ML->>DB: Fetch Fresh Data
        ML->>ML: Run Models (Risk, Demand, Anomaly)
        ML->>DB: Save Predictions & Insights
    and Immediate Response
        API-->>FE: 200 OK (Stats)
    end
    deactivate API
    
    FE->>U: Show "Analysis Complete"
```

### Dashboard Data Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Dashboard API
    participant SVC as Dashboard Service
    participant DB as Database

    FE->>API: GET /dashboard/summary
    API->>SVC: get_dashboard_summary(company_id)
    
    par Parallel Queries
        SVC->>DB: Product count & categories
        SVC->>DB: Inventory stock levels
        SVC->>DB: Recent orders (6 months)
        SVC->>DB: Supplier health
        SVC->>DB: Top insights (severity DESC)
    end
    
    SVC-->>API: Aggregated KPIs
    API-->>FE: JSON response
    FE->>FE: Render KPIs, charts, tables
```

---

## Database Schema

See [database.md](database.md) for the complete schema reference.

```mermaid
erDiagram
    COMPANY ||--|{ USER : "has"
    COMPANY ||--|{ PRODUCT : "owns"
    COMPANY ||--|{ SUPPLIER : "manages"
    COMPANY ||--|{ PREDICTION : "tracks"
    COMPANY ||--|{ INSIGHT : "receives"
    PRODUCT ||--|{ INVENTORY : "stored_in"
    PRODUCT ||--|{ ORDER : "ordered_via"
    SUPPLIER ||--|{ SHIPMENT : "ships"

    COMPANY {
        int id PK
        string name
        string industry
        datetime created_at
    }

    USER {
        int id PK
        string email UK
        string password_hash
        int company_id FK
    }

    PRODUCT {
        int id PK
        int company_id FK
        string product_name
        string category
        float unit_cost
        float selling_price
    }

    INVENTORY {
        int id PK
        int product_id FK
        string warehouse
        int current_stock
        int reorder_point
        int max_stock
    }

    ORDER {
        int id PK
        int product_id FK
        date order_date
        int quantity
        string region
    }

    SUPPLIER {
        int id PK
        int company_id FK
        string supplier_name
        int avg_lead_time
        float reliability_score
    }

    SHIPMENT {
        int id PK
        int supplier_id FK
        date expected_delivery_date
        date actual_delivery_date
        float shipping_cost
    }

    INSIGHT {
        int id PK
        int company_id FK
        string title
        string severity
        string category
        float priority_score
        string status
    }
```

---

## Technology Choices

| Decision | Choice | Rationale |
|---|---|---|
| **Backend framework** | FastAPI | Async support, auto-generated OpenAPI docs, Pydantic validation |
| **ORM** | SQLAlchemy 2.0 | Async sessions, mature ecosystem, migration support via Alembic |
| **Database** | PostgreSQL (Neon) | Serverless scaling, free tier, compatible with SQLAlchemy |
| **ML library** | scikit-learn + XGBoost | Wide algorithm coverage, joblib serialization, production-ready |
| **Frontend framework** | React 18 + TypeScript | Type safety, large ecosystem, Vite for fast dev builds |
| **Styling** | TailwindCSS | Utility-first, dark mode built-in, small bundle with purging |
| **Charts** | Recharts | React-native SVG charts, composable API, good tooltip support |
| **AI provider** | GLM (ZhipuAI) | OpenAI-compatible API, competitive pricing, streaming support |

---

## Related Documentation

- [API Reference](api_reference.md) — Complete endpoint documentation
- [Database Schema](database.md) — Tables, columns, relationships
- [ML Integration](ml_integration.md) — Model architecture & training
- [Deployment](deployment.md) — Render + Vercel setup
- [Frontend Guide](frontend.md) — Component architecture & patterns
- [Roadmap](roadmap.md) — Development timeline & future plans
