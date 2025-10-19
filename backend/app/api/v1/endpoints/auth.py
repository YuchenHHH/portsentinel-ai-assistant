"""
认证API端点
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.api.v1.schemas.auth import UserCreate, UserLogin, AuthResponse, UserResponse
from app.services.auth_service import auth_service

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """获取当前用户"""
    token = credentials.credentials
    user = auth_service.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/register", response_model=AuthResponse, summary="用户注册")
async def register(user_data: UserCreate):
    """
    用户注册
    
    - **email**: 用户邮箱
    - **password**: 密码（至少6位）
    - **name**: 用户姓名
    """
    try:
        return auth_service.register_user(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败"
        )

@router.post("/login", response_model=AuthResponse, summary="用户登录")
async def login(credentials: UserLogin):
    """
    用户登录
    
    - **email**: 用户邮箱
    - **password**: 密码
    """
    try:
        return auth_service.login_user(credentials.email, credentials.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登录失败"
        )

@router.post("/logout", summary="用户登出")
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """
    用户登出
    """
    # 这里可以添加令牌失效逻辑
    return {"message": "登出成功"}

@router.get("/verify", response_model=UserResponse, summary="验证令牌")
async def verify_token(current_user: UserResponse = Depends(get_current_user)):
    """
    验证访问令牌并返回用户信息
    """
    return current_user

@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """
    获取当前登录用户的信息
    """
    return current_user
