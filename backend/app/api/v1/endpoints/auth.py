from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.core.security import (
    verify_password, create_access_token, create_refresh_token, decode_token
)
from backend.app.core.config import settings
from backend.app.models.user import User, AuditLog
from backend.app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, UserProfile
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Kassir va xodimlar uchun xavfsiz autentifikatsiya.
    - Foydalanuvchi nomi yoki telefon raqami orqali qidiradi
    - 5 ta noto'g'ri urinishdan keyin hisobni 15 daqiqaga bloklaydi
    - Parolni bcrypt orqali solishtiradi
    - JWT access va refresh token qaytaradi
    - Audit log yaratadi
    """
    stmt = (
        select(User)
        .options(selectinload(User.role).selectinload(User.role.property.mapper.class_.permissions))
        .where(
            or_(
                User.username == payload.username,
                User.phone == payload.username,
                User.email == payload.username
            )
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    if not user:
        # Audit log failed attempt
        audit = AuditLog(
            username=payload.username,
            action="LOGIN_FAILED_USER_NOT_FOUND",
            entity_type="AUTH",
            ip_address=ip,
            user_agent=user_agent
        )
        db.add(audit)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi nomi yoki parol xato"
        )

    # Hisob muzlatilganligini tekshirish
    now_utc = datetime.now(timezone.utc)
    if user.is_locked:
        if user.locked_until and user.locked_until > now_utc:
            remaining_mins = int((user.locked_until - now_utc).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Hisob xavfsizlik sababli muzlatilgan. Iltimos {remaining_mins} daqiqadan so'ng qayta urinib ko'ring."
            )
        else:
            # Qulf muddati o'tgan bo'lsa, qulfdan chiqarish
            user.is_locked = False
            user.failed_login_attempts = 0
            user.locked_until = None

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu foydalanuvchi hisobi o'chirilgan yoki nofaol"
        )

    # Parolni tekshirish
    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts += 1

        # 5 ta xato urinish tekshiruvi
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.is_locked = True
            user.locked_until = now_utc + timedelta(minutes=settings.ACCOUNT_LOCK_MINUTES)

            audit = AuditLog(
                user_id=user.id,
                username=user.username,
                action="ACCOUNT_LOCKED_FAILED_ATTEMPTS",
                entity_type="AUTH",
                new_value={"attempts": user.failed_login_attempts, "locked_until": user.locked_until.isoformat()},
                ip_address=ip,
                user_agent=user_agent
            )
            db.add(audit)
            await db.commit()

            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Parol {settings.MAX_FAILED_LOGIN_ATTEMPTS} marta noto'g'ri kiritildi. Hisob {settings.ACCOUNT_LOCK_MINUTES} daqiqaga bloklandi!"
            )

        audit = AuditLog(
            user_id=user.id,
            username=user.username,
            action="LOGIN_FAILED_BAD_PASSWORD",
            entity_type="AUTH",
            new_value={"attempts": user.failed_login_attempts},
            ip_address=ip,
            user_agent=user_agent
        )
        db.add(audit)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi nomi yoki parol xato"
        )

    # Muvaffaqiyatli kirish
    user.failed_login_attempts = 0
    user.last_login_at = now_utc

    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="LOGIN_SUCCESS",
        entity_type="AUTH",
        entity_id=str(user.id),
        ip_address=ip,
        user_agent=user_agent
    )
    db.add(audit)
    await db.commit()

    # Tokenlarni generatsiya qilish
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    permissions_list = [p.id for p in user.role.permissions] if user.role and user.role.permissions else []

    user_profile = UserProfile(
        id=str(user.id),
        username=user.username,
        email=user.email,
        phone=user.phone,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=user.role.name,
        role_display_name_uz=user.role.display_name_uz,
        permissions=permissions_list,
        is_active=user.is_active
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_profile
    )


@router.get("/me", response_model=UserProfile)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Joriy tizimga kirgan foydalanuvchi va uning rollari hamda barcha ruxsatlarini olish."""
    permissions_list = [p.id for p in current_user.role.permissions] if current_user.role and current_user.role.permissions else []

    return UserProfile(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        phone=current_user.phone,
        full_name=current_user.full_name,
        role_id=current_user.role_id,
        role_name=current_user.role.name,
        role_display_name_uz=current_user.role.display_name_uz,
        permissions=permissions_list,
        is_active=current_user.is_active
    )


@router.post("/refresh")
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Yangi JWT access token olish uchun refresh token tekshirish."""
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token yaroqsiz yoki muddati o'tgan"
        )

    user_id = decoded.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi topilmadi yoki hisob faol emas"
        )

    new_access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Tizimdan chiqish va audit log saqlash."""
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="LOGOUT",
        entity_type="AUTH",
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)
    await db.commit()
    return {"message": "Tizimdan muvaffaqiyatli chiqildi"}
