from fastapi import APIRouter, Depends, HTTPException, status
from app.api.v1.schemas.incident_parser import ParseRequest
from app.services import incident_parser_service
from app.core.exceptions import (
    IncidentParsingError, 
    AIServiceUnavailableError, 
    InvalidInputError,
    ConfigurationError
)
import sys
import os

# 导入真实的 AI 模块模型
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../modules/incident_parser/src'))
if module_path not in sys.path:
    sys.path.append(module_path)

from parsing_agent.models import IncidentReport

router = APIRouter()

@router.post(
    "/parse",
    response_model=IncidentReport, # <-- 使用真实的 IncidentReport 模型
    summary="Parse an incident report"
)
async def parse_incident_report_endpoint(
    request: ParseRequest
) -> IncidentReport:
    """
    接收原始事件报告文本并返回结构化的解析结果。
    
    该端点会尝试使用 AI 进行智能解析，如果 AI 服务不可用，
    会自动回退到基于规则的模拟解析。
    """
    try:
        # 调用服务层函数，使用默认的回退机制
        parsed_data = incident_parser_service.run_parser(
            source_type=request.source_type,
            raw_text=request.raw_text,
            use_fallback=True  # 允许回退到模拟解析
        )
        return parsed_data
        
    except InvalidInputError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "输入数据无效",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except AIServiceUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "AI 服务暂时不可用",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except ConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "系统配置错误",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except IncidentParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "解析失败",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except Exception as e:
        # 处理其他未预期的异常
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "服务器内部错误",
                "message": "发生未预期的错误，请稍后重试",
                "error_code": "INTERNAL_ERROR"
            }
        )