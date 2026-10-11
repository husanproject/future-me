import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey,
    Text, Numeric, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    icon = Column(String(50), default="package")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), nullable=False, index=True) # Primary barcode
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=True, index=True)
    brand = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    purchase_price = Column(Numeric(14, 2), nullable=False, default=0.00)
    sale_price = Column(Numeric(14, 2), nullable=False, default=0.00)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=12.00) # 12% QQS
    unit = Column(String(20), nullable=False, default="dona") # dona, kg, g, litr, ml, quti
    weight = Column(Numeric(10, 3), default=0.000)
    current_stock = Column(Numeric(12, 3), nullable=False, default=0.000, index=True)
    min_stock = Column(Numeric(12, 3), nullable=False, default=10.000)
    max_stock = Column(Numeric(12, 3), nullable=False, default=500.000)
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("Category", back_populates="products")
    barcodes = relationship("BarcodeItem", back_populates="product", cascade="all, delete-orphan")
    movements = relationship("InventoryMovement", back_populates="product")


class BarcodeItem(Base):
    __tablename__ = "barcodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    barcode_value = Column(String(100), unique=True, nullable=False, index=True)
    barcode_type = Column(String(30), nullable=False, default="EAN_13") # EAN_13, EAN_8, CODE_128, QR, INTERNAL
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="barcodes")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    movement_type = Column(String(30), nullable=False, index=True) # STOCK_IN, STOCK_OUT, ADJUSTMENT, DAMAGED, EXPIRED, SALE, RETURN
    quantity = Column(Numeric(12, 3), nullable=False)
    unit_cost = Column(Numeric(14, 2), nullable=False, default=0.00)
    previous_stock = Column(Numeric(12, 3), nullable=False)
    new_stock = Column(Numeric(12, 3), nullable=False)
    reference_id = Column(String(100), nullable=True) # Invoice / Order number
    reason = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    product = relationship("Product", back_populates="movements")
