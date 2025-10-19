from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ExecutionRequest(BaseModel):
    """SOP 执行请求"""
    plan: List[str] = Field(..., description="执行计划步骤列表")
    incident_context: Dict[str, Any] = Field(..., description="事件上下文信息")

class ExecutionResponse(BaseModel):
    """SOP 执行响应"""
    status: str = Field(..., description="执行状态: in_progress, needs_approval, failed, completed")
    step: int = Field(..., description="当前步骤编号")
    step_description: str = Field(..., description="当前步骤描述")
    tool_output: Optional[str] = Field(None, description="工具输出结果")
    state_token: Optional[str] = Field(None, description="状态令牌，用于恢复执行")
    message: Optional[str] = Field(None, description="状态消息")
    agent_thoughts: Optional[str] = Field(None, description="Agent思考过程")
    tool_calls: Optional[str] = Field(None, description="Agent工具调用详情")
    completed_steps: Optional[List[Dict[str, Any]]] = Field(default=[], description="已完成的步骤历史")

class ApprovalRequest(BaseModel):
    """人工批准请求"""
    state_token: str = Field(..., description="状态令牌")
    approved_query: str = Field(..., description="已批准的查询语句")
    approved: bool = Field(True, description="是否批准")

class ApprovalResponse(BaseModel):
    """人工批准响应"""
    success: bool = Field(..., description="批准是否成功")
    message: str = Field(..., description="响应消息")
    execution_result: Optional[ExecutionResponse] = Field(None, description="执行结果")

class ExecutionStatus(BaseModel):
    """执行状态信息"""
    state_token: str = Field(..., description="状态令牌")
    status: str = Field(..., description="当前状态")
    step: int = Field(..., description="当前步骤")
    total_steps: int = Field(..., description="总步骤数")
    created_at: datetime = Field(..., description="创建时间")
    last_updated: datetime = Field(..., description="最后更新时间")



