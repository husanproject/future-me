from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    parent_id: Optional[str] = None
    icon: Optional[str] = "package"
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: str
    created_at: datetime
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True


class BarcodeItemCreate(BaseModel):
    barcode_value: str = Field(..., min_length=3, max_length=100)
    barcode_type: str = "EAN_13"
    is_primary: bool = False

class BarcodeItemOut(BaseModel):
    id: str
    barcode_value: str
    barcode_type: str
    is_primary: bool

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    sku: str = Field(..., min_length=2, max_length=100)
    barcode: str = Field(..., min_length=3, max_length=100)
    category_id: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    purchase_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    sale_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(default=Decimal("12.00"), ge=0, le=100)
    unit: str = "dona" # dona, kg, g, litr, ml, quti
    weight: Optional[Decimal] = Decimal("0.000")
    min_stock: Decimal = Decimal("10.000")
    max_stock: Decimal = Decimal("500.000")
    is_active: bool = True

class ProductCreate(ProductBase):
    initial_stock: Decimal = Decimal("0.000")

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    unit: Optional[str] = None
    weight: Optional[Decimal] = None
    min_stock: Optional[Decimal] = None
    max_stock: Optional[Decimal] = None
    is_active: Optional[bool] = None

class ProductOut(ProductBase):
    id: str
    current_stock: Decimal
    category_name: Optional[str] = None
    is_low_stock: bool = False
    barcodes: List[BarcodeItemOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BarcodeLookupOut(BaseModel):
    found: bool
    product: Optional[ProductOut] = None
    matched_barcode: str
    barcode_type: str
    lookup_time_ms: float


class InventoryMovementCreate(BaseModel):
    product_id: str
    movement_type: str # STOCK_IN, STOCK_OUT, ADJUSTMENT, DAMAGED, EXPIRED
    quantity: Decimal = Field(..., description="O'zgarish miqdori")
    reason: Optional[str] = None
    reference_id: Optional[str] = None

class InventoryMovementOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    movement_type: str
    quantity: Decimal
    previous_stock: Decimal
    new_stock: Decimal
    reason: Optional[str] = None
    reference_id: Optional[str] = None
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
