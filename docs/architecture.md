# Architecture & Implementation Plan

## Goal
Replace all hardcoded/mock data in the Frontend with real live data from the Backend APIs.

## Architecture

### System Overview
```mermaid
graph TD
    User[User] -->|Uploads CSV| Frontend[Frontend React App]
    Frontend -->|POST /api/upload/data| Backend[Backend FastAPI]
    Backend -->|Upsert| DB[(PostgreSQL Database)]
    Backend -->|Trigger Analysis| MLEngine[ML Insight Engine]
    MLEngine -->|Read Data| DB
    MLEngine -->|Generate Predictions| Models[ML Models]
    Models -->|Risk/Demand Scores| MLEngine
    MLEngine -->|Save Insights| DB
    Frontend -->|Fetch Real-time Data| Backend
```

### ML Dataflow Pipeline
```mermaid
graph LR
    subgraph Data_Ingestion ["Data Ingestion"]
        direction TB
        CSV[CSV Upload]
        DB_Source[(Database Records)]
    end

    subgraph Preprocessing ["Feature Engineering"]
        Clean[Data Cleaning]
        Norm[Normalization]
        Enc[One-Hot Encoding]
    end

    subgraph inference ["Model Inference"]
        Demand[Demand Forecasting]
        Risk[Inventory Risk Classifier]
        Delay[Supplier Delay Predictor]
    end

    subgraph Decision ["Insight Generation"]
        Rules[Business Rules Engine]
        Filter[Deduplication & Scoring]
    end

    Data_Ingestion --> Clean
    Clean --> Norm --> Enc
    
    Enc --> Demand
    Enc --> Risk
    Enc --> Delay
    
    Demand -->|Forecast Values| Rules
    Risk -->|Risk Probabilities| Rules
    Delay -->|Delay Likelihood| Rules
    
    Rules --> Filter -->|Final Insights| DB_Target[(Database)]
```

### Database Schema (ERD)
```mermaid
erDiagram
    COMPANY ||--|{ USER : has
    COMPANY ||--|{ PRODUCT : owns
    COMPANY ||--|{ SUPPLIER : manages
    PRODUCT ||--|{ INVENTORY : stored_in
    PRODUCT ||--|{ ORDER_ITEM : part_of
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--|{ PREDICTION : has
    PREDICTION ||--|{ INSIGHT : generates

    PRODUCT {
        int id
        string name
        string category
        float unit_cost
        float selling_price
    }

    INVENTORY {
        int id
        int product_id
        int current_stock
        string warehouse
    }

    PREDICTION {
        int id
        int product_id
        float predicted_value
        string type
    }
```

### Data Upload Sequence Flow
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
        ML->>ML: Run Models (Risk, Demand)
        ML->>DB: Save New Insights
    and Immediate Response
        API-->>FE: 200 OK (Stats)
    end
    deactivate API
    
    FE->>U: Show "Analysis Complete"
```

### Backend Component Architecture
```mermaid
graph TD
    subgraph API_Layer [API Layer]
        Router[FastAPI Router]
        Auth[Auth Middleware]
    end

    subgraph Service_Layer [Service Logic]
        InvSvc[Inventory Service]
        OrderSvc[Order Service]
        MLSvc[ML Integration Service]
    end

    subgraph Data_Layer [Data Access]
        Models[SQLAlchemy Models]
        CRUD[CRUD Helpers]
    end

    Router --> Auth
    Auth --> InvSvc
    Auth --> OrderSvc
    Auth --> MLSvc

    InvSvc --> CRUD
    OrderSvc --> CRUD
    MLSvc --> CRUD
    
    CRUD --> Models
```

## Verification Plan (Verified)
1.  **Dashboard**:
    -   Upload `test.csv` (2 products).
    -   Verify Dashboard says "2 products tracked". (Confirmed)
2.  **Inventory**:
    -   Verify table lists "Test Widget A" and "Test Widget B". (Confirmed)
3.  **Suppliers**:
    -   Verify seeded suppliers appear. (Confirmed)

## Implementation Details

### 1. Dashboard Integration
- Fetches real product count and insights stats.
- Dynamic "Inventory Health" calculation.

### 2. Inventory Page Integration
- Connected to `inventoryAPI.getProducts()`.
- Supports pagination structure.

### 3. Supplier Page Integration
- Connected to `supplierAPI.getSuppliers()`.

### 4. Data Upload Feature
- **Backend**: `POST /api/upload/data` (Pandas + SQLAlchemy).
- **Frontend**: `DataUploadPage` with Drag & Drop.
