from sqlalchemy.ext.declarative import declarative_base

# Import all models to register them with the Base
from .user_company import User, Company
from .product_inventory import Product, Inventory
from .order import Order
from .supplier_shipment import Supplier, Shipment
from .ml_models import Prediction, Insight

Base = declarative_base()

__all__ = ["Base", "User", "Company", "Product", "Inventory", "Order", "Supplier", "Shipment", "Prediction", "Insight"]