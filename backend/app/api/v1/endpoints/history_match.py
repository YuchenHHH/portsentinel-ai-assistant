"""
历史案例匹配API端点

提供历史案例匹配功能的REST API接口。
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging

from app.api.v1.schemas.history_match import HistoryMatchRequest, HistoryMatchResponse
from app.services.history_match_service import get_history_service, HistoryMatchService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/history/match",
    response_model=HistoryMatchResponse,
    summary="查找相似的历史案例",
    description="根据当前事件信息查找相似的历史案例，使用多层级匹配算法"
)
async def find_similar_historical_cases(
    request: HistoryMatchRequest,
    history_service: HistoryMatchService = Depends(get_history_service)
) -> HistoryMatchResponse:
    """
    查找相似的历史案例
    
    这个端点实现了完整的历史案例匹配工作流程：
    1. 模块过滤 - 根据affected_module进行初步筛选
    2. 向量相似度计算 - 使用problem_summary与历史案例的problem_statement进行余弦相似度匹配
    3. 综合重排 - 结合相似度(70%)、实体重合(20%)、模块匹配(10%)进行综合评分
    4. GPT验证 - 使用GPT-4.1-mini对Top 3候选案例进行验证
    
    Args:
        request: 历史案例匹配请求，包含事件信息
        history_service: 历史案例匹配服务实例
        
    Returns:
        HistoryMatchResponse: 包含匹配结果和统计信息
        
    Raises:
        HTTPException: 如果匹配失败或服务不可用
    """
    try:
        logger.info(f"Processing history match request for incident: {request.incident_id}")
        
        # 执行历史案例匹配
        response = history_service.find_similar_cases(request)
        
        logger.info(f"History match completed: {response.gpt_validated_count} similar cases found")
        return response
        
    except Exception as e:
        logger.error(f"Unexpected error in history match: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "内部服务器错误",
                "message": "历史案例匹配过程中发生未知错误",
                "error_code": "INTERNAL_ERROR"
            }
        )


@router.get(
    "/history/stats",
    summary="获取历史案例匹配服务统计信息",
    description="获取历史案例数据库和匹配服务的统计信息"
)
async def get_history_stats(
    history_service: HistoryMatchService = Depends(get_history_service)
) -> Dict[str, Any]:
    """
    获取历史案例匹配服务统计信息
    
    Returns:
        Dict[str, Any]: 包含服务状态、数据库统计等信息
    """
    try:
        stats = history_service.get_stats()
        return {
            "status": "healthy",
            "service": "History Case Matcher",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get history stats: {e}")
        return {
            "status": "unhealthy",
            "service": "History Case Matcher",
            "error": str(e)
        }


@router.post(
    "/history/rebuild-index",
    summary="重建历史案例向量索引",
    description="重新构建历史案例的向量索引，用于更新数据或修复索引问题"
)
async def rebuild_history_index(
    history_service: HistoryMatchService = Depends(get_history_service)
) -> Dict[str, str]:
    """
    重建历史案例向量索引
    
    Returns:
        Dict[str, str]: 重建结果信息
    """
    try:
        history_service.rebuild_index()
        return {
            "status": "success",
            "message": "历史案例向量索引重建成功"
        }
        
    except Exception as e:
        logger.error(f"Failed to rebuild history index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "索引重建失败",
                "message": str(e)
            }
        )


@router.get(
    "/history/health",
    summary="历史案例匹配服务健康检查",
    description="检查历史案例匹配服务的健康状态"
)
async def history_health_check(
    history_service: HistoryMatchService = Depends(get_history_service)
) -> Dict[str, Any]:
    """
    历史案例匹配服务健康检查
    
    Returns:
        Dict[str, Any]: 健康状态信息
    """
    try:
        stats = history_service.get_stats()
        
        # 检查各个组件状态
        vector_store_healthy = "error" not in stats.get("vector_store", {})
        
        return {
            "status": "healthy" if vector_store_healthy else "unhealthy",
            "service": "History Case Matcher",
            "components": {
                "vector_store": "healthy" if vector_store_healthy else "unhealthy",
                "similarity_service": "healthy",
                "gpt_validator": "healthy"
            },
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "History Case Matcher",
            "error": str(e)
        }
