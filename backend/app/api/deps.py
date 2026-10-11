from typing import Callable, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.core.security import decode_token
from backend.app.models.user import User, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """Validates the JWT token and returns the authenticated user with loaded roles and permissions."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentifikatsiya ma'lumotlari yaroqsiz yoki eskirgan",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception

    stmt = (
        select(User)
        .options(selectinload(User.role).selectinload(User.role.property.mapper.class_.permissions))
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Foydalanuvchi hisobi nofaol (bloklangan)"
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Foydalanuvchi hisobi xavfsizlik maqsadida vaqtincha muzlatilgan"
        )

    return user


def require_permission(required_permission: str) -> Callable:
    """
    RBAC Dynamic Permission Guard:
    Checks if the user's role has the required permission directly from database.
    SUPER_ADMIN always has full access.
    """
    async def permission_checker(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db_session)
    ) -> User:
        # SUPER_ADMIN has master override
        if current_user.role_id == "SUPER_ADMIN":
            return current_user

        # Fetch active permissions for user's role
        user_permission_ids = {p.id for p in current_user.role.permissions}

        if required_permission not in user_permission_ids:
            # Audit log unauthorized access attempt
            audit = AuditLog(
                user_id=current_user.id,
                username=current_user.username,
                action="PERMISSION_DENIED",
                entity_type="PERMISSION",
                entity_id=required_permission,
                old_value={"user_role": current_user.role_id},
                new_value={"required_permission": required_permission},
                ip_address=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent")
            )
            db.add(audit)
            await db.commit()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Sizda ushbu amalni bajarish uchun ruxsat yo'q: '{required_permission}'"
            )

        return current_user

    return permission_checker


def require_role(required_role: str) -> Callable:
    """Ensures user belongs to a specific role."""
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role_id != "SUPER_ADMIN" and current_user.role_id != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ushbu sahifaga faqat {required_role} kirishi mumkin"
            )
        return current_user

    return role_checker


async def record_audit_log(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Helper to record critical business and security actions into PostgreSQL audit_logs table."""
    audit = AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit)
    await db.commit()
