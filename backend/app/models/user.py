import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey,
    Text, Numeric, Integer, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True) # e.g. 'SUPER_ADMIN', 'ADMIN'
    name = Column(String(100), nullable=False, unique=True)
    display_name_uz = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles", lazy="selectin")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(100), primary_key=True) # e.g. 'sale:create'
    module = Column(String(50), nullable=False, index=True) # 'sale', 'product', 'inventory'
    action = Column(String(50), nullable=False) # 'create', 'read', 'update'
    description_uz = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(String(100), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True)

    is_active = Column(Boolean, default=True, index=True)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    role = relationship("Role", back_populates="users", lazy="selectin")
    sessions = relationship("CashSession", back_populates="cashier")
    audit_logs = relationship("AuditLog", back_populates="user")


class CashRegister(Base):
    __tablename__ = "cash_registers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    register_code = Column(String(30), unique=True, nullable=False) # e.g. 'KASSA-01'
    name = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sessions = relationship("CashSession", back_populates="register")


class CashSession(Base):
    __tablename__ = "cash_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    register_id = Column(UUID(as_uuid=True), ForeignKey("cash_registers.id", ondelete="RESTRICT"), nullable=False, index=True)
    cashier_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    opening_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closing_time = Column(DateTime(timezone=True), nullable=True)
    opening_cash = Column(Numeric(14, 2), default=0.00, nullable=False)
    closing_cash = Column(Numeric(14, 2), nullable=True)
    expected_cash = Column(Numeric(14, 2), nullable=True)
    difference = Column(Numeric(14, 2), nullable=True)
    status = Column(String(20), default="OPEN", nullable=False, index=True) # OPEN, CLOSED
    notes = Column(Text, nullable=True)

    cashier = relationship("User", back_populates="sessions")
    register = relationship("CashRegister", back_populates="sessions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="audit_logs")
