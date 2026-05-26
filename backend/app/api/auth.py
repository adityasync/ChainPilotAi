from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError
from pydantic import BaseModel

from ..database import get_db
from ..models.user_company import User, Company
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..core.config import SECRET_KEY, ALGORITHM

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic models for request/response
class UserCreate(BaseModel):
    email: str
    password: str
    company_name: str
    industry: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    company_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Dependency to get current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return verify_access_token(token, credentials_exception)

# Authentication endpoints
@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create company
    company = Company(name=user_data.company_name, industry=user_data.industry)
    db.add(company)
    db.commit()
    db.refresh(company)

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create user
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        company_id=company.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # current_user is the email string from the token
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post("/logout")
def logout():
    # In a real implementation, you might add the token to a blacklist
    # For now, we just return a success message
    return {"message": "Successfully logged out"}