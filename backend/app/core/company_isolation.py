from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..models.user_company import User
from ..api.auth import get_current_user
from ..database import get_db
from typing import Callable, Any

def get_current_user_company_id(db: Session, current_user_email: str) -> int:
    """
    Get the company ID for the currently authenticated user
    """
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user.company_id

def apply_company_filter(query, model, company_id: int):
    """
    Apply company filter to a query for data isolation
    """
    # Assuming all models that need company isolation have a company_id field
    return query.filter(model.company_id == company_id)

def company_isolation_dependency(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Dependency to enforce company isolation
    """
    company_id = get_current_user_company_id(db, current_user)
    return company_id