from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    theme: str = "dark"
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=32)


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = Field(default=None, pattern="^(dark|light)$")


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
