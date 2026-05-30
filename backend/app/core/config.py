import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aditya@localhost/supply_chain_db")
BACKEND_CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
ML_ARTIFACTS_PATH = os.getenv("ML_ARTIFACTS_PATH", "app/ml/models")
AI_PROVIDER = os.getenv("AI_PROVIDER", "glm")
AI_MODEL = os.getenv("AI_MODEL", "glm-4.5-flash")
AI_FALLBACK_MODEL = os.getenv("AI_FALLBACK_MODEL", "glm-4.7")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_REQUEST_TIMEOUT_SECONDS = int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "10"))
