from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
from .core.config import DATABASE_URL
from typing import AsyncGenerator

def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql://") and "+psycopg" not in database_url:
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


normalized_database_url = normalize_database_url(DATABASE_URL)

if normalized_database_url.startswith("sqlite"):
    engine = create_async_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_async_engine(normalized_database_url, pool_pre_ping=True)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine + session for seed scripts / CLI tools
# psycopg3 supports both sync and async — use postgresql+psycopg:// for sync
if normalized_database_url.startswith("sqlite"):
    sync_engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    sync_engine = create_engine(normalized_database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
