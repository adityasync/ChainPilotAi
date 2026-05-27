from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..database import get_db
from ..services.dashboard_service import get_dashboard_summary

router = APIRouter()


@router.get("/summary")
def read_dashboard_summary(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = get_current_user_company_id(db, current_user)
    return get_dashboard_summary(db, company_id)
