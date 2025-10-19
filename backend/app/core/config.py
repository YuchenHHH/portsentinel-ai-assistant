import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用基础配置
    app_name: str = "PortSentinel AI Assistant"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API配置
    api_v1_prefix: str = "/api/v1"
    
    # CORS配置
    cors_origins: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    # 日志配置
    log_level: str = "INFO"
    
    # AI模块配置
    incident_parser_module_path: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# 创建全局配置实例
settings = Settings()
