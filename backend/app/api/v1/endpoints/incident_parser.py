from fastapi import APIRouter, Depends
from api.v1.schemas.incident_parser import ParseRequest, IncidentReport
from services import incident_parser_service

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
    """
    # 直接调用服务层的函数，错误已在服务层处理
    parsed_data = incident_parser_service.run_parser(
        source_type=request.source_type,
        raw_text=request.raw_text
    )
    return parsed_data