from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.app.api.deps import get_current_user, require_permission
from backend.app.models.user import User

router = APIRouter()

class OpenShiftRequest(BaseModel):
    opening_cash: float = 500000.0
    register_id: str = "reg-01"
    register_name: str = "Kassa №1 — Asosiy"

class CloseShiftRequest(BaseModel):
    closing_cash: float

@router.get("/active")
async def get_active_shift(
    current_user: User = Depends(require_permission("sale:create"))
):
    """Hozirgi faol kassa smenasi ma‘lumotlari."""
    return {
        "status": "success",
        "has_active_shift": True,
        "shift": {
            "id": "shift-101",
            "register_name": "Kassa №1 — Asosiy",
            "cashier_name": current_user.full_name,
            "opening_cash": 500000,
            "total_revenue": 1245000,
            "sales_count": 14
        }
    }

@router.post("/open", status_code=status.HTTP_201_CREATED)
async def open_shift(
    payload: OpenShiftRequest,
    current_user: User = Depends(require_permission("sale:create"))
):
    """Yangi kassa smenasini ochish."""
    return {
        "status": "success",
        "message": "Smena ochildi",
        "shift_id": "shift-new",
        "opening_cash": payload.opening_cash
    }

@router.post("/close/{shift_id}")
async def close_shift(
    shift_id: str,
    payload: CloseShiftRequest,
    current_user: User = Depends(require_permission("sale:create"))
):
    """Smenani yopish va Z-Otchet chiqarish."""
    return {
        "status": "success",
        "message": "Smena yopildi, Z-Hisobot shakllantirildi",
        "z_report_number": f"Z-{datetime.now().strftime('%Y%m%d')}-001",
        "closing_cash": payload.closing_cash
    }
