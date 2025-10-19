from pydantic import BaseModel, Field
from typing import Optional

class DatabaseConfigRequest(BaseModel):
    """数据库配置请求"""
    host: str = Field(default="localhost", description="数据库主机")
    user: str = Field(default="root", description="数据库用户名")
    password: str = Field(..., description="数据库密码")
    database: str = Field(default="appdb", description="数据库名称")
    port: int = Field(default=3306, description="数据库端口")

class DatabaseConfigResponse(BaseModel):
    """数据库配置响应"""
    success: bool = Field(..., description="连接是否成功")
    message: str = Field(..., description="响应消息")
    database_info: Optional[dict] = Field(None, description="数据库信息")

class DatabaseTestRequest(BaseModel):
    """数据库连接测试请求"""
    host: str = Field(default="localhost", description="数据库主机")
    user: str = Field(default="root", description="数据库用户名")
    password: str = Field(..., description="数据库密码")
    database: str = Field(default="appdb", description="数据库名称")
    port: int = Field(default=3306, description="数据库端口")



