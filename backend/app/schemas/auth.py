from typing import Optional, List
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(..., description="Foydalanuvchi nomi yoki telefon raqami", example="superadmin")
    password: str = Field(..., description="Foydalanuvchi maxfiy paroli", example="Admin123!")

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserProfile"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PermissionSchema(BaseModel):
    id: str
    module: str
    action: str
    description_uz: str

    class Config:
        from_attributes = True

class RoleSchema(BaseModel):
    id: str
    name: str
    display_name_uz: str
    description: Optional[str] = None
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    phone: str
    full_name: str
    role_id: str
    role_name: str
    role_display_name_uz: str
    permissions: List[str] = []
    is_active: bool

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
