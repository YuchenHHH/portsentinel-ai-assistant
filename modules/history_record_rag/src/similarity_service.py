"""
相似度计算服务

实现历史案例匹配的相似度计算逻辑。
"""

import logging
import re
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import numpy as np
from sentence_transformers import SentenceTransformer

from .models import HistoricalCase, SimilarityScore, HistoryMatchRequest

logger = logging.getLogger(__name__)


class SimilarityCalculator:
    """相似度计算器"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        初始化相似度计算器
        
        Args:
            model_name: 句子嵌入模型名称
        """
        self.encoder = SentenceTransformer(model_name)
        logger.info(f"SimilarityCalculator initialized with {model_name}")
    
    def calculate_similarity_score(self, 
                                 query_text: str, 
                                 case_text: str) -> float:
        """
        计算文本相似度分数
        
        Args:
            query_text: 查询文本
            case_text: 案例文本
            
        Returns:
            相似度分数 (0-1)
        """
        try:
            # 使用句子嵌入计算余弦相似度
            query_embedding = self.encoder.encode([query_text])
            case_embedding = self.encoder.encode([case_text])
            
            # 计算余弦相似度
            similarity = np.dot(query_embedding[0], case_embedding[0]) / (
                np.linalg.norm(query_embedding[0]) * np.linalg.norm(case_embedding[0])
            )
            
            # 确保分数在0-1范围内
            similarity = max(0.0, min(1.0, similarity))
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Failed to calculate similarity: {e}")
            return 0.0
    
    def calculate_entity_overlap_score(self, 
                                     query_entities: List[Dict[str, str]], 
                                     case_text: str) -> float:
        """
        计算实体重合分数
        
        Args:
            query_entities: 查询中的实体列表
            case_text: 案例文本
            
        Returns:
            实体重合分数 (0-1)
        """
        try:
            if not query_entities:
                return 0.0
            
            # 提取查询中的实体值
            query_values = [entity.get('value', '') for entity in query_entities if entity.get('value')]
            
            if not query_values:
                return 0.0
            
            # 计算在案例文本中出现的实体数量
            found_entities = 0
            for value in query_values:
                if value.lower() in case_text.lower():
                    found_entities += 1
            
            # 计算重合比例
            overlap_score = found_entities / len(query_values)
            
            return float(overlap_score)
            
        except Exception as e:
            logger.error(f"Failed to calculate entity overlap: {e}")
            return 0.0
    
    def calculate_module_match_score(self, 
                                   query_module: Optional[str], 
                                   case_module: str) -> float:
        """
        计算模块匹配分数
        
        Args:
            query_module: 查询模块
            case_module: 案例模块
            
        Returns:
            模块匹配分数 (0-1)
        """
        try:
            if not query_module or not case_module:
                return 0.0
            
            # 精确匹配
            if query_module.lower() == case_module.lower():
                return 1.0
            
            # 部分匹配（例如：Container vs Container Management）
            if query_module.lower() in case_module.lower() or case_module.lower() in query_module.lower():
                return 0.8
            
            # 相关模块匹配
            module_relations = {
                "Container": ["EDI/API", "Vessel"],
                "Vessel": ["Container", "EDI/API"],
                "EDI/API": ["Container", "Vessel"]
            }
            
            if query_module in module_relations:
                if case_module in module_relations[query_module]:
                    return 0.5
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Failed to calculate module match: {e}")
            return 0.0
    
    def calculate_comprehensive_score(self, 
                                    similarity_score: float,
                                    entity_overlap_score: float,
                                    module_match_score: float,
                                    weights: Dict[str, float] = None) -> float:
        """
        计算综合分数
        
        Args:
            similarity_score: 相似度分数
            entity_overlap_score: 实体重合分数
            module_match_score: 模块匹配分数
            weights: 权重配置
            
        Returns:
            综合分数 (0-1)
        """
        try:
            # 默认权重配置
            if weights is None:
                weights = {
                    "similarity": 0.7,      # 相似度权重70%
                    "entity_overlap": 0.2,   # 实体重合权重20%
                    "module_match": 0.1      # 模块匹配权重10%
                }
            
            # 计算加权平均
            final_score = (
                similarity_score * weights["similarity"] +
                entity_overlap_score * weights["entity_overlap"] +
                module_match_score * weights["module_match"]
            )
            
            # 确保分数在0-1范围内
            final_score = max(0.0, min(1.0, final_score))
            
            return float(final_score)
            
        except Exception as e:
            logger.error(f"Failed to calculate comprehensive score: {e}")
            return 0.0


class HistorySimilarityService:
    """历史案例相似度服务"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        初始化相似度服务
        
        Args:
            model_name: 句子嵌入模型名称
        """
        self.calculator = SimilarityCalculator(model_name)
        logger.info("HistorySimilarityService initialized")
    
    def calculate_case_similarity(self, 
                                request: HistoryMatchRequest, 
                                case: HistoricalCase) -> SimilarityScore:
        """
        计算单个案例的相似度分数
        
        Args:
            request: 匹配请求
            case: 历史案例
            
        Returns:
            相似度分数对象
        """
        try:
            # 1. 计算文本相似度
            similarity_score = self.calculator.calculate_similarity_score(
                query_text=request.problem_summary,
                case_text=case.problem_statement
            )
            
            # 2. 计算实体重合分数
            entity_overlap_score = self.calculator.calculate_entity_overlap_score(
                query_entities=request.entities,
                case_text=case.problem_statement
            )
            
            # 3. 计算模块匹配分数
            module_match_score = self.calculator.calculate_module_match_score(
                query_module=request.affected_module,
                case_module=case.module
            )
            
            # 4. 计算综合分数
            final_score = self.calculator.calculate_comprehensive_score(
                similarity_score=similarity_score,
                entity_overlap_score=entity_overlap_score,
                module_match_score=module_match_score
            )
            
            return SimilarityScore(
                case_id=case.id,
                similarity_score=similarity_score,
                entity_overlap_score=entity_overlap_score,
                module_match_score=module_match_score,
                final_score=final_score
            )
            
        except Exception as e:
            logger.error(f"Failed to calculate case similarity: {e}")
            return SimilarityScore(
                case_id=case.id,
                similarity_score=0.0,
                entity_overlap_score=0.0,
                module_match_score=0.0,
                final_score=0.0
            )
    
    def rank_cases_by_similarity(self, 
                               request: HistoryMatchRequest, 
                               cases: List[HistoricalCase],
                               top_k: int = 10) -> List[Tuple[HistoricalCase, SimilarityScore]]:
        """
        根据相似度对案例进行排序
        
        Args:
            request: 匹配请求
            cases: 历史案例列表
            top_k: 返回前K个结果
            
        Returns:
            排序后的案例和分数列表
        """
        try:
            # 计算所有案例的相似度分数
            case_scores = []
            for case in cases:
                score = self.calculate_case_similarity(request, case)
                case_scores.append((case, score))
            
            # 按最终分数排序（降序）
            case_scores.sort(key=lambda x: x[1].final_score, reverse=True)
            
            # 返回前K个结果
            return case_scores[:top_k]
            
        except Exception as e:
            logger.error(f"Failed to rank cases by similarity: {e}")
            return []
    
    def filter_by_module(self, 
                        cases: List[HistoricalCase], 
                        target_module: Optional[str]) -> List[HistoricalCase]:
        """
        根据模块过滤案例
        
        Args:
            cases: 历史案例列表
            target_module: 目标模块
            
        Returns:
            过滤后的案例列表
        """
        try:
            if not target_module:
                return cases
            
            filtered_cases = []
            for case in cases:
                # 精确匹配
                if case.module.lower() == target_module.lower():
                    filtered_cases.append(case)
                # 部分匹配
                elif target_module.lower() in case.module.lower() or case.module.lower() in target_module.lower():
                    filtered_cases.append(case)
            
            logger.info(f"Module filter: {len(cases)} -> {len(filtered_cases)} cases")
            return filtered_cases
            
        except Exception as e:
            logger.error(f"Failed to filter by module: {e}")
            return cases
    
    def filter_by_similarity_threshold(self, 
                                     case_scores: List[Tuple[HistoricalCase, SimilarityScore]], 
                                     threshold: float = 0.3) -> List[Tuple[HistoricalCase, SimilarityScore]]:
        """
        根据相似度阈值过滤案例
        
        Args:
            case_scores: 案例和分数列表
            threshold: 相似度阈值
            
        Returns:
            过滤后的案例和分数列表
        """
        try:
            filtered_cases = [
                (case, score) for case, score in case_scores 
                if score.final_score >= threshold
            ]
            
            logger.info(f"Similarity filter: {len(case_scores)} -> {len(filtered_cases)} cases")
            return filtered_cases
            
        except Exception as e:
            logger.error(f"Failed to filter by similarity threshold: {e}")
            return case_scores
