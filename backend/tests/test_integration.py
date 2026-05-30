"""Integration tests for auth and CRUD flows.

Uses an isolated SQLite database to avoid interfering with the real Neon DB.
"""

import os
import pytest

# --- Set up test env BEFORE importing the app ---
os.environ["DATABASE_URL"] = "sqlite:///./test_integration.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-integration"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_integration.db")
engine = create_engine(f"sqlite:///{TEST_DB_PATH}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    # Clean data after each test for isolation
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture()
def client():
    return TestClient(app)


_counter = 0


def _unique_email(prefix: str = "test") -> str:
    global _counter
    _counter += 1
    return f"{prefix}{_counter}@example.com"


def _register(client: TestClient, email: str | None = None, password: str = "testpassword123", company: str = "TestCo"):
    email = email or _unique_email()
    return client.post("/auth/register", json={"email": email, "password": password, "company_name": company}), email


def _login(client: TestClient, email: str, password: str = "testpassword123"):
    return client.post("/auth/login", data={"username": email, "password": password})


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _setup_user(client: TestClient) -> tuple[str, str]:
    """Register, login, return (token, email)."""
    resp, email = _register(client)
    assert resp.status_code == 200
    login_resp = _login(client, email)
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"], email


# --- Auth flow tests ---

class TestAuthFlow:
    def test_register(self, client):
        resp, email = _register(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data
        assert data["email"] == email

    def test_login(self, client):
        _, email = _register(client)
        resp = _login(client, email)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_login_wrong_password(self, client):
        _, email = _register(client)
        resp = _login(client, email, password="wrongpassword")
        assert resp.status_code == 401

    def test_protected_route_without_token(self, client):
        resp = client.get("/inventory/products/")
        assert resp.status_code == 401

    def test_protected_route_with_token(self, client):
        token, _ = _setup_user(client)
        resp = client.get("/inventory/products/", headers=_auth_header(token))
        assert resp.status_code == 200


# --- Product CRUD tests ---

class TestProductCRUD:
    def test_create_product(self, client):
        token, _ = _setup_user(client)
        resp = client.post("/inventory/products/", json={
            "product_name": "Test Widget",
            "category": "Widgets",
            "unit_cost": 5.0,
            "selling_price": 10.0,
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["product_name"] == "Test Widget"
        assert data["unit_cost"] == 5.0

    def test_list_products(self, client):
        token, _ = _setup_user(client)
        client.post("/inventory/products/", json={
            "product_name": "List Widget",
            "unit_cost": 3.0,
            "selling_price": 8.0,
        }, headers=_auth_header(token))
        resp = client.get("/inventory/products/", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert len(data["data"]) > 0

    def test_update_product(self, client):
        token, _ = _setup_user(client)
        create_resp = client.post("/inventory/products/", json={
            "product_name": "Update Widget",
            "unit_cost": 5.0,
            "selling_price": 10.0,
        }, headers=_auth_header(token))
        product_id = create_resp.json()["id"]
        resp = client.put(f"/inventory/products/{product_id}", json={
            "product_name": "Updated Widget",
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["product_name"] == "Updated Widget"

    def test_delete_product(self, client):
        token, _ = _setup_user(client)
        create_resp = client.post("/inventory/products/", json={
            "product_name": "Delete Widget",
            "unit_cost": 5.0,
            "selling_price": 10.0,
        }, headers=_auth_header(token))
        product_id = create_resp.json()["id"]
        resp = client.delete(f"/inventory/products/{product_id}", headers=_auth_header(token))
        assert resp.status_code == 200


# --- Inventory CRUD tests ---

class TestInventoryCRUD:
    def _setup(self, client):
        token, _ = _setup_user(client)
        product_resp = client.post("/inventory/products/", json={
            "product_name": "Inv Widget",
            "unit_cost": 5.0,
            "selling_price": 10.0,
        }, headers=_auth_header(token))
        return token, product_resp.json()["id"]

    def test_create_inventory_item(self, client):
        token, product_id = self._setup(client)
        resp = client.post("/inventory/items/", json={
            "product_id": product_id,
            "warehouse": "WH1",
            "current_stock": 100,
            "reorder_point": 20,
            "max_stock": 200,
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_stock"] == 100
        assert data["risk_status"] == "healthy"

    def test_inventory_risk_status_critical(self, client):
        token, product_id = self._setup(client)
        resp = client.post("/inventory/items/", json={
            "product_id": product_id,
            "warehouse": "WH2",
            "current_stock": 5,
            "reorder_point": 20,
            "max_stock": 200,
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["risk_status"] == "critical"

    def test_inventory_risk_status_low(self, client):
        token, product_id = self._setup(client)
        resp = client.post("/inventory/items/", json={
            "product_id": product_id,
            "warehouse": "WH3",
            "current_stock": 15,
            "reorder_point": 20,
            "max_stock": 200,
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["risk_status"] == "low"

    def test_update_inventory_item(self, client):
        token, product_id = self._setup(client)
        create_resp = client.post("/inventory/items/", json={
            "product_id": product_id,
            "warehouse": "WH4",
            "current_stock": 100,
            "reorder_point": 20,
            "max_stock": 200,
        }, headers=_auth_header(token))
        item_id = create_resp.json()["id"]
        resp = client.put(f"/inventory/items/{item_id}", json={
            "current_stock": 50,
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["current_stock"] == 50

    def test_update_inventory_validation(self, client):
        token, product_id = self._setup(client)
        create_resp = client.post("/inventory/items/", json={
            "product_id": product_id,
            "warehouse": "WH5",
            "current_stock": 100,
            "reorder_point": 20,
            "max_stock": 200,
        }, headers=_auth_header(token))
        item_id = create_resp.json()["id"]
        resp = client.put(f"/inventory/items/{item_id}", json={
            "reorder_point": 300,
            "max_stock": 100,
        }, headers=_auth_header(token))
        assert resp.status_code == 422


# --- Supplier CRUD tests ---

class TestSupplierCRUD:
    def test_create_supplier(self, client):
        token, _ = _setup_user(client)
        resp = client.post("/suppliers/", json={
            "supplier_name": "Acme Corp",
            "avg_lead_time": 7,
            "reliability_score": 0.95,
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["supplier_name"] == "Acme Corp"

    def test_list_suppliers_has_delay_probability(self, client):
        token, _ = _setup_user(client)
        client.post("/suppliers/", json={
            "supplier_name": "Delay Test Corp",
        }, headers=_auth_header(token))
        resp = client.get("/suppliers/", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) > 0
        assert "delay_probability" in data["data"][0]
