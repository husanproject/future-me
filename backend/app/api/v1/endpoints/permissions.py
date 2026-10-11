from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db_session
from backend.app.models.user import Permission, User
from backend.app.schemas.auth import PermissionSchema
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[PermissionSchema])
async def get_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Tizimdagi barcha mavjud ruxsatlar katalogi (Modullar bo'yicha)."""
    stmt = select(Permission).order_by(Permission.module, Permission.action)
    result = await db.execute(stmt)
    return result.scalars().all()
