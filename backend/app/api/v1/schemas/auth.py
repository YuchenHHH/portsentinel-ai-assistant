"""
认证相关的Pydantic模型
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """用户注册请求"""
    email: EmailStr = Field(..., description="用户邮箱")
    password: str = Field(..., min_length=6, description="密码，至少6位")
    name: str = Field(..., min_length=1, description="用户姓名")


class UserLogin(BaseModel):
    """用户登录请求"""
    email: EmailStr = Field(..., description="用户邮箱")
    password: str = Field(..., description="密码")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str = Field(..., description="用户ID")
    email: str = Field(..., description="用户邮箱")
    name: str = Field(..., description="用户姓名")
    created_at: str = Field(..., description="创建时间")


class AuthResponse(BaseModel):
    """认证响应"""
    user: UserResponse = Field(..., description="用户信息")
    token: str = Field(..., description="访问令牌")


class TokenVerify(BaseModel):
    """令牌验证响应"""
    valid: bool = Field(..., description="令牌是否有效")
    user: Optional[UserResponse] = Field(None, description="用户信息（如果令牌有效）")
