"""
历史案例匹配模块

提供历史案例匹配功能，包括向量搜索、相似度计算和GPT验证。
"""

from .models import (
    HistoricalCase,
    HistoryMatchRequest,
    HistoryMatchResponse,
    MatchedCase,
    SimilarityScore,
    HistoryMatchError
)

from .history_matcher import HistoryMatcher, HistoryMatcherService
from .vector_store import HistoryVectorStore, HistoryVectorStoreManager
from .similarity_service import SimilarityCalculator, HistorySimilarityService
from .gpt_validator import GPTValidator, HistoryGPTValidator

__all__ = [
    # Models
    "HistoricalCase",
    "HistoryMatchRequest", 
    "HistoryMatchResponse",
    "MatchedCase",
    "SimilarityScore",
    "HistoryMatchError",
    
    # Main Services
    "HistoryMatcher",
    "HistoryMatcherService",
    
    # Components
    "HistoryVectorStore",
    "HistoryVectorStoreManager",
    "SimilarityCalculator",
    "HistorySimilarityService",
    "GPTValidator",
    "HistoryGPTValidator"
]
