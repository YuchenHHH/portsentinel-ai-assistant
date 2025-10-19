"""
历史案例匹配API模式

定义历史案例匹配功能的Pydantic模型。
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class HistoricalCase(BaseModel):
    """历史案例数据结构"""
    
    id: str = Field(..., description="案例唯一标识符")
    module: str = Field(..., description="受影响的模块")
    mode: Literal["Email", "SMS", "Call"] = Field(..., description="报告方式")
    is_edi: str = Field(..., description="是否为EDI相关")
    timestamp: str = Field(..., description="案例时间戳")
    alert_email: str = Field(..., description="警报邮件内容")
    problem_statement: str = Field(..., description="问题描述")
    solution: str = Field(..., description="解决方案")
    sop: str = Field(..., description="相关SOP")
    full_text: str = Field(..., description="完整文本")


class SimilarityScore(BaseModel):
    """相似度分数"""
    
    case_id: str = Field(..., description="历史案例ID")
    similarity_score: float = Field(..., description="相似度分数 (0-1)")
    entity_overlap_score: float = Field(..., description="实体重合分数 (0-1)")
    module_match_score: float = Field(..., description="模块匹配分数 (0-1)")
    final_score: float = Field(..., description="最终综合分数 (0-1)")


class MatchedCase(BaseModel):
    """匹配的历史案例"""
    
    case: HistoricalCase = Field(..., description="历史案例数据")
    similarity_score: SimilarityScore = Field(..., description="相似度分数")
    gpt_validation: bool = Field(..., description="GPT验证结果")
    gpt_reasoning: str = Field(..., description="GPT验证推理")


class HistoryMatchRequest(BaseModel):
    """历史案例匹配请求"""
    
    incident_id: Optional[str] = Field(None, description="事件ID")
    source_type: Literal["Email", "SMS", "Call"] = Field(..., description="来源类型")
    problem_summary: str = Field(..., description="问题摘要")
    affected_module: Optional[Literal["Container", "Vessel", "EDI/API"]] = Field(None, description="受影响的模块")
    entities: List[Dict[str, str]] = Field(default_factory=list, description="提取的实体")
    error_code: Optional[str] = Field(None, description="错误代码")
    urgency: Literal["High", "Medium", "Low"] = Field("Medium", description="紧急程度")
    raw_text: str = Field(..., description="原始文本")
    
    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "ALR-861600",
                "source_type": "Email",
                "problem_summary": "Customer on PORTNET is experiencing duplicate container records...",
                "affected_module": "Container",
                "entities": [
                    {"type": "container_number", "value": "CMAU0000020"}
                ],
                "error_code": None,
                "urgency": "High",
                "raw_text": "Subject: URGENT - Container duplicate issue..."
            }
        }


class HistoryMatchResponse(BaseModel):
    """历史案例匹配响应"""
    
    incident_id: Optional[str] = Field(None, description="事件ID")
    matched_cases: List[MatchedCase] = Field(default_factory=list, description="匹配的历史案例")
    total_candidates: int = Field(0, description="候选案例总数")
    module_filtered_count: int = Field(0, description="模块过滤后数量")
    similarity_filtered_count: int = Field(0, description="相似度过滤后数量")
    gpt_validated_count: int = Field(0, description="GPT验证通过数量")
    processing_time_ms: float = Field(0.0, description="处理时间(毫秒)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "ALR-861600",
                "matched_cases": [
                    {
                        "case": {
                            "id": "case_1",
                            "module": "Container",
                            "problem_statement": "Duplicate container records detected..."
                        },
                        "similarity_score": {
                            "case_id": "case_1",
                            "similarity_score": 0.85,
                            "entity_overlap_score": 0.70,
                            "module_match_score": 1.0,
                            "final_score": 0.82
                        },
                        "gpt_validation": True,
                        "gpt_reasoning": "这两个案例都涉及容器重复记录问题..."
                    }
                ],
                "total_candidates": 100,
                "module_filtered_count": 25,
                "similarity_filtered_count": 10,
                "gpt_validated_count": 1,
                "processing_time_ms": 1250.5
            }
        }
