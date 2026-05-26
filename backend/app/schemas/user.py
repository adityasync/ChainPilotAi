from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str
    company_name: str
    industry: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None


class UserInDB(UserBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None