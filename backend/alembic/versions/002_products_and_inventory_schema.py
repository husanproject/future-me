"""products and inventory schema

Revision ID: 002_products_and_inventory_schema
Revises: 001_initial_rbac_and_auth_schema
Create Date: 2026-10-09 13:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '002_products_and_inventory_schema'
down_revision: Union[str, None] = '001_initial_rbac_and_auth_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. categories
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('icon', sa.String(length=50), server_default='package', nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_parent_id'), 'categories', ['parent_id'], unique=False)

    # 2. products
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('barcode', sa.String(length=100), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('brand', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('purchase_price', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('sale_price', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), server_default='12.00', nullable=False),
        sa.Column('unit', sa.String(length=20), server_default='dona', nullable=False),
        sa.Column('weight', sa.Numeric(precision=10, scale=3), server_default='0.000', nullable=True),
        sa.Column('current_stock', sa.Numeric(precision=12, scale=3), server_default='0.000', nullable=False),
        sa.Column('min_stock', sa.Numeric(precision=12, scale=3), server_default='10.000', nullable=False),
        sa.Column('max_stock', sa.Numeric(precision=12, scale=3), server_default='500.000', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_barcode'), 'products', ['barcode'], unique=False)
    op.create_index(op.f('ix_products_category_id'), 'products', ['category_id'], unique=False)
    op.create_index(op.f('ix_products_current_stock'), 'products', ['current_stock'], unique=False)
    op.create_index(op.f('ix_products_is_active'), 'products', ['is_active'], unique=False)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)

    # 3. barcodes
    op.create_table(
        'barcodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('barcode_value', sa.String(length=100), nullable=False),
        sa.Column('barcode_type', sa.String(length=30), server_default='EAN_13', nullable=False),
        sa.Column('is_primary', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_barcodes_barcode_value'), 'barcodes', ['barcode_value'], unique=True)
    op.create_index(op.f('ix_barcodes_product_id'), 'barcodes', ['product_id'], unique=False)

    # 4. inventory_movements
    op.create_table(
        'inventory_movements',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('movement_type', sa.String(length=30), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('unit_cost', sa.Numeric(precision=14, scale=2), server_default='0.00', nullable=False),
        sa.Column('previous_stock', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('new_stock', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_movements_created_at'), 'inventory_movements', ['created_at'], unique=False)
    op.create_index(op.f('ix_inventory_movements_movement_type'), 'inventory_movements', ['movement_type'], unique=False)
    op.create_index(op.f('ix_inventory_movements_product_id'), 'inventory_movements', ['product_id'], unique=False)

def downgrade() -> None:
    op.drop_table('inventory_movements')
    op.drop_table('barcodes')
    op.drop_table('products')
    op.drop_table('categories')
