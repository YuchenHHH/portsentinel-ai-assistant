"""
Orchestrator API Endpoints

提供 SOP 执行计划生成的 API 接口。
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.api.v1.schemas.orchestrator import PlanRequest, PlanResponse, PlanError
from app.services.orchestrator_service import OrchestratorService
from app.core.exceptions import OrchestratorError, ConfigurationError

logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter()

# 全局服务实例（在实际应用中，建议使用依赖注入容器）
_orchestrator_service = None


def get_orchestrator_service() -> OrchestratorService:
    """
    获取 OrchestratorService 实例
    
    Returns:
        OrchestratorService: 服务实例
    """
    global _orchestrator_service
    if _orchestrator_service is None:
        try:
            _orchestrator_service = OrchestratorService()
            logger.info("OrchestratorService instance created")
        except Exception as e:
            logger.error(f"Failed to create OrchestratorService: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initialize Orchestrator service: {str(e)}"
            )
    return _orchestrator_service


@router.post(
    "/plan",
    response_model=PlanResponse,
    summary="生成执行计划",
    description="基于事件上下文和 SOP 响应生成详细的执行计划",
    responses={
        200: {
            "description": "执行计划生成成功",
            "model": PlanResponse
        },
        400: {
            "description": "请求参数无效",
            "model": PlanError
        },
        500: {
            "description": "内部服务器错误",
            "model": PlanError
        }
    }
)
async def create_execution_plan(
    request: PlanRequest,
    service: OrchestratorService = Depends(get_orchestrator_service)
) -> PlanResponse:
    """
    生成执行计划
    
    Args:
        request: 计划请求对象，包含事件上下文和 SOP 响应
        service: OrchestratorService 实例
        
    Returns:
        PlanResponse: 包含执行计划的响应对象
        
    Raises:
        HTTPException: 当请求处理失败时
    """
    try:
        logger.info(f"Received plan request for incident: {request.incident_context.incident_id}")
        
        # 验证请求数据
        if not request.incident_context.incident_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="incident_id is required"
            )
        
        if not request.sop_response.resolution:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SOP resolution is required"
            )
        
        # 调用服务层生成计划
        result = await service.create_plan(request)
        
        # 检查结果
        if not result.success:
            logger.warning(f"Plan generation failed for incident {request.incident_context.incident_id}: {result.message}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=result.message
            )
        
        logger.info(f"Successfully generated plan for incident {request.incident_context.incident_id} with {len(result.plan)} steps")
        return result
        
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in create_execution_plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post(
    "/plan/fallback",
    response_model=PlanResponse,
    summary="生成降级执行计划",
    description="生成带有降级处理的执行计划，即使主要计划生成失败也会返回基本计划",
    responses={
        200: {
            "description": "执行计划生成成功（可能为降级计划）",
            "model": PlanResponse
        },
        400: {
            "description": "请求参数无效",
            "model": PlanError
        },
        500: {
            "description": "内部服务器错误",
            "model": PlanError
        }
    }
)
async def create_execution_plan_with_fallback(
    request: PlanRequest,
    service: OrchestratorService = Depends(get_orchestrator_service)
) -> PlanResponse:
    """
    生成降级执行计划
    
    Args:
        request: 计划请求对象，包含事件上下文和 SOP 响应
        service: OrchestratorService 实例
        
    Returns:
        PlanResponse: 包含执行计划的响应对象（可能为降级计划）
        
    Raises:
        HTTPException: 当请求处理失败时
    """
    try:
        logger.info(f"Received fallback plan request for incident: {request.incident_context.incident_id}")
        
        # 验证请求数据
        if not request.incident_context.incident_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="incident_id is required"
            )
        
        # 调用服务层生成降级计划
        result = await service.create_plan_with_fallback(request)
        
        # 检查结果
        if not result.success:
            logger.error(f"Fallback plan generation failed for incident {request.incident_context.incident_id}: {result.message}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.message
            )
        
        logger.info(f"Successfully generated fallback plan for incident {request.incident_context.incident_id} with {len(result.plan)} steps")
        return result
        
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in create_execution_plan_with_fallback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/health",
    summary="健康检查",
    description="检查 Orchestrator 服务的健康状态",
    response_model=Dict[str, Any]
)
async def health_check(
    service: OrchestratorService = Depends(get_orchestrator_service)
) -> Dict[str, Any]:
    """
    健康检查端点
    
    Args:
        service: OrchestratorService 实例
        
    Returns:
        Dict[str, Any]: 健康状态信息
    """
    try:
        health_info = service.health_check()
        
        if not health_info.get("planner_initialized", False):
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    **health_info,
                    "status": "unhealthy"
                }
            )
        
        return health_info
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "service": "OrchestratorService"
            }
        )


@router.get(
    "/",
    summary="API 信息",
    description="获取 Orchestrator API 的基本信息",
    response_model=Dict[str, Any]
)
async def api_info() -> Dict[str, Any]:
    """
    API 信息端点
    
    Returns:
        Dict[str, Any]: API 基本信息
    """
    return {
        "name": "Orchestrator API",
        "version": "1.0.0",
        "description": "SOP Execution Plan Generation API",
        "endpoints": {
            "create_plan": "POST /plan",
            "create_fallback_plan": "POST /plan/fallback",
            "health_check": "GET /health"
        }
    }
