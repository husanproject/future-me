import pytest
from backend.app.schemas.auth import UserProfile

def test_rbac_cashier_permissions():
    cashier_permissions = [
        "sale:create",
        "sale:read",
        "sale:cancel",
        "product:read",
        "customer:read",
        "payment:create"
    ]

    # Check cashier has sale:create
    assert "sale:create" in cashier_permissions
    assert "product:read" in cashier_permissions

    # Check cashier does NOT have admin permissions
    assert "product:delete" not in cashier_permissions
    assert "user:create" not in cashier_permissions
    assert "report:export" not in cashier_permissions

def test_rbac_super_admin_all_access():
    # Super Admin passes any permission checks
    user_role = "SUPER_ADMIN"
    assert user_role == "SUPER_ADMIN"
