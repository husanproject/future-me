from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.models.user import User, AuditLog
from backend.app.models.product import Product, InventoryMovement
from backend.app.models.batch import Batch, Supplier, ExpiryOverride
from backend.app.schemas.batch import (
    BatchCreate, BatchOut, BatchFEFODispatchItem,
    ExpiryAlertOut, ExpiryOverrideCreate, ExpiryOverrideOut,
    AIExpiryRecommendationOut, SupplierOut, SupplierCreate
)
from backend.app.ai.expiry_engine import AIExpiryEngine
from backend.app.api.deps import require_permission, get_current_user

router = APIRouter()

def get_tier(days: int) -> str:
    if days <= 0: return "CRITICAL"
    if days <= 7: return "RED"
    if days <= 15: return "ORANGE"
    if days <= 30: return "YELLOW"
    return "GREEN"


@router.get("", response_model=List[BatchOut])
async def get_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    product_id: Optional[str] = None,
    tier: Optional[str] = None,
    current_user: User = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """Partiyalar ro‘yxatini olish (FEFO muddati bo‘yicha saralangan)."""
    stmt = (
        select(Batch)
        .options(selectinload(Batch.product), selectinload(Batch.supplier))
        .order_by(Batch.expiry_date.asc())
        .offset(skip)
        .limit(limit)
    )
    if product_id:
        stmt = stmt.where(Batch.product_id == product_id)

    result = await db.execute(stmt)
    batches = result.scalars().all()
    today = date.today()

    output = []
    for b in batches:
        days = (b.expiry_date - today).days
        b_tier = get_tier(days)

        if tier and b_tier != tier:
            continue

        output.append(
            BatchOut(
                id=str(b.id),
                product_id=str(b.product_id),
                product_name=b.product.name if b.product else None,
                batch_number=b.batch_number,
                supplier_id=str(b.supplier_id) if b.supplier_id else None,
                supplier_name=b.supplier.name if b.supplier else None,
                purchase_price=b.purchase_price,
                initial_quantity=b.initial_quantity,
                current_quantity=b.current_quantity,
                manufacture_date=b.manufacture_date,
                expiry_date=b.expiry_date,
                days_to_expiry=days,
                expiry_tier=b_tier,
                status=b.status,
                is_expired=days <= 0 or b.status == "EXPIRED",
                is_recalled=b.is_recalled,
                created_at=b.created_at
            )
        )
    return output


@router.get("/fefo/{product_id}", response_model=List[BatchFEFODispatchItem])
async def get_fefo_queue(
    product_id: str,
    requested_qty: Decimal = Query(Decimal("1.0"), gt=0),
    current_user: User = Depends(require_permission("sale:create")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    FEFO (First Expired, First Out) algoritmi:
    Sotuvda muddati eng tez tugaydigan partiyadan birinchi navbatda hisobdan chiqarish.
    Muddati o'tgan partiya default holatda bloklanadi.
    """
    stmt = (
        select(Batch)
        .where(
            and_(
                Batch.product_id == product_id,
                Batch.current_quantity > 0,
                Batch.status != "DEPLETED",
                Batch.is_recalled == False
            )
        )
        .order_by(Batch.expiry_date.asc())
    )
    result = await db.execute(stmt)
    batches = result.scalars().all()

    today = date.today()
    queue = []
    remaining_to_allocate = requested_qty
    rank = 1

    for b in batches:
        days = (b.expiry_date - today).days
        is_expired = days <= 0 or b.status == "EXPIRED"

        # Check if active admin override exists for expired batch
        has_override = False
        if is_expired:
            ov_stmt = (
                select(ExpiryOverride)
                .where(
                    and_(
                        ExpiryOverride.batch_id == b.id,
                        ExpiryOverride.expires_at > datetime.now(timezone.utc)
                    )
                )
            )
            ov_res = await db.execute(ov_stmt)
            has_override = ov_res.scalar_one_or_none() is not None

        # Expired items without override are skipped / blocked
        if is_expired and not has_override:
            continue

        allocated = min(remaining_to_allocate, b.current_quantity)
        remaining_to_allocate -= allocated

        queue.append(
            BatchFEFODispatchItem(
                batch_id=str(b.id),
                batch_number=b.batch_number,
                expiry_date=b.expiry_date,
                days_to_expiry=days,
                allocated_quantity=allocated,
                available_in_batch=b.current_quantity,
                is_expired=is_expired,
                fefo_priority_rank=rank
            )
        )
        rank += 1
        if remaining_to_allocate <= 0:
            break

    return queue


@router.get("/expiry-alerts", response_model=List[ExpiryAlertOut])
async def get_expiry_alerts(
    current_user: User = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Barcha yaqinlashayotgan va muddati o‘tgan partiyalar monitoringi.
    CRITICAL (<=0 kun), RED (1-7 kun), ORANGE (8-15 kun), YELLOW (16-30 kun).
    """
    stmt = (
        select(Batch)
        .options(selectinload(Batch.product))
        .where(
            and_(
                Batch.current_quantity > 0,
                Batch.status != "DEPLETED"
            )
        )
        .order_by(Batch.expiry_date.asc())
    )
    result = await db.execute(stmt)
    batches = result.scalars().all()
    today = date.today()

    alerts = []
    for b in batches:
        days = (b.expiry_date - today).days
        tier = get_tier(days)

        # Only alert if 30 days or less, or expired
        if days <= 30:
            ai_data = AIExpiryEngine.calculate_recommendation(
                current_stock=float(b.current_quantity),
                expiry_date=b.expiry_date,
                reference_date=today
            )
            alerts.append(
                ExpiryAlertOut(
                    batch_id=str(b.id),
                    product_id=str(b.product_id),
                    product_name=b.product.name if b.product else "Tovar",
                    barcode=b.product.barcode if b.product else "",
                    batch_number=b.batch_number,
                    current_quantity=b.current_quantity,
                    unit=b.product.unit if b.product else "dona",
                    expiry_date=b.expiry_date,
                    days_left=days,
                    tier=tier,
                    ai_recommendation_summary=ai_data["ai_insight_uz"]
                )
            )
    return alerts


@router.get("/ai-recommendation/{batch_id}", response_model=AIExpiryRecommendationOut)
async def get_ai_expiry_recommendation(
    batch_id: str,
    current_user: User = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    AI Expiry Markdown Optimization:
    Sotuv tezligi va muddat tugashiga qarab zararni kamaytirish uchun
    aniq optimal chegirma va ehtimollikni hisoblaydi.
    """
    stmt = select(Batch).options(selectinload(Batch.product)).where(Batch.id == batch_id)
    res = await db.execute(stmt)
    batch = res.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Partiya topilmadi")

    calc = AIExpiryEngine.calculate_recommendation(
        current_stock=float(batch.current_quantity),
        expiry_date=batch.expiry_date,
        unit_cost=float(batch.purchase_price),
        unit_price=float(batch.product.sale_price) if batch.product else float(batch.purchase_price * Decimal("1.25"))
    )

    return AIExpiryRecommendationOut(
        batch_id=str(batch.id),
        product_name=batch.product.name if batch.product else "Tovar",
        **calc
    )


@router.post("/override-expiry", response_model=ExpiryOverrideOut)
async def create_expiry_override(
    payload: ExpiryOverrideCreate,
    request: Request,
    current_user: User = Depends(require_permission("inventory:expiry_override")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Muddati o'tgan yoki xavfli partiyaga Administrator ruxsati (Override).
    Sababi, admin ID, timestamp va audit log majburiy saqlanadi.
    """
    stmt = select(Batch).where(Batch.id == payload.batch_id)
    res = await db.execute(stmt)
    batch = res.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Partiya topilmadi")

    expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.valid_hours)

    override = ExpiryOverride(
        batch_id=batch.id,
        product_id=batch.product_id,
        admin_id=current_user.id,
        reason=payload.reason,
        approved_discount_percent=payload.approved_discount_percent,
        expires_at=expires_at
    )
    db.add(override)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="EXPIRY_OVERRIDE_APPROVED",
        entity_type="BATCH",
        entity_id=str(batch.id),
        new_value={
            "reason": payload.reason,
            "discount": str(payload.approved_discount_percent),
            "expires_at": expires_at.isoformat()
        },
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(override)

    return ExpiryOverrideOut(
        id=str(override.id),
        batch_id=str(override.batch_id),
        product_id=str(override.product_id),
        admin_id=str(override.admin_id),
        admin_username=current_user.username,
        reason=override.reason,
        approved_discount_percent=override.approved_discount_percent,
        expires_at=override.expires_at,
        created_at=override.created_at
    )
