from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    company_name: Optional[str] = None
    phone: str = Field(..., pattern=r"^\+998[0-9]{9}$")
    email: Optional[str] = None
    contact_person: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BatchBase(BaseModel):
    product_id: str
    batch_number: str = Field(..., min_length=2, max_length=100)
    supplier_id: Optional[str] = None
    purchase_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    initial_quantity: Decimal = Field(..., gt=0)
    manufacture_date: date
    expiry_date: date

class BatchCreate(BatchBase):
    pass

class BatchOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    batch_number: str
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    purchase_price: Decimal
    initial_quantity: Decimal
    current_quantity: Decimal
    manufacture_date: date
    expiry_date: date
    days_to_expiry: int
    expiry_tier: str # CRITICAL, RED, ORANGE, YELLOW, GREEN
    status: str
    is_expired: bool
    is_recalled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BatchFEFODispatchItem(BaseModel):
    batch_id: str
    batch_number: str
    expiry_date: date
    days_to_expiry: int
    allocated_quantity: Decimal
    available_in_batch: Decimal
    is_expired: bool
    fefo_priority_rank: int


class ExpiryAlertOut(BaseModel):
    batch_id: str
    product_id: str
    product_name: str
    barcode: str
    batch_number: str
    current_quantity: Decimal
    unit: str
    expiry_date: date
    days_left: int
    tier: str # CRITICAL, RED, ORANGE, YELLOW, GREEN
    ai_recommendation_summary: Optional[str] = None


class ExpiryOverrideCreate(BaseModel):
    batch_id: str
    reason: str = Field(..., min_length=5, description="Override sababi ko'rsatilishi shart")
    approved_discount_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    valid_hours: int = Field(default=24, ge=1, le=72)

class ExpiryOverrideOut(BaseModel):
    id: str
    batch_id: str
    product_id: str
    admin_id: str
    admin_username: Optional[str] = None
    reason: str
    approved_discount_percent: Decimal
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AIExpiryRecommendationOut(BaseModel):
    batch_id: str
    product_name: str
    tier: str
    days_remaining: int
    current_stock: float
    daily_velocity: float
    natural_expected_sales: float
    expected_waste_without_discount: float
    recommended_discount_percent: int
    clearance_probability: float
    action_title: str
    ai_insight_uz: str
    discounted_price: float
    projected_revenue_uzs: float
    potential_waste_loss_uzs: float
    requires_admin_approval: bool
