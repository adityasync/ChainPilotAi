from datetime import timedelta
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models.user_company import User, Company
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..core.config import SECRET_KEY, ALGORITHM
from ..core.exceptions import UnauthorizedError, NotFoundError, ConflictError, ValidationError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Pydantic models for request/response
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    industry: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    company_id: int
    company_name: Optional[str] = None
    industry: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    return verify_access_token(token, UnauthorizedError())


# Authentication endpoints
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    if len(user_data.password) < 8:
        raise ValidationError("Password must be at least 8 characters", field="password")

    result = await db.execute(select(User).filter(User.email == user_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise ConflictError("Email already registered")

    company = Company(name=user_data.company_name, industry=user_data.industry)
    db.add(company)
    await db.commit()
    await db.refresh(company)

    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        company_id=company.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Generate JWT token for immediate login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "company_id": user.company_id},
        expires_delta=access_token_expires,
    )

    return UserResponse(
        id=user.id,
        email=user.email,
        company_id=user.company_id,
        company_name=company.name,
        industry=company.industry,
        access_token=access_token,
        token_type="bearer",
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise UnauthorizedError("Incorrect email or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "company_id": user.company_id},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).options(selectinload(User.company)).filter(User.email == current_user)
    )
    user = result.scalars().first()
    if not user:
        raise NotFoundError("User")
    return UserResponse(
        id=user.id,
        email=user.email,
        company_id=user.company_id,
        company_name=user.company.name if user.company else None,
        industry=user.company.industry if user.company else None,
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    payload: UserUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).options(selectinload(User.company)).filter(User.email == current_user)
    )
    user = result.scalars().first()
    if not user:
        raise NotFoundError("User")

    if user.company:
        if payload.company_name is not None:
            user.company.name = payload.company_name
        if payload.industry is not None:
            user.company.industry = payload.industry

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        company_id=user.company_id,
        company_name=user.company.name if user.company else None,
        industry=user.company.industry if user.company else None,
    )


@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}
