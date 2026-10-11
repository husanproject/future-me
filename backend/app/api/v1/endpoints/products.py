import time
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.models.user import User, AuditLog
from backend.app.models.product import Product, Category, BarcodeItem, InventoryMovement
from backend.app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut, BarcodeLookupOut, BarcodeItemOut
)
from backend.app.api.deps import require_permission, get_current_user

router = APIRouter()

@router.get("", response_model=List[ProductOut])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    low_stock_only: bool = False,
    current_user: User = Depends(require_permission("product:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """Mahsulotlar katalogini olish (qidiruv va filtrlar bilan)."""
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.barcodes))
        .offset(skip)
        .limit(limit)
        .order_by(Product.name.asc())
    )

    conditions = []
    if search:
        search_fmt = f"%{search}%"
        conditions.append(
            or_(
                Product.name.ilike(search_fmt),
                Product.sku.ilike(search_fmt),
                Product.barcode.ilike(search_fmt),
                Product.brand.ilike(search_fmt)
            )
        )
    if category_id:
        conditions.append(Product.category_id == category_id)
    if low_stock_only:
        conditions.append(Product.current_stock <= Product.min_stock)

    if conditions:
        stmt = stmt.where(and_(*conditions))

    result = await db.execute(stmt)
    products = result.scalars().all()

    output = []
    for p in products:
        output.append(
            ProductOut(
                id=str(p.id),
                name=p.name,
                sku=p.sku,
                barcode=p.barcode,
                category_id=str(p.category_id) if p.category_id else None,
                category_name=p.category.name if p.category else None,
                brand=p.brand,
                description=p.description,
                purchase_price=p.purchase_price,
                sale_price=p.sale_price,
                tax_rate=p.tax_rate,
                unit=p.unit,
                weight=p.weight,
                current_stock=p.current_stock,
                min_stock=p.min_stock,
                max_stock=p.max_stock,
                is_active=p.is_active,
                is_low_stock=p.current_stock <= p.min_stock,
                barcodes=[
                    BarcodeItemOut(
                        id=str(b.id),
                        barcode_value=b.barcode_value,
                        barcode_type=b.barcode_type,
                        is_primary=b.is_primary
                    ) for b in p.barcodes
                ],
                created_at=p.created_at,
                updated_at=p.updated_at
            )
        )
    return output


@router.get("/barcode/{barcode}", response_model=BarcodeLookupOut)
async def lookup_by_barcode(
    barcode: str,
    current_user: User = Depends(require_permission("product:read")),
    db: AsyncSession = Depends(get_db_session)
):
    """
    USB Barcode Scanner uchun juda tezkor shtrix-kod qidiruvi.
    EAN-13, EAN-8, Code 128, QR va ichki kodlarni qo'llab-quvvatlaydi.
    """
    start_time = time.time()
    clean_barcode = barcode.strip()

    # 1. Avval asosiy mahsulot jadvalidagi barcode index orqali qidirish
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.barcodes))
        .where(Product.barcode == clean_barcode)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    barcode_type = "EAN_13"

    # 2. Agar topilmasa, qo'shimcha barcodes jadvalidan qidirish
    if not product:
        bc_stmt = (
            select(BarcodeItem)
            .options(
                selectinload(BarcodeItem.product).selectinload(Product.category),
                selectinload(BarcodeItem.product).selectinload(Product.barcodes)
            )
            .where(BarcodeItem.barcode_value == clean_barcode)
        )
        bc_result = await db.execute(bc_stmt)
        bc_item = bc_result.scalar_one_or_none()
        if bc_item:
            product = bc_item.product
            barcode_type = bc_item.barcode_type

    elapsed_ms = (time.time() - start_time) * 1000

    if not product:
        return BarcodeLookupOut(
            found=False,
            product=None,
            matched_barcode=clean_barcode,
            barcode_type="UNKNOWN",
            lookup_time_ms=round(elapsed_ms, 2)
        )

    product_out = ProductOut(
        id=str(product.id),
        name=product.name,
        sku=product.sku,
        barcode=product.barcode,
        category_id=str(product.category_id) if product.category_id else None,
        category_name=product.category.name if product.category else None,
        brand=product.brand,
        description=product.description,
        purchase_price=product.purchase_price,
        sale_price=product.sale_price,
        tax_rate=product.tax_rate,
        unit=product.unit,
        weight=product.weight,
        current_stock=product.current_stock,
        min_stock=product.min_stock,
        max_stock=product.max_stock,
        is_active=product.is_active,
        is_low_stock=product.current_stock <= product.min_stock,
        barcodes=[
            BarcodeItemOut(
                id=str(b.id),
                barcode_value=b.barcode_value,
                barcode_type=b.barcode_type,
                is_primary=b.is_primary
            ) for b in product.barcodes
        ],
        created_at=product.created_at,
        updated_at=product.updated_at
    )

    return BarcodeLookupOut(
        found=True,
        product=product_out,
        matched_barcode=clean_barcode,
        barcode_type=barcode_type,
        lookup_time_ms=round(elapsed_ms, 2)
    )


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    request: Request,
    current_user: User = Depends(require_permission("product:create")),
    db: AsyncSession = Depends(get_db_session)
):
    """Yangi mahsulot yaratish, shtrix-kod va boshlang'ich qoldiqni kiritish."""
    # Check duplicate SKU
    sku_check = await db.execute(select(Product).where(Product.sku == payload.sku))
    if sku_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ushbu SKU kodi bilan mahsulot allaqachon mavjud")

    # Check duplicate Barcode
    bc_check = await db.execute(select(BarcodeItem).where(BarcodeItem.barcode_value == payload.barcode))
    if bc_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ushbu shtrix-kod allaqachon boshqa mahsulotga biriktirilgan")

    new_prod = Product(
        name=payload.name,
        sku=payload.sku,
        barcode=payload.barcode,
        category_id=payload.category_id,
        brand=payload.brand,
        description=payload.description,
        purchase_price=payload.purchase_price,
        sale_price=payload.sale_price,
        tax_rate=payload.tax_rate,
        unit=payload.unit,
        weight=payload.weight,
        current_stock=payload.initial_stock,
        min_stock=payload.min_stock,
        max_stock=payload.max_stock,
        is_active=payload.is_active
    )
    db.add(new_prod)
    await db.flush()

    # Primary barcode entry
    bc = BarcodeItem(
        product_id=new_prod.id,
        barcode_value=payload.barcode,
        barcode_type="EAN_13" if len(payload.barcode) == 13 else "CODE_128",
        is_primary=True
    )
    db.add(bc)

    # Initial stock movement if > 0
    if payload.initial_stock > Decimal("0.000"):
        movement = InventoryMovement(
            product_id=new_prod.id,
            movement_type="STOCK_IN",
            quantity=payload.initial_stock,
            unit_cost=payload.purchase_price,
            previous_stock=Decimal("0.000"),
            new_stock=payload.initial_stock,
            reason="Boshlang'ich ombor qoldig'i",
            user_id=current_user.id
        )
        db.add(movement)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="PRODUCT_CREATED",
        entity_type="PRODUCT",
        entity_id=str(new_prod.id),
        new_value={"name": new_prod.name, "sku": new_prod.sku, "price": str(new_prod.sale_price)},
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_prod)

    return await lookup_by_barcode(new_prod.barcode, current_user, db).then(lambda r: r.product) if False else ProductOut(
        id=str(new_prod.id),
        name=new_prod.name,
        sku=new_prod.sku,
        barcode=new_prod.barcode,
        category_id=str(new_prod.category_id) if new_prod.category_id else None,
        brand=new_prod.brand,
        description=new_prod.description,
        purchase_price=new_prod.purchase_price,
        sale_price=new_prod.sale_price,
        tax_rate=new_prod.tax_rate,
        unit=new_prod.unit,
        weight=new_prod.weight,
        current_stock=new_prod.current_stock,
        min_stock=new_prod.min_stock,
        max_stock=new_prod.max_stock,
        is_active=new_prod.is_active,
        is_low_stock=new_prod.current_stock <= new_prod.min_stock,
        created_at=new_prod.created_at,
        updated_at=new_prod.updated_at
    )


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    request: Request,
    current_user: User = Depends(require_permission("product:update")),
    db: AsyncSession = Depends(get_db_session)
):
    """Mahsulot parametrlarini va narxini yangilash."""
    stmt = select(Product).options(selectinload(Product.category), selectinload(Product.barcodes)).where(Product.id == product_id)
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    old_price = str(product.sale_price)

    if payload.name is not None: product.name = payload.name
    if payload.category_id is not None: product.category_id = payload.category_id
    if payload.brand is not None: product.brand = payload.brand
    if payload.description is not None: product.description = payload.description
    if payload.purchase_price is not None: product.purchase_price = payload.purchase_price
    if payload.sale_price is not None: product.sale_price = payload.sale_price
    if payload.tax_rate is not None: product.tax_rate = payload.tax_rate
    if payload.unit is not None: product.unit = payload.unit
    if payload.weight is not None: product.weight = payload.weight
    if payload.min_stock is not None: product.min_stock = payload.min_stock
    if payload.max_stock is not None: product.max_stock = payload.max_stock
    if payload.is_active is not None: product.is_active = payload.is_active

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="PRODUCT_UPDATED",
        entity_type="PRODUCT",
        entity_id=str(product.id),
        old_value={"sale_price": old_price},
        new_value={"sale_price": str(product.sale_price)},
        ip_address=request.client.host if request.client else "unknown"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(product)

    return ProductOut(
        id=str(product.id),
        name=product.name,
        sku=product.sku,
        barcode=product.barcode,
        category_id=str(product.category_id) if product.category_id else None,
        category_name=product.category.name if product.category else None,
        brand=product.brand,
        description=product.description,
        purchase_price=product.purchase_price,
        sale_price=product.sale_price,
        tax_rate=product.tax_rate,
        unit=product.unit,
        weight=product.weight,
        current_stock=product.current_stock,
        min_stock=product.min_stock,
        max_stock=product.max_stock,
        is_active=product.is_active,
        is_low_stock=product.current_stock <= product.min_stock,
        created_at=product.created_at,
        updated_at=product.updated_at
    )
