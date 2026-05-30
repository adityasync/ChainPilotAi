CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    industry VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ix_users_email ON users(email);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    product_name VARCHAR NOT NULL,
    category VARCHAR,
    unit_cost FLOAT NOT NULL,
    selling_price FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse VARCHAR NOT NULL,
    current_stock INTEGER NOT NULL,
    reorder_point INTEGER NOT NULL,
    max_stock INTEGER NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity INTEGER NOT NULL,
    region VARCHAR
);

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    supplier_name VARCHAR NOT NULL,
    avg_lead_time INTEGER,
    reliability_score FLOAT
);

CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    shipping_cost FLOAT NOT NULL
);

CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    entity_type VARCHAR NOT NULL,
    entity_id INTEGER NOT NULL,
    prediction_type VARCHAR NOT NULL,
    prediction_value FLOAT,
    prediction_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    title VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    severity VARCHAR NOT NULL,
    entity_type VARCHAR,
    entity_id INTEGER,
    category VARCHAR,
    confidence_score FLOAT,
    explanation TEXT,
    recommended_action TEXT,
    expected_impact VARCHAR,
    urgency_level VARCHAR,
    priority_score FLOAT,
    status VARCHAR DEFAULT 'new',
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    prediction_details VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
