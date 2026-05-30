from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user_company import User
from .exceptions import UnauthorizedError


async def get_current_user_company_id(db: AsyncSession, current_user_email: str) -> int:
    result = await db.execute(select(User).filter(User.email == current_user_email))
    user = result.scalars().first()
    if not user:
        raise UnauthorizedError("User not found")
    return user.company_id


def apply_company_filter(query, model, company_id: int):
    return query.filter(model.company_id == company_id)
