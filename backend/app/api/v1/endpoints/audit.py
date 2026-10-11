from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.core.database import get_db_session
from backend.app.models.user import AuditLog, User
from backend.app.schemas.audit import AuditLogOut
from backend.app.api.deps import require_permission

router = APIRouter()

@router.get("", response_model=List[AuditLogOut])
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    current_user: User = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """Xavfsizlik va harakatlar audit jurnali (audit:read ruxsati bilan)."""
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action == action)

    result = await db.execute(stmt)
    logs = result.scalars().all()

    output = []
    for log in logs:
        output.append(
            AuditLogOut(
                id=str(log.id),
                user_id=str(log.user_id) if log.user_id else None,
                username=log.username,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                old_value=log.old_value,
                new_value=log.new_value,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                created_at=log.created_at
            )
        )
    return output
