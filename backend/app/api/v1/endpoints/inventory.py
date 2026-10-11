from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.models.user import User, AuditLog
from backend.app.models.product import Product, InventoryMovement
from backend.app.schemas.product import InventoryMovementCreate, InventoryMovementOut
from backend.app.api.deps import require_permission, get_current_user

router = APIRouter()

@router.get("/movements", response_model=List[InventoryMovementOut])
async def get_inventory_movements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    product_id: Optional[str] = None,
    movement_type: Optional[str] = None,
    current_user: User = Depends(require_permission("inventory:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """Ombor harakatlari (Kirim, Chiqim, Brak, Inventarizatsiya) jurnali."""
    stmt = (
        select(InventoryMovement)
        .options(selectinload(InventoryMovement.product))
        .order_by(desc(InventoryMovement.created_at))
        .offset(skip)
        .limit(limit)
    )

    if product_id:
        stmt = stmt.where(InventoryMovement.product_id == product_id)
    if movement_type:
        stmt = stmt.where(InventoryMovement.movement_type == movement_type)

    result = await db.execute(stmt)
    movements = result.scalars().all()

    output = []
    for m in movements:
        output.append(
            InventoryMovementOut(
                id=str(m.id),
                product_id=str(m.product_id),
                product_name=m.product.name if m.product else "Noma'lum tovar",
                movement_type=m.movement_type,
                quantity=m.quantity,
                previous_stock=m.previous_stock,
                new_stock=m.new_stock,
                reason=m.reason,
                reference_id=m.reference_id,
                created_at=m.created_at
            )
        )
    return output


@router.post("/adjust", response_model=InventoryMovementOut, status_code=status.HTTP_201_CREATED)
async def adjust_inventory(
    payload: InventoryMovementCreate,
    request: Request,
    current_user: User = Depends(require_permission("inventory:update")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Ombor qoldig'ini tranzaksion o'zgartirish (Atomik backend operatsiyasi).
    Frontend hech qachon qoldiqni to'g'ridan-to'g'ri o'zgartira olmaydi.
    """
    stmt = select(Product).where(Product.id == payload.product_id).with_for_update()
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    prev_stock = product.current_stock
    qty = payload.quantity

    if payload.movement_type in ["STOCK_IN", "RETURN"]:
        new_stock = prev_stock + qty
    elif payload.movement_type in ["STOCK_OUT", "DAMAGED", "EXPIRED", "SALE"]:
        if prev_stock < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Omborda yetarli qoldiq mavjud emas! Mavjud: {prev_stock}, So'ralgan: {qty}"
            )
        new_stock = prev_stock - qty
    elif payload.movement_type == "ADJUSTMENT":
        # Qo'lda to'g'rilash (masalan inventarizatsiya natijasi)
        new_stock = qty
    else:
        raise HTTPException(status_code=400, detail="Noto'g'ri movement_type turi")

    # Update product stock in transaction
    product.current_stock = new_stock

    # Create movement record
    movement = InventoryMovement(
        product_id=product.id,
        movement_type=payload.movement_type,
        quantity=qty,
        unit_cost=product.purchase_price,
        previous_stock=prev_stock,
        new_stock=new_stock,
        reason=payload.reason,
        reference_id=payload.reference_id,
        user_id=current_user.id
    )
    db.add(movement)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="INVENTORY_ADJUSTMENT",
        entity_type="INVENTORY",
        entity_id=str(product.id),
        old_value={"stock": str(prev_stock)},
        new_value={"stock": str(new_stock), "type": payload.movement_type, "diff": str(qty)},
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(movement)

    return InventoryMovementOut(
        id=str(movement.id),
        product_id=str(product.id),
        product_name=product.name,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        previous_stock=movement.previous_stock,
        new_stock=movement.new_stock,
        reason=movement.reason,
        reference_id=movement.reference_id,
        created_at=movement.created_at
    )
