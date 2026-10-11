from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db_session
from backend.app.models.user import User
from backend.app.models.product import Category, Product
from backend.app.schemas.product import CategoryCreate, CategoryOut
from backend.app.api.deps import require_permission, get_current_user

router = APIRouter()

@router.get("", response_model=List[CategoryOut])
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Barcha mahsulot toifalari / kategoriyalarini olish."""
    stmt = select(Category).order_by(Category.name.asc())
    result = await db.execute(stmt)
    categories = result.scalars().all()

    output = []
    for cat in categories:
        # Count products in category
        count_stmt = select(func.count(Product.id)).where(Product.category_id == cat.id)
        count_res = await db.execute(count_stmt)
        p_count = count_res.scalar() or 0

        output.append(
            CategoryOut(
                id=str(cat.id),
                name=cat.name,
                parent_id=str(cat.parent_id) if cat.parent_id else None,
                icon=cat.icon,
                description=cat.description,
                product_count=p_count,
                created_at=cat.created_at
            )
        )
    return output


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_permission("category:manage")),
    db: AsyncSession = Depends(get_db_session)
):
    """Yangi toifa / kategoriya qo'shish."""
    new_cat = Category(
        name=payload.name,
        parent_id=payload.parent_id,
        icon=payload.icon,
        description=payload.description
    )
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)

    return CategoryOut(
        id=str(new_cat.id),
        name=new_cat.name,
        parent_id=str(new_cat.parent_id) if new_cat.parent_id else None,
        icon=new_cat.icon,
        description=new_cat.description,
        product_count=0,
        created_at=new_cat.created_at
    )
