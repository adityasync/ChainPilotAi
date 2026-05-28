# ML Models

FlowChain uses four trained ML models for predictive supply chain intelligence. All models are trained with scikit-learn and stored as `.pkl` artifacts.

---

## Model Overview

| Model | Algorithm | Purpose | Artifact |
|-------|-----------|---------|----------|
| Demand Forecasting | XGBoost Regressor | Predict future product demand | `demand_forecasting_model.pkl` |
| Inventory Risk Classifier | Random Forest Classifier | Classify stock health (HEALTHY/RISK/OVERSTOCK) | `inventory_risk_classifier.pkl` |
| Supplier Delay Predictor | Gradient Boosting Classifier | Estimate supplier delay probability | `supplier_delay_predictor.pkl` |
| Cost Anomaly Detector | Isolation Forest | Detect unusual shipping costs | `cost_anomaly_detector.pkl` |

---

## Demand Forecasting

**Algorithm:** XGBoost Regressor  
**Artifact:** `demand_forecasting_model.pkl`

### Features Used
- Historical order quantities
- Time-based features (month, day of week, quarter)
- Rolling averages (4-week, 12-week)
- Lag features (1-period, 4-period)

### Input
```python
{
    "product_id": "1",
    "forecast_date": "2026-06-01"
}
```

### Output
```python
{
    "predicted_demand": 245.0
}
```

### Training
```bash
python ml/training/train_models.py --model demand_forecasting
```

---

## Inventory Risk Classifier

**Algorithm:** Random Forest Classifier  
**Artifact:** `inventory_risk_classifier.pkl`

### Features Used
- Current stock level
- Reorder point
- Max stock level
- Stock-to-reorder ratio
- Stock-to-max ratio
- Historical turnover rate

### Risk Categories
| Label | Meaning |
|-------|---------|
| HEALTHY | Stock within normal range |
| RISK | Stock below reorder point |
| OVERSTOCK | Stock exceeds max level |

### Input
```python
{
    "id": 1,
    "Availability": 150,
    "Stock levels": 150,
    "Price": 29.99
}
```

### Output
```python
{
    "risk_label": "HEALTHY",
    "probabilities": [0.85, 0.10, 0.05]
}
```

---

## Supplier Delay Predictor

**Algorithm:** Gradient Boosting Classifier  
**Artifact:** `supplier_delay_predictor.pkl`

### Features Used
- Average lead time
- Reliability score
- Historical delay rate
- Shipment cost variance
- Order frequency

### Input
```python
{
    "id": 1,
    "Lead times": 14,
    "Order quantities": 100
}
```

### Output
```python
{
    "delay_risk": true,
    "delay_probability": 0.72
}
```

---

## Cost Anomaly Detector

**Algorithm:** Isolation Forest  
**Artifact:** `cost_anomaly_detector.pkl`

### Features Used
- Shipping cost
- Package weight
- Delivery distance
- Shipping method
- Historical cost patterns

### Input
```python
{
    "id": 1,
    "shipping_cost": 450.00,
    "weight": 12.5,
    "distance": 500
}
```

### Output
```python
{
    "is_anomaly": true,
    "anomaly_score": -0.45,
    "prediction": -1
}
```

---

## Model Artifact Management

### Storage Location
```
backend/app/ml/models/*.pkl
```

### Loading Flow
```
ML Endpoint Request
    ↓
Load Model Artifact (.pkl)
    ↓
Validate Model Exists
    ↓
Run Inference
    ↓
Cast to Native Python Types
    ↓
Persist Prediction to DB
    ↓
Return Response
```

### Missing Model Handling
If a `.pkl` file is missing, the endpoint returns:
```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "Required ML artifact missing"
  }
}
```

### Retraining
```bash
# Train all models
python ml/training/train_models.py --all

# Train specific model
python ml/training/train_models.py --model demand_forecasting
python ml/training/train_models.py --model inventory_risk
python ml/training/train_models.py --model supplier_delay
python ml/training/train_models.py --model cost_anomaly
```

---

## Feature Engineering

### Automatic Normalization
Models that require normalized features (Inventory Risk, Supplier Delay) automatically compute derived features during inference:

- `Lead times_normalized` — min-max scaled lead time
- `Stock levels_normalized` — min-max scaled stock level
- `Price_normalized` — min-max scaled price

### Missing Feature Handling
Inference pipelines fill missing placeholder values with `0` for features that would normally come from historical data not yet available in the system.

---

## Prediction Persistence

All predictions are stored in the `predictions` table:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| company_id | Integer | Tenant isolation |
| entity_type | String | "product", "supplier", or "cost" |
| entity_id | Integer | ID of referenced entity |
| prediction_type | String | "demand_forecast", "inventory_risk", "delay_risk", "cost_anomaly" |
| prediction_value | Float | Numeric prediction output |
| prediction_text | Text | AI-generated narrative (nullable) |
| created_at | DateTime | Timestamp |

This enables:
- Caching (skip re-inference if prediction exists)
- Cross-module consumption (dashboard reads predictions)
- Historical tracking (prediction trends over time)
