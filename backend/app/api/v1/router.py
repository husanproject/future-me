from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth, users, roles, permissions, audit, health,
    products, categories, inventory, batches,
    sales, customers, shifts, ai_analytics
)

api_router = APIRouter()

# Phase 1 Routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users Management"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles & RBAC"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions Catalog"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["Audit & Security"])

# Phase 2 Routers
api_router.include_router(products.router, prefix="/products", tags=["Products & Barcodes"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory Management"])

# Phase 3 Routers
api_router.include_router(batches.router, prefix="/batches", tags=["Batches, Expiry & FEFO"])

# Phase 4 & 5 & 6 Routers: POS, Customers, Shifts, AI Analytics
api_router.include_router(sales.router, prefix="/sales", tags=["POS Sales & Receipts"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers & Loyalty"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["Cashier Shifts & Z-Reports"])
api_router.include_router(ai_analytics.router, prefix="/ai", tags=["AI Forecasting & Security"])
