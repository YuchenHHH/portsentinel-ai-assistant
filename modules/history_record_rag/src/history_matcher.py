"""
历史案例匹配服务

实现完整的历史案例匹配工作流程。
"""

import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

from .models import (
    HistoricalCase, 
    HistoryMatchRequest, 
    HistoryMatchResponse, 
    MatchedCase,
    SimilarityScore,
    HistoryMatchError
)
from .vector_store import HistoryVectorStoreManager
from .similarity_service import HistorySimilarityService
from .gpt_validator import HistoryGPTValidator

logger = logging.getLogger(__name__)


class HistoryMatcher:
    """历史案例匹配器"""
    
    def __init__(self, 
                 data_file_path: str,
                 vector_db_path: str = "history_vector_db",
                 model_name: str = "all-MiniLM-L6-v2",
                 gpt_deployment: str = "gpt-4.1-mini"):
        """
        初始化历史案例匹配器
        
        Args:
            data_file_path: 历史案例数据文件路径
            vector_db_path: 向量数据库路径
            model_name: 句子嵌入模型名称
            gpt_deployment: GPT部署名称
        """
        self.data_file_path = data_file_path
        self.vector_db_path = vector_db_path
        
        # 初始化各个组件
        self.vector_manager = HistoryVectorStoreManager(
            data_file_path=data_file_path,
            persist_directory=vector_db_path
        )
        
        self.similarity_service = HistorySimilarityService(model_name=model_name)
        
        self.gpt_validator = HistoryGPTValidator(
            deployment_name=gpt_deployment
        )
        
        logger.info("HistoryMatcher initialized")
    
    def find_similar_cases(self, request: HistoryMatchRequest) -> HistoryMatchResponse:
        """
        查找相似的历史案例
        
        Args:
            request: 匹配请求
            
        Returns:
            匹配响应
        """
        start_time = time.time()
        
        try:
            logger.info(f"Starting history case matching for incident: {request.incident_id}")
            
            # 第1层：模块过滤
            module_filtered_cases = self._module_filter(request)
            logger.info(f"Module filter: {len(module_filtered_cases)} cases")
            
            # 第2层：向量相似度计算
            similarity_candidates = self._vector_similarity_search(request, module_filtered_cases)
            logger.info(f"Vector similarity: {len(similarity_candidates)} candidates")
            
            # 第3层：综合重排
            ranked_cases = self._comprehensive_ranking(request, similarity_candidates)
            logger.info(f"Comprehensive ranking: {len(ranked_cases)} cases")
            
            # 第4层：GPT验证
            validated_cases = self._gpt_validation(request, ranked_cases)
            logger.info(f"GPT validation: {len(validated_cases)} similar cases")
            
            # 构建响应
            processing_time = (time.time() - start_time) * 1000  # 转换为毫秒
            
            response = HistoryMatchResponse(
                incident_id=request.incident_id,
                matched_cases=validated_cases,
                total_candidates=len(module_filtered_cases),
                module_filtered_count=len(module_filtered_cases),
                similarity_filtered_count=len(similarity_candidates),
                gpt_validated_count=len(validated_cases),
                processing_time_ms=processing_time
            )
            
            logger.info(f"History matching completed in {processing_time:.2f}ms")
            return response
            
        except Exception as e:
            logger.error(f"Failed to find similar cases: {e}")
            raise HistoryMatchError(f"历史案例匹配失败: {str(e)}")
    
    def _module_filter(self, request: HistoryMatchRequest) -> List[HistoricalCase]:
        """
        第1层：模块过滤
        
        Args:
            request: 匹配请求
            
        Returns:
            过滤后的案例列表
        """
        try:
            # 使用向量存储进行模块过滤搜索
            query_text = request.problem_summary
            module_filter = request.affected_module
            
            # 搜索相似案例
            similar_cases = self.vector_manager.search_similar_cases(
                query_text=query_text,
                module_filter=module_filter,
                top_k=50  # 获取更多候选案例
            )
            
            # 转换为HistoricalCase对象
            cases = []
            for case_id, score, metadata in similar_cases:
                # 从向量存储获取完整案例数据
                case_data = self.vector_manager.get_case_by_id(case_id)
                if case_data:
                    case = HistoricalCase(
                        id=case_data['id'],
                        module=case_data['metadata']['module'],
                        mode=case_data['metadata']['mode'],
                        is_edi=case_data['metadata']['is_edi'],
                        timestamp=case_data['metadata']['timestamp'],
                        alert_email=case_data['metadata']['alert_email'],
                        problem_statement=case_data['document'],
                        solution=case_data['metadata']['solution'],
                        sop=case_data['metadata']['sop'],
                        full_text=case_data['metadata']['full_text']
                    )
                    cases.append(case)
            
            return cases
            
        except Exception as e:
            logger.error(f"Module filter failed: {e}")
            return []
    
    def _vector_similarity_search(self, 
                                request: HistoryMatchRequest, 
                                cases: List[HistoricalCase]) -> List[HistoricalCase]:
        """
        第2层：向量相似度计算
        
        Args:
            request: 匹配请求
            cases: 案例列表
            
        Returns:
            相似度过滤后的案例列表
        """
        try:
            # 使用相似度服务计算分数
            case_scores = self.similarity_service.rank_cases_by_similarity(
                request=request,
                cases=cases,
                top_k=20  # 取前20个最相似的案例
            )
            
            # 应用相似度阈值过滤
            filtered_cases = self.similarity_service.filter_by_similarity_threshold(
                case_scores=case_scores,
                threshold=0.3  # 相似度阈值
            )
            
            # 返回案例列表
            return [case for case, score in filtered_cases]
            
        except Exception as e:
            logger.error(f"Vector similarity search failed: {e}")
            return cases[:10]  # 返回前10个案例作为备选
    
    def _comprehensive_ranking(self, 
                             request: HistoryMatchRequest, 
                             cases: List[HistoricalCase]) -> List[Tuple[HistoricalCase, SimilarityScore]]:
        """
        第3层：综合重排
        
        Args:
            request: 匹配请求
            cases: 案例列表
            
        Returns:
            重排后的案例和分数列表
        """
        try:
            # 计算综合相似度分数
            case_scores = self.similarity_service.rank_cases_by_similarity(
                request=request,
                cases=cases,
                top_k=10  # 取前10个进行GPT验证
            )
            
            return case_scores
            
        except Exception as e:
            logger.error(f"Comprehensive ranking failed: {e}")
            return []
    
    def _gpt_validation(self, 
                       request: HistoryMatchRequest, 
                       case_scores: List[Tuple[HistoricalCase, SimilarityScore]]) -> List[MatchedCase]:
        """
        第4层：GPT验证
        
        Args:
            request: 匹配请求
            case_scores: 案例和分数列表
            
        Returns:
            验证后的匹配案例列表
        """
        try:
            # 验证前3个案例
            validation_results = self.gpt_validator.validate_top_cases(
                request=request,
                case_scores=case_scores,
                top_k=3
            )
            
            # 构建匹配案例列表
            matched_cases = []
            for case, score, is_similar, reasoning in validation_results:
                matched_case = MatchedCase(
                    case=case,
                    similarity_score=score,
                    gpt_validation=is_similar,
                    gpt_reasoning=reasoning
                )
                matched_cases.append(matched_case)
            
            return matched_cases
            
        except Exception as e:
            logger.error(f"GPT validation failed: {e}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        获取匹配器统计信息
        
        Returns:
            统计信息字典
        """
        try:
            vector_stats = self.vector_manager.get_stats()
            
            return {
                "vector_store": vector_stats,
                "components": {
                    "vector_manager": "initialized",
                    "similarity_service": "initialized",
                    "gpt_validator": "initialized"
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"error": str(e)}
    
    def rebuild_index(self):
        """
        重建向量索引
        
        """
        try:
            self.vector_manager.rebuild_index()
            logger.info("Vector index rebuilt successfully")
            
        except Exception as e:
            logger.error(f"Failed to rebuild index: {e}")
            raise HistoryMatchError(f"重建索引失败: {str(e)}")


class HistoryMatcherService:
    """历史案例匹配服务"""
    
    def __init__(self, 
                 data_file_path: str = None,
                 vector_db_path: str = "history_vector_db"):
        """
        初始化匹配服务
        
        Args:
            data_file_path: 历史案例数据文件路径
            vector_db_path: 向量数据库路径
        """
        # 默认数据文件路径
        if data_file_path is None:
            data_file_path = str(Path(__file__).parent.parent.parent.parent / "data" / "case_log_rag.json")
        
        self.matcher = HistoryMatcher(
            data_file_path=data_file_path,
            vector_db_path=vector_db_path
        )
        
        logger.info("HistoryMatcherService initialized")
    
    def find_similar_cases(self, request: HistoryMatchRequest) -> HistoryMatchResponse:
        """
        查找相似的历史案例
        
        Args:
            request: 匹配请求
            
        Returns:
            匹配响应
        """
        return self.matcher.find_similar_cases(request)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        获取服务统计信息
        
        Returns:
            统计信息字典
        """
        return self.matcher.get_stats()
    
    def rebuild_index(self):
        """
        重建向量索引
        
        """
        self.matcher.rebuild_index()
