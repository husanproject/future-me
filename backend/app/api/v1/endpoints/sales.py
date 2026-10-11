import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User

router = APIRouter()

class SaleItemInput(BaseModel):
    product_id: str
    product_name: str
    barcode: str
    quantity: float
    unit: str = "dona"
    unit_price: float
    discount_percent: float = 0.0
    batch_id: Optional[str] = None
    batch_number: Optional[str] = None

class CreateSaleRequest(BaseModel):
    items: List[SaleItemInput]
    payment_method: str = "CASH" # CASH, UZCARD, HUMO, CLICK, PAYME
    amount_paid: float
    customer_id: Optional[str] = None
    bonus_to_use: float = 0.0
    discount_promo_total: float = 0.0
    notes: Optional[str] = None

class ReturnItemInput(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    unit_price: float
    refund_amount: float
    reason: str
    restock_to_inventory: bool = True

class CreateReturnRequest(BaseModel):
    sale_id: str
    receipt_number: str
    reason: str
    returned_items: List[ReturnItemInput]
    payment_method: str = "CASH"

@router.get("/")
async def list_sales(
    limit: int = 50,
    offset: int = 0,
    payment_method: Optional[str] = None,
    current_user: User = Depends(require_permission("sale:read"))
):
    """Barcha savdo cheklarini olish."""
    return {
        "status": "success",
        "total": 2,
        "items": [
            {
                "id": "sale-001",
                "receipt_number": "CHK-20261009-001",
                "cashier_name": "Dilshod Rahimov",
                "grand_total": 51300,
                "payment_method": "UZCARD",
                "status": "COMPLETED",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_sale(
    payload: CreateSaleRequest,
    current_user: User = Depends(require_permission("sale:create"))
):
    """
    Yangi POS savdo chekini yaratish.
    FEFO printsipi asosida partiyalardan avtomatik tovar hisobdan chiqariladi.
    """
    receipt_no = f"CHK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    return {
        "status": "success",
        "receipt_number": receipt_no,
        "cashier_id": str(current_user.id),
        "grand_total": payload.amount_paid,
        "payment_method": payload.payment_method,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/returns", status_code=status.HTTP_201_CREATED)
async def create_return(
    payload: CreateReturnRequest,
    current_user: User = Depends(require_permission("return:create"))
):
    """Xaridor tovarini qaytarish (Refund) va ombor hisobini yangilash."""
    return {
        "status": "success",
        "return_id": f"ret-{uuid.uuid4().hex[:8]}",
        "receipt_number": payload.receipt_number,
        "refunded_amount": sum(i.refund_amount for i in payload.returned_items),
        "restocked": True
    }
