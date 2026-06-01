<p align="center">
  <img src="../frontend/public/favicon.png" alt="ChainPilot Logo" width="80" />
</p>

<h1 align="center">API Reference</h1>

<p align="center">
  Complete REST API documentation for all ChainPilot endpoints.
</p>

---

## Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:8000` |
| Production | Set via `BACKEND_CORS_ORIGINS` |

All endpoints are prefixed with the router path (e.g., `/auth`, `/inventory`).

Interactive Swagger UI available at `/docs` when the backend is running.

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/auth/login` or `/auth/register` and expire after 30 minutes (configurable).

---

## Auth (`/auth`)

**File**: `backend/app/api/auth.py`

### Register

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@company.com",
  "password": "securepass123",
  "company_name": "Acme Corp",
  "industry": "Manufacturing"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "user@company.com",
  "company_id": 1,
  "company_name": "Acme Corp",
  "industry": "Manufacturing",
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation:** Password must be ≥ 8 characters. Email must be valid format.

---

### Login

```
POST /auth/login
```

**Request (OAuth2 form-encoded):**
```
username=user@company.com&password=securepass123
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### Get Profile

```
GET /auth/me
```

**Auth:** Required

**Response (200):**
```json
{
  "id": 1,
  "email": "user@company.com",
  "company_id": 1,
  "company_name": "Acme Corp",
  "industry": "Manufacturing"
}
```

---

### Update Profile

```
PUT /auth/me
```

**Auth:** Required

**Request:**
```json
{
  "company_name": "New Name",
  "industry": "Technology"
}
```

---

### Logout

```
POST /auth/logout
```

**Response (200):**
```json
{ "message": "Successfully logged out" }
```

---

## Inventory (`/inventory`)

**File**: `backend/app/api/inventory.py`

### Products

#### List Products

```
GET /inventory/products?page=1&page_size=20
```

**Auth:** Required

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "product_name": "Widget A",
      "category": "Electronics",
      "unit_cost": 10.50,
      "selling_price": 24.99,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "page_size": 20
}
```

#### Create Product

```
POST /inventory/products/
```

**Request:**
```json
{
  "product_name": "Widget B",
  "category": "Electronics",
  "unit_cost": 15.00,
  "selling_price": 34.99
}
```

**Validation:** `unit_cost` ≥ 0, `selling_price` ≥ 0.

#### Get / Update / Delete Product

```
GET    /inventory/products/{product_id}
PUT    /inventory/products/{product_id}
DELETE /inventory/products/{product_id}
```

---

### Inventory Items

#### List Items

```
GET /inventory/items?page=1&page_size=20
```

**Response includes ML risk assessment** for each item.

#### Create Item

```
POST /inventory/items/
```

**Request:**
```json
{
  "product_id": 1,
  "warehouse": "Main Warehouse",
  "current_stock": 150,
  "reorder_point": 50,
  "max_stock": 500
}
```

**Validation:** `reorder_point` < `max_stock`.

#### Get / Update / Delete Item

```
GET    /inventory/items/{item_id}
PUT    /inventory/items/{item_id}
DELETE /inventory/items/{item_id}
```

---

## Orders (`/orders`)

**File**: `backend/app/api/orders.py`

### List Orders

```
GET /orders?page=1&page_size=20&product_id=1
```

**Auth:** Required

### Create Order

```
POST /orders/
```

**Request:**
```json
{
  "product_id": 1,
  "order_date": "2025-06-01",
  "quantity": 100,
  "region": "North America"
}
```

**Validation:** `quantity` > 0. `order_date` defaults to today.

### Bulk Create

```
POST /orders/bulk
```

**Request:** Array of order objects.

**Response:**
```json
{ "created": 15 }
```

### Get / Update / Delete Order

```
GET    /orders/{order_id}
PUT    /orders/{order_id}
DELETE /orders/{order_id}
```

---

## Suppliers (`/suppliers`)

**File**: `backend/app/api/supplier.py`

### Suppliers

#### List Suppliers

```
GET /suppliers?page=1&page_size=20
```

**Response includes `delay_probability`** from ML model.

#### Create Supplier

```
POST /suppliers/
```

**Request:**
```json
{
  "supplier_name": "Global Parts Inc",
  "avg_lead_time": 14,
  "reliability_score": 0.92
}
```

**Validation:** `avg_lead_time` > 0, `reliability_score` between 0 and 1.

#### Get Supplier Detail

```
GET /suppliers/{supplier_id}/detail
```

Returns supplier with full shipment history.

#### CRUD

```
GET    /suppliers/{supplier_id}
PUT    /suppliers/{supplier_id}
DELETE /suppliers/{supplier_id}
```

---

### Shipments

#### List Shipments

```
GET /suppliers/shipments?page=1&page_size=20&supplier_id=1
```

#### Create Shipment

```
POST /suppliers/shipments/
```

**Request:**
```json
{
  "supplier_id": 1,
  "expected_delivery_date": "2025-06-15",
  "actual_delivery_date": "2025-06-14",
  "shipping_cost": 250.00
}
```

#### CRUD

```
GET    /suppliers/shipments/{shipment_id}
PUT    /suppliers/shipments/{shipment_id}
DELETE /suppliers/shipments/{shipment_id}
```

---

## ML Integration (`/ml`)

**File**: `backend/app/api/ml_integration.py`

### Demand Forecast

```
GET /ml/demand-forecast/{product_id}?date=2025-07-01
```

**Response:**
```json
{
  "product_id": 1,
  "forecast_date": "2025-07-01",
  "predicted_demand": 142.5
}
```

### Inventory Risk

```
GET /ml/inventory-risk/{product_id}
```

**Response:**
```json
{
  "product_id": 1,
  "risk_label": "Stockout Risk",
  "probabilities": [0.72, 0.15, 0.13]
}
```

### Supplier Delay Risk

```
GET /ml/supplier-delay-risk/{supplier_id}
```

**Response:**
```json
{
  "supplier_id": 1,
  "delay_risk": true,
  "delay_probability": 0.81
}
```

### Cost Anomaly Detection

```
POST /ml/cost-anomaly
```

**Request:**
```json
{
  "cost_data": {
    "shipping_costs": 450,
    "number_of_products_sold": 100,
    "price": 25.99,
    "order_quantities": 50,
    "lead_times": 14
  }
}
```

### Run Full Analysis

```
POST /ml/run-analysis
```

Triggers all ML models on the company's data.

**Response:**
```json
{
  "message": "Enhanced ML analysis completed successfully",
  "predictions_count": 42,
  "insights_count": 15
}
```

### Insights

```
GET  /ml/insights?severity=high&category=inventory&status=new&page=1&page_size=20
GET  /ml/insights/action-required
POST /ml/insights/{insight_id}/acknowledge
POST /ml/insights/{insight_id}/resolve
```

### Predictions

```
GET /ml/predictions?entity_type=product&prediction_type=demand&page=1&page_size=20
```

---

## Demand Planning (`/demand`)

**File**: `backend/app/api/demand.py`

### Portfolio Summary

```
GET /demand/portfolio/summary?period=month
```

Returns aggregate demand across all products.

### Portfolio Insights

```
GET /demand/portfolio/insights
```

ML-based accuracy metrics and demand patterns.

### Product Demand History

```
GET /demand/{product_id}/history?period=month
```

### Product Demand Summary

```
GET /demand/{product_id}/summary?period=month&forecast_date=2025-07-01
```

### Forecast Accuracy

```
GET /demand/{product_id}/accuracy
```

**Response:**
```json
{
  "product_id": 1,
  "mape": 12.5,
  "bias": -3.2,
  "rmse": 8.7,
  "accuracy_data": [
    { "label": "Jan", "predicted": 120, "actual": 115 },
    { "label": "Feb", "predicted": 130, "actual": 128 }
  ]
}
```

### Product Insights

```
GET /demand/{product_id}/insights
```

---

## Dashboard (`/dashboard`)

**File**: `backend/app/api/dashboard.py`

### Summary

```
GET /dashboard/summary
```

**Response:**
```json
{
  "kpis": {
    "total_products": 45,
    "inventory_health": 82.5,
    "stockout_risk_count": 3,
    "critical_risk_count": 1,
    "overstock_risk_count": 5,
    "suppliers_at_risk": 2
  },
  "demand_trend": [
    { "label": "Jan", "quantity": 1250 },
    { "label": "Feb", "quantity": 1380 }
  ],
  "inventory_breakdown": {
    "healthy": 35,
    "stockout": 3,
    "critical": 1,
    "overstock": 6
  },
  "top_products": [...],
  "reorder_alerts": [...],
  "supplier_summary": { "total": 8, "at_risk": 2 },
  "top_insights": [...]
}
```

---

## AI (`/ai`)

**File**: `backend/app/api/ai.py`

**Rate limit:** 10 requests per minute per company.

### Chat (Streaming)

```
GET /ai/query/stream?question=What products are at risk of stockout?
```

**Response:** Server-Sent Events (SSE) stream.

### Generate Insights

```
POST /ai/insights/generate
```

### Supplier Narrative

```
GET /ai/suppliers/{supplier_id}/narrative
```

**Response:**
```json
{
  "data": "Global Parts Inc has a 81% probability of delayed shipments based on recent patterns. Their average lead time has increased by 3 days over the last quarter..."
}
```

---

## Data Ingestion (`/api`)

**File**: `backend/app/api/data_ingestion.py`

### Upload CSV

```
POST /api/upload/data
Content-Type: multipart/form-data
```

**Form fields:**
- `file` — CSV file (required)
- `category_filter` — category string (optional)

**Required CSV columns:**
- `Product Name`
- `Unit Cost`
- `Selling Price`
- `Current Stock`

**Optional CSV columns:**
- `Category`, `Warehouse`, `Min Stock`, `Max Stock`
- `Supplier`, `Reliability`, `Lead Time`
- `Order Qty`, `Order Date`, `Region`
- `Shipment Expected`, `Shipment Actual`, `Shipment Cost`

**Response:**
```json
{
  "message": "Upload complete. Analysis triggered.",
  "stats": {
    "products_created": 10,
    "products_updated": 5,
    "inventory_items_created": 15,
    "orders_created": 42,
    "suppliers_created": 3
  },
  "analysis": {
    "insights_generated": 8,
    "predictions_made": 25
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product with id 42 not found",
    "field": "product_id"
  }
}
```

| HTTP Code | Error Code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Invalid request format |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate resource |
| 422 | `VALIDATION_ERROR` | Invalid input data |
| 429 | `RATE_LIMITED` | Too many requests |
| 503 | `SERVICE_UNAVAILABLE` | External service error |

---

## Related Documentation

- [Architecture](architecture.md) — System design
- [Database Schema](database.md) — Data models
- [ML Integration](ml_integration.md) — Model details
- [Deployment](deployment.md) — Setup guide
