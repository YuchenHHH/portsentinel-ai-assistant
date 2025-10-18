from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import logging

from api.v1.schemas.incident_parser import ParseRequest, ParseResponse
from services.incident_parser_service import parse_incident

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="解析事件报告",
    description="使用AI技术解析事件报告，提取结构化信息",
    tags=["事件解析"]
)
async def parse_incident_report(request: ParseRequest) -> ParseResponse:
    """
    解析事件报告端点
    
    接收原始事件文本和来源类型，返回解析后的结构化数据
    """
    try:
        logger.info(f"收到事件解析请求，来源类型: {request.source_type}")
        
        # 调用解析服务
        parsed_data = parse_incident(
            source_type=request.source_type,
            raw_text=request.raw_text
        )
        
        logger.info(f"事件解析成功，事件ID: {parsed_data.get('incident_id', 'unknown')}")
        
        return ParseResponse(
            success=True,
            data=parsed_data,
            message="事件解析成功"
        )
        
    except ValueError as e:
        logger.warning(f"请求参数错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"请求参数错误: {str(e)}"
        )
        
    except Exception as e:
        logger.error(f"事件解析失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"事件解析失败: {str(e)}"
        )


@router.get(
    "/health",
    summary="健康检查",
    description="检查事件解析服务是否正常运行",
    tags=["健康检查"]
)
async def health_check() -> Dict[str, Any]:
    """
    健康检查端点
    """
    return {
        "status": "healthy",
        "service": "incident_parser",
        "message": "事件解析服务运行正常"
    }
