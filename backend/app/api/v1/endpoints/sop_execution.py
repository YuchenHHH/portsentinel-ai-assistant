import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.api.v1.schemas.sop_execution import (
    ExecutionRequest, ExecutionResponse, ApprovalRequest, 
    ApprovalResponse, ExecutionStatus
)
from app.services.sop_execution_service import SOPExecutionService

router = APIRouter()

# 依赖注入：获取 SOP 执行服务
def get_sop_execution_service() -> SOPExecutionService:
    return SOPExecutionService()

@router.post("/execute", response_model=ExecutionResponse)
async def execute_sop_plan(
    request: ExecutionRequest,
    service: SOPExecutionService = Depends(get_sop_execution_service)
):
    """
    开始执行 SOP 计划
    """
    try:
        logging.info(f"收到 SOP 执行请求，计划包含 {len(request.plan)} 个步骤")
        
        result = await service.start_plan_execution(
            plan=request.plan,
            incident_context=request.incident_context
        )
        
        logging.info(f"SOP 执行开始，状态: {result.status}, 步骤: {result.step}")
        return result
        
    except Exception as e:
        logging.error(f"SOP 执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"SOP 执行失败: {str(e)}")

@router.post("/approve", response_model=ApprovalResponse)
async def approve_execution(
    request: ApprovalRequest,
    service: SOPExecutionService = Depends(get_sop_execution_service)
):
    """
    人工批准 SOP 执行
    """
    try:
        logging.info(f"收到批准请求，令牌: {request.state_token}, 批准: {request.approved}")
        
        if not request.approved:
            return ApprovalResponse(
                success=False,
                message="执行被拒绝",
                execution_result=None
            )
        
        result = await service.resume_plan_execution(
            state_token=request.state_token,
            approved_query=request.approved_query
        )
        
        logging.info(f"批准后执行结果，状态: {result.status}")
        return ApprovalResponse(
            success=True,
            message="批准成功，执行已恢复",
            execution_result=ExecutionResponse(
                status=result.status,
                step=result.step,
                step_description=result.step_description,
                tool_output=result.tool_output,
                state_token=result.state_token,
                message=result.message
            )
        )
        
    except Exception as e:
        logging.error(f"批准执行失败: {e}")
        raise HTTPException(status_code=500, detail=f"批准执行失败: {str(e)}")

@router.get("/status/{state_token}", response_model=ExecutionStatus)
async def get_execution_status(
    state_token: str,
    service: SOPExecutionService = Depends(get_sop_execution_service)
):
    """
    获取执行状态
    """
    try:
        # 从状态缓存中获取状态信息
        state = service.state_cache.get(state_token)
        if not state:
            raise HTTPException(status_code=404, detail="执行状态未找到")
        
        return ExecutionStatus(
            state_token=state_token,
            status="needs_approval" if state.current_step_index < len(state.plan) else "completed",
            step=state.current_step_index,
            total_steps=len(state.plan),
            created_at=datetime.now(),  # 在实际应用中应该从状态中获取
            last_updated=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"获取执行状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取执行状态失败: {str(e)}")

@router.get("/health")
async def health_check():
    """
    健康检查
    """
    return {
        "status": "healthy",
        "service": "SOP Execution API",
        "version": "1.0.0"
    }
