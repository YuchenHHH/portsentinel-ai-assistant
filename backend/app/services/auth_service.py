"""
认证服务
"""

import os
import hashlib
import secrets
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import json
import logging

from app.api.v1.schemas.auth import UserCreate, UserResponse, AuthResponse

logger = logging.getLogger(__name__)

# 简单的内存存储（生产环境应使用数据库）
USERS_DB: Dict[str, Dict[str, Any]] = {}
TOKENS_DB: Dict[str, Dict[str, Any]] = {}

class AuthService:
    """认证服务类"""
    
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here")
        self.token_expiry_hours = 24
    
    def _hash_password(self, password: str) -> str:
        """哈希密码"""
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{pwd_hash.hex()}"
    
    def _verify_password(self, password: str, hashed_password: str) -> bool:
        """验证密码"""
        try:
            salt, hash_value = hashed_password.split(':')
            pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return pwd_hash.hex() == hash_value
        except:
            return False
    
    def _generate_token(self, user_id: str) -> str:
        """生成访问令牌"""
        payload = {
            'user_id': user_id,
            'exp': int(time.time()) + (self.token_expiry_hours * 3600),
            'iat': int(time.time())
        }
        # 简单的JWT实现（生产环境应使用PyJWT）
        token = secrets.token_urlsafe(32)
        TOKENS_DB[token] = payload
        return token
    
    def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """验证令牌"""
        if token not in TOKENS_DB:
            return None
        
        payload = TOKENS_DB[token]
        if payload['exp'] < int(time.time()):
            # 令牌过期，删除
            del TOKENS_DB[token]
            return None
        
        return payload
    
    def register_user(self, user_data: UserCreate) -> AuthResponse:
        """注册用户"""
        email = user_data.email.lower()
        
        # 检查用户是否已存在
        if email in USERS_DB:
            raise ValueError("用户已存在")
        
        # 创建用户
        user_id = secrets.token_urlsafe(16)
        hashed_password = self._hash_password(user_data.password)
        
        user = {
            'id': user_id,
            'email': email,
            'name': user_data.name,
            'password': hashed_password,
            'created_at': datetime.utcnow().isoformat()
        }
        
        USERS_DB[email] = user
        
        # 生成令牌
        token = self._generate_token(user_id)
        
        logger.info(f"User registered: {email}")
        
        return AuthResponse(
            user=UserResponse(
                id=user_id,
                email=email,
                name=user_data.name,
                created_at=user['created_at']
            ),
            token=token
        )
    
    def login_user(self, email: str, password: str) -> AuthResponse:
        """用户登录"""
        email = email.lower()
        
        if email not in USERS_DB:
            raise ValueError("用户不存在")
        
        user = USERS_DB[email]
        
        if not self._verify_password(password, user['password']):
            raise ValueError("密码错误")
        
        # 生成令牌
        token = self._generate_token(user['id'])
        
        logger.info(f"User logged in: {email}")
        
        return AuthResponse(
            user=UserResponse(
                id=user['id'],
                email=user['email'],
                name=user['name'],
                created_at=user['created_at']
            ),
            token=token
        )
    
    def verify_token(self, token: str) -> Optional[UserResponse]:
        """验证令牌并返回用户信息"""
        payload = self._verify_token(token)
        if not payload:
            return None
        
        user_id = payload['user_id']
        
        # 查找用户
        for user in USERS_DB.values():
            if user['id'] == user_id:
                return UserResponse(
                    id=user['id'],
                    email=user['email'],
                    name=user['name'],
                    created_at=user['created_at']
                )
        
        return None
    
    def logout_user(self, token: str) -> bool:
        """用户登出"""
        if token in TOKENS_DB:
            del TOKENS_DB[token]
            return True
        return False

# 全局认证服务实例
auth_service = AuthService()
