import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.core.security import get_password_hash
from backend.app.models.user import User, Role, AuditLog
from backend.app.schemas.user import UserCreate, UserUpdate, UserOut
from backend.app.api.deps import get_current_user, require_permission

router = APIRouter()

@router.get("", response_model=List[UserOut])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    current_user: User = Depends(require_permission("user:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """Barcha xodimlar va kassirlar ro'yxatini olish (user:read ruxsati bilan)."""
    stmt = (
        select(User)
        .options(selectinload(User.role))
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            or_(
                User.username.ilike(search_fmt),
                User.full_name.ilike(search_fmt),
                User.phone.ilike(search_fmt)
            )
        )

    result = await db.execute(stmt)
    users = result.scalars().all()

    output = []
    for u in users:
        output.append(
            UserOut(
                id=str(u.id),
                username=u.username,
                email=u.email,
                phone=u.phone,
                full_name=u.full_name,
                role_id=u.role_id,
                role_name=u.role.name if u.role else None,
                role_display_name_uz=u.role.display_name_uz if u.role else None,
                is_active=u.is_active,
                is_locked=u.is_locked,
                failed_login_attempts=u.failed_login_attempts,
                last_login_at=u.last_login_at,
                created_at=u.created_at
            )
        )
    return output


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    request: Request,
    current_user: User = Depends(require_permission("user:create")),
    db: AsyncSession = Depends(get_db_session)
):
    """Yangi xodim / kassir yaratish va rol biriktirish."""
    # Check if username or phone exists
    stmt = select(User).where(or_(User.username == payload.username, User.phone == payload.phone))
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ushbu foydalanuvchi nomi yoki telefon raqami allaqachon mavjud"
        )

    # Check role
    role_stmt = select(Role).where(Role.id == payload.role_id)
    role_res = await db.execute(role_stmt)
    role = role_res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tanlangan rol topilmadi")

    # Prevent non SUPER_ADMIN from creating SUPER_ADMIN
    if payload.role_id == "SUPER_ADMIN" and current_user.role_id != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat Bosh Administrator yangi Super Admin yarata oladi"
        )

    new_user = User(
        username=payload.username,
        email=payload.email,
        phone=payload.phone,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role_id=payload.role_id,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="USER_CREATED",
        entity_type="USER",
        entity_id=str(new_user.id),
        new_value={"username": new_user.username, "role": new_user.role_id, "phone": new_user.phone},
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    return UserOut(
        id=str(new_user.id),
        username=new_user.username,
        email=new_user.email,
        phone=new_user.phone,
        full_name=new_user.full_name,
        role_id=new_user.role_id,
        role_name=role.name,
        role_display_name_uz=role.display_name_uz,
        is_active=new_user.is_active,
        is_locked=new_user.is_locked,
        failed_login_attempts=new_user.failed_login_attempts,
        last_login_at=new_user.last_login_at,
        created_at=new_user.created_at
    )


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    request: Request,
    current_user: User = Depends(require_permission("user:update")),
    db: AsyncSession = Depends(get_db_session)
):
    """Xodim ma'lumotlarini yoki bloklash holatini yangilash."""
    stmt = select(User).options(selectinload(User.role)).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    old_state = {"is_active": user.is_active, "is_locked": user.is_locked, "role_id": user.role_id}

    if payload.email is not None:
        user.email = payload.email
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role_id is not None:
        user.role_id = payload.role_id
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_locked is not None:
        user.is_locked = payload.is_locked
        if not payload.is_locked:
            user.failed_login_attempts = 0
            user.locked_until = None

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="USER_UPDATED",
        entity_type="USER",
        entity_id=str(user.id),
        old_value=old_state,
        new_value={"is_active": user.is_active, "is_locked": user.is_locked, "role_id": user.role_id},
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)

    return UserOut(
        id=str(user.id),
        username=user.username,
        email=user.email,
        phone=user.phone,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=user.role.name if user.role else None,
        role_display_name_uz=user.role.display_name_uz if user.role else None,
        is_active=user.is_active,
        is_locked=user.is_locked,
        failed_login_attempts=user.failed_login_attempts,
        last_login_at=user.last_login_at,
        created_at=user.created_at
    )
