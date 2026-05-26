import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

# Create data/processed directory if it doesn't exist
os.makedirs("data/processed", exist_ok=True)

# === 1. Generate Demand Data ===
print("Generating demand forecast data...")
products = [f"PROD-{i}" for i in range(1, 51)]
dates = pd.date_range(start="2023-01-01", end="2024-01-01", freq="D")

demand_data = []
for prod_id in products:
    base_demand = random.randint(50, 200)
    for date in dates:
        # Add seasonality and noise
        seasonality = 1 + 0.3 * np.sin(2 * np.pi * date.month / 12)
        noise = random.uniform(0.8, 1.2)
        demand = int(base_demand * seasonality * noise)
        
        demand_data.append({
            "Product ID": prod_id,
            "Order Date": date.strftime("%Y-%m-%d"),
            "Quantity": demand
        })

df_demand = pd.DataFrame(demand_data)
df_demand.to_csv("data/processed/demand_data.csv", index=False)
print(f"Saved demand_data.csv with {len(df_demand)} records")

# === 2. Generate Classification/Regression Data ===
print("Generating classification data...")
# Features: 'Availability', 'Number of products sold', 'Revenue generated', 'Stock levels', 'Lead times', 'Order quantities', 'Shipping costs', 'Price', 'Shipping times'
# Targets: 'inventory_risk_label', 'delivery_delay'

n_samples = 2000
data = []

risk_labels = ["Normal", "High Risk", "Moderate Risk"]

for _ in range(n_samples):
    price = random.uniform(10, 500)
    qty_sold = random.randint(0, 1000)
    revenue = price * qty_sold
    stock = random.randint(0, 500)
    order_qty = random.randint(10, 100)
    lead_time = random.randint(1, 30)
    shipping_cost = random.uniform(5, 50)
    availability = random.randint(0, 100)
    
    # Derived for delay logic
    shipping_time = lead_time + random.randint(-5, 10)
    delivery_delay = 1 if shipping_time > lead_time else 0
    
    # Derived for inventory logic
    if stock < 20: 
        risk_label = "High Risk"
    elif stock > 300:
        risk_label = "Moderate Risk"
    else:
        risk_label = "Normal"
        
    # Normalized versions (mocking preprocessing)
    row = {
        'Price': price,
        'Number of products sold': qty_sold,
        'Revenue generated': revenue,
        'Stock levels': stock,
        'Lead times': lead_time,
        'Order quantities': order_qty,
        'Shipping costs': shipping_cost,
        'Availability': availability,
        'Shipping times': shipping_time,
        'inventory_risk_label': risk_label,
        'delivery_delay': delivery_delay,
        
        # Add normalized columns (simple mock)
        'Availability_normalized': availability / 100,
        'Number of products sold_normalized': qty_sold / 1000,
        'Revenue generated_normalized': revenue / 50000,
        'Stock levels_normalized': stock / 500,
        'Lead times_normalized': lead_time / 30,
        'Order quantities_normalized': order_qty / 100,
        'Shipping costs_normalized': shipping_cost / 50,
        'Price_normalized': price / 500
    }
    data.append(row)

df_class = pd.DataFrame(data)
df_class.to_csv("data/processed/classification_data.csv", index=False)
print(f"Saved classification_data.csv with {len(df_class)} records")
