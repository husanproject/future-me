from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User

router = APIRouter()

class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    card_number: Optional[str] = None
    bonus_balance: float = 0.0
    discount_tier_percent: float = 1.0
    notes: Optional[str] = None

@router.get("/")
async def list_customers(
    search: Optional[str] = None,
    current_user: User = Depends(require_permission("customer:read"))
):
    """Mijozlar va sodiqlik dasturi a‘zolari ro‘yxati."""
    return {
        "status": "success",
        "total": 4,
        "items": [
            {
                "id": "cust-01",
                "full_name": "Anvar Karimov",
                "phone": "+998 90 123 45 67",
                "bonus_balance": 45000,
                "total_spent": 3450000,
                "discount_tier_percent": 3.0
            }
        ]
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    current_user: User = Depends(require_permission("customer:create"))
):
    """Yangi sodiqlik kartasi yoki mijoz profilini ro‘yxatga olish."""
    return {
        "status": "success",
        "message": "Mijoz muvaffaqiyatli saqlandi",
        "customer": {
            "id": "cust-new",
            "full_name": payload.full_name,
            "phone": payload.phone,
            "bonus_balance": payload.bonus_balance
        }
    }
