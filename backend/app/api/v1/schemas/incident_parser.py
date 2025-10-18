from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    """事件解析请求模型"""
    source_type: str = Field(
        ..., 
        description="事件来源类型",
        examples=["email", "log", "manual", "system", "other"]
    )
    raw_text: str = Field(
        ..., 
        description="原始事件报告文本",
        min_length=1,
        max_length=10000
    )

    class Config:
        json_schema_extra = {
            "example": {
                "source_type": "email",
                "raw_text": "系统检测到异常登录尝试，IP地址：192.168.1.100，时间：2024-01-15 14:30:00"
            }
        }


class ParseResponse(BaseModel):
    """事件解析响应模型"""
    success: bool = Field(description="解析是否成功")
    data: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="解析结果数据"
    )
    error: Optional[str] = Field(
        default=None, 
        description="错误信息"
    )
    message: Optional[str] = Field(
        default=None, 
        description="响应消息"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "incident_id": "INC-2024-001",
                    "severity": "medium",
                    "summary": "异常登录尝试",
                    "description": "系统检测到来自IP 192.168.1.100的异常登录尝试",
                    "timestamp": "2024-01-15T14:30:00Z",
                    "source_ip": "192.168.1.100"
                },
                "message": "事件解析成功"
            }
        }
