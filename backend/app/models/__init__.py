# Import all models to register them with the Base from database.py
from .user_company import User, Company
from .product_inventory import Product, Inventory
from .order import Order
from .supplier_shipment import Supplier, Shipment
from .ml_models import Prediction, Insight

__all__ = ["User", "Company", "Product", "Inventory", "Order", "Supplier", "Shipment", "Prediction", "Insight"]
