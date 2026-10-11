"""batch expiry and fefo schema

Revision ID: 003_batch_expiry_fefo_schema
Revises: 002_products_and_inventory_schema
Create Date: 2026-10-09 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '003_batch_expiry_fefo_schema'
down_revision: Union[str, None] = '002_products_and_inventory_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. suppliers
    op.create_table(
        'suppliers',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('contact_person', sa.String(length=150), nullable=True),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_suppliers_name'), 'suppliers', ['name'], unique=False)
    op.create_index(op.f('ix_suppliers_phone'), 'suppliers', ['phone'], unique=False)

    # 2. batches
    op.create_table(
        'batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('batch_number', sa.String(length=100), nullable=False),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('purchase_price', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('initial_quantity', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('current_quantity', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('manufacture_date', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='ACTIVE', nullable=False),
        sa.Column('is_recalled', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_batches_expiry_date'), 'batches', ['expiry_date'], unique=False)
    op.create_index(op.f('ix_batches_product_id'), 'batches', ['product_id'], unique=False)
    op.create_index(op.f('ix_batches_status'), 'batches', ['status'], unique=False)

    # 3. expiry_overrides
    op.create_table(
        'expiry_overrides',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('batch_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('admin_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('approved_discount_percent', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expiry_overrides_batch_id'), 'expiry_overrides', ['batch_id'], unique=False)

def downgrade() -> None:
    op.drop_table('expiry_overrides')
    op.drop_table('batches')
    op.drop_table('suppliers')
