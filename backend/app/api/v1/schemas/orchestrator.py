"""
Orchestrator API Schemas

定义 Orchestrator API 的请求和响应数据模型。
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .incident_parser import IncidentReport
from .rag import EnrichmentResponse


class ParsedIncident(BaseModel):
    """解析后的事件数据结构"""
    incident_id: Optional[str] = Field(None, description="事件ID")
    problem_summary: str = Field(..., description="问题摘要")
    affected_module: str = Field(..., description="受影响的模块")
    error_code: Optional[str] = Field(None, description="错误代码")
    urgency: str = Field(..., description="紧急程度")
    entities: List[Dict[str, Any]] = Field(default_factory=list, description="实体信息")
    raw_text: Optional[str] = Field(None, description="原始文本")
    
    class Config:
        """Pydantic 配置"""
        json_encoders = {
            # 可以添加自定义编码器
        }


class SOPResponse(BaseModel):
    """SOP 响应数据结构"""
    incident_id: Optional[str] = Field(None, description="事件ID")
    problem_summary: str = Field(..., description="问题摘要")
    affected_module: Optional[str] = Field(None, description="受影响的模块")
    error_code: Optional[str] = Field(None, description="错误代码")
    urgency: str = Field(..., description="紧急程度")
    retrieved_sops: List[Dict[str, Any]] = Field(default_factory=list, description="检索到的SOP列表")
    
    class Config:
        """Pydantic 配置"""
        json_encoders = {
            # 可以添加自定义编码器
        }


class PlanRequest(BaseModel):
    """执行计划请求"""
    incident_context: ParsedIncident = Field(..., description="解析后的事件上下文")
    sop_response: SOPResponse = Field(..., description="SOP 响应数据")
    
    class Config:
        """Pydantic 配置"""
        json_schema_extra = {
            "example": {
                "incident_context": {
                    "incident_id": "ALR-861600",
                    "problem_summary": "Customer on PORTNET is seeing duplicate information for container CMAU0000020",
                    "affected_module": "Container",
                    "error_code": None,
                    "urgency": "Medium",
                    "entities": {
                        "container_number": "CMAU0000020",
                        "user_id": "customer@example.com"
                    },
                    "raw_text": "RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received"
                },
                "sop_response": {
                    "title": "CNTR: Duplicate Container information received",
                    "module": "Container Report",
                    "resolution": "1. Check for container range overlap...",
                    "overview": "Resolve duplicate container information issue",
                    "preconditions": None,
                    "verification": "1. Run the end-to-end journey again...",
                    "sop_snippets": []
                }
            }
        }


class PlanResponse(BaseModel):
    """执行计划响应"""
    plan: List[str] = Field(..., description="执行计划步骤列表")
    success: bool = Field(True, description="计划生成是否成功")
    message: Optional[str] = Field(None, description="附加信息或错误消息")
    
    class Config:
        """Pydantic 配置"""
        json_schema_extra = {
            "example": {
                "plan": [
                    "Query the container range table in the MySQL database to identify all container ranges that include or overlap with container number CMAU0000020",
                    "Extract and analyze the serial number ranges from the query results to detect any overlapping ranges",
                    "Verify if the overlapping container range is visible or registered in the system",
                    "Apply the appropriate fix to resolve the overlapping container range issue in the production environment"
                ],
                "success": True,
                "message": "Execution plan generated successfully"
            }
        }


class PlanError(BaseModel):
    """计划生成错误响应"""
    success: bool = Field(False, description="计划生成失败")
    error: str = Field(..., description="错误消息")
    details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    
    class Config:
        """Pydantic 配置"""
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Failed to generate execution plan",
                "details": {
                    "error_type": "ValidationError",
                    "error_code": "INVALID_INPUT"
                }
            }
        }
