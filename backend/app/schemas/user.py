from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone: str = Field(..., pattern=r"^\+998[0-9]{9}$", description="+998901234567 formatida")
    full_name: str = Field(..., min_length=2, max_length=150)
    role_id: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Boshlang'ich parol")

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    role_id: Optional[str] = None
    is_active: Optional[bool] = None
    is_locked: Optional[bool] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    phone: str
    full_name: str
    role_id: str
    role_name: Optional[str] = None
    role_display_name_uz: Optional[str] = None
    is_active: bool
    is_locked: bool
    failed_login_attempts: int
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RolePermissionUpdate(BaseModel):
    permission_ids: List[str]
