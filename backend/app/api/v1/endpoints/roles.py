from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.models.user import Role, Permission, RolePermission, User, AuditLog
from backend.app.schemas.auth import RoleSchema, PermissionSchema
from backend.app.schemas.user import RolePermissionUpdate
from backend.app.api.deps import require_permission, get_current_user

router = APIRouter()

@router.get("", response_model=List[RoleSchema])
async def get_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Barcha rollar va ularga tegishli ruxsatlar xaritasini olish."""
    stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.id)
    result = await db.execute(stmt)
    roles = result.scalars().all()
    return roles


@router.put("/{role_id}/permissions", response_model=RoleSchema)
async def update_role_permissions(
    role_id: str,
    payload: RolePermissionUpdate,
    request: Request,
    current_user: User = Depends(require_permission("role:manage")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Ruxsatlar xaritasini dinamik ravishda yangilash (Database-driven RBAC).
    Faqat SUPER_ADMIN yoki role:manage huquqiga ega foydalanuvchi qila oladi.
    """
    stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Rol topilmadi")

    if role.id == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bosh Administrator (SUPER_ADMIN) huquqlari cheklanishi mumkin emas!"
        )

    # Old permissions for audit log
    old_permissions = [p.id for p in role.permissions]

    # Delete existing role permissions
    await db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))

    # Add new valid permissions
    for perm_id in payload.permission_ids:
        db.add(RolePermission(role_id=role_id, permission_id=perm_id))

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="ROLE_PERMISSIONS_UPDATED",
        entity_type="ROLE",
        entity_id=role_id,
        old_value={"permissions": old_permissions},
        new_value={"permissions": payload.permission_ids},
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)
    await db.commit()

    # Reload role
    res = await db.execute(stmt)
    updated_role = res.scalar_one()
    return updated_role
