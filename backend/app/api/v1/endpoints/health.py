from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Tizim holatini tekshirish servisi."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "phase": "PHASE_1_RBAC_AUTHENTICATION"
    }
