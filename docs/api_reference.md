# API Reference

Base URL: `http://localhost:8000`

All authenticated endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user info |

### POST /auth/register

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "company_name": "Acme Corp",
  "industry": "Manufacturing"
}
```

### POST /auth/login

Form-based login (OAuth2):
```
username=user@example.com&password=securepassword
```

Returns:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/products/` | List products (paginated) |
| POST | `/inventory/products/` | Create product |
| GET | `/inventory/products/{id}` | Get product by ID |
| PUT | `/inventory/products/{id}` | Update product |
| DELETE | `/inventory/products/{id}` | Delete product |
| GET | `/inventory/items/` | List inventory items |
| POST | `/inventory/items/` | Create inventory item |
| PUT | `/inventory/items/{id}` | Update inventory item |
| DELETE | `/inventory/items/{id}` | Delete inventory item |

---

## Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers/` | List suppliers |
| POST | `/suppliers/` | Create supplier |
| GET | `/suppliers/{id}` | Get supplier |
| PUT | `/suppliers/{id}` | Update supplier |
| DELETE | `/suppliers/{id}` | Delete supplier |
| GET | `/suppliers/{id}/detail` | Get supplier with ML predictions |
| GET | `/suppliers/shipments/` | List shipments |
| POST | `/suppliers/shipments/` | Create shipment |
| PUT | `/suppliers/shipments/{id}` | Update shipment |
| DELETE | `/suppliers/shipments/{id}` | Delete shipment |

---

## Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders/` | List orders |
| POST | `/orders/` | Create order |
| GET | `/orders/{id}` | Get order |
| PUT | `/orders/{id}` | Update order |
| DELETE | `/orders/{id}` | Delete order |

---

## Demand Planning

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/demand/{product_id}/history` | Get demand history (weekly/monthly/quarterly) |
| GET | `/demand/{product_id}/summary` | Get demand forecast + reorder recommendation |

### GET /demand/{product_id}/history

Query params: `period` (week | month | quarter)

```json
{
  "product_id": 1,
  "product_name": "Widget A",
  "period": "month",
  "series": [
    { "label": "Jan 2026", "period_start": "2026-01-01", "quantity": 150 },
    { "label": "Feb 2026", "period_start": "2026-02-01", "quantity": 180 }
  ]
}
```

### GET /demand/{product_id}/summary

```json
{
  "product_id": 1,
  "product_name": "Widget A",
  "period": "month",
  "change_percent": 20.0,
  "forecast": {
    "quantity": 200.0,
    "created_at": "2026-05-27T10:00:00",
    "source": "ml"
  },
  "inventory": {
    "current_stock": 45,
    "reorder_point": 30
  },
  "recommendation": {
    "suggested_reorder_quantity": 155,
    "urgency": "high",
    "message": "Reorder 155 units soon."
  }
}
```

---

## ML Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ml/demand-forecast/{product_id}` | Get demand forecast (with `?date=YYYY-MM-DD`) |
| GET | `/ml/inventory-risk/{product_id}` | Get inventory risk classification |
| GET | `/ml/supplier-delay-risk/{supplier_id}` | Get supplier delay probability |
| POST | `/ml/cost-anomaly` | Detect cost anomaly in shipment data |
| POST | `/ml/run-analysis` | Run full ML analysis for company |
| GET | `/ml/insights` | Get prioritized insights (paginated) |
| GET | `/ml/insights/action-required` | Get high/critical insights |
| POST | `/ml/insights/{id}/acknowledge` | Acknowledge an insight |
| POST | `/ml/insights/{id}/resolve` | Resolve an insight |
| GET | `/ml/predictions` | List predictions (paginated) |

### GET /ml/demand-forecast/{product_id}

Query params: `date` (YYYY-MM-DD)

```json
{
  "product_id": 1,
  "forecast_date": "2026-06-01",
  "predicted_demand": 245.0
}
```

### GET /ml/inventory-risk/{product_id}

```json
{
  "product_id": 1,
  "risk_label": "HEALTHY",
  "probabilities": [0.85, 0.10, 0.05]
}
```

### GET /ml/supplier-delay-risk/{supplier_id}

```json
{
  "supplier_id": 1,
  "delay_risk": true,
  "delay_probability": 0.72
}
```

### POST /ml/cost-anomaly

```json
{
  "id": 1,
  "shipping_cost": 450.00,
  "weight": 12.5,
  "distance": 500
}
```

Response:
```json
{
  "is_anomaly": true,
  "anomaly_score": -0.45,
  "prediction": -1
}
```

---

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Get KPI summary + top insights |

```json
{
  "kpis": {
    "total_products": 24,
    "inventory_health": 75,
    "stockout_risk_count": 3,
    "overstock_risk_count": 2,
    "suppliers_at_risk": 1,
    "needs_attention_count": 4
  },
  "top_insights": [...]
}
```

---

## AI Copilot

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/query/stream` | Stream NL query response (SSE) |
| POST | `/ai/insights/generate` | Generate AI-powered insights |
| GET | `/ai/suppliers/{id}/narrative` | Get supplier risk narrative |

### GET /ai/query/stream

Query params: `question` (string), `token` (JWT)

Returns Server-Sent Events:
```
data: Based on your current inventory levels,
data: Widget A is at risk of stockout...

event: done
data:
```

---

## Data Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/data` | Upload CSV for ingestion |

Multipart form data with `file` field.

---

## Error Responses

All errors follow a consistent envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product 42 not found",
    "field": null
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid input |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Access denied |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ML_ERROR` | 500 | ML inference failure |
| `MODEL_NOT_FOUND` | 500 | Missing .pkl artifact |
| `AI_SERVICE_ERROR` | 502 | External AI API failure |
