import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, ForeignKey,
    Text, Numeric, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, index=True)
    company_name = Column(String(200), nullable=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    contact_person = Column(String(150), nullable=True)
    tax_id = Column(String(50), nullable=True) # INN
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    batches = relationship("Batch", back_populates="supplier")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    batch_number = Column(String(100), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    purchase_price = Column(Numeric(14, 2), nullable=False, default=0.00)
    initial_quantity = Column(Numeric(12, 3), nullable=False)
    current_quantity = Column(Numeric(12, 3), nullable=False)
    manufacture_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False, index=True) # Sorted for FEFO
    status = Column(String(30), nullable=False, default="ACTIVE", index=True) # ACTIVE, DEPLETED, EXPIRED, QUARANTINE
    is_recalled = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    product = relationship("Product")
    supplier = relationship("Supplier", back_populates="batches")
    overrides = relationship("ExpiryOverride", back_populates="batch", cascade="all, delete-orphan")


class ExpiryOverride(Base):
    __tablename__ = "expiry_overrides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reason = Column(Text, nullable=False)
    approved_discount_percent = Column(Numeric(5, 2), nullable=False, default=0.00)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    batch = relationship("Batch", back_populates="overrides")
    admin = relationship("User")
