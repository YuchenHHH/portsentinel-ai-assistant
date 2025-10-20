"""
Historical Case Matching Service

Core service implementing historical case matching functionality.
"""

import os
import json
import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import openai
from openai import AzureOpenAI

from app.api.v1.schemas.history_match import (
    HistoricalCase, 
    HistoryMatchRequest, 
    HistoryMatchResponse, 
    MatchedCase,
    SimilarityScore
)

logger = logging.getLogger(__name__)


class HistoryMatchService:
    """Historical case matching service"""
    
    def __init__(self):
        """Initialize historical case matching service"""
        self.encoder = None
        self.client = None
        self.collection = None
        self.gpt_client = None
        self.historical_cases = []
        
        self._initialize()
    
    def _initialize(self):
        """Initialize components"""
        try:
            # Initialize sentence embedding model
            self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence transformer initialized")
            
            # 初始化ChromaDB
            persist_directory = "history_vector_db"
            self.client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # 获取或创建集合
            self.collection = self.client.get_or_create_collection(
                name="historical_cases",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB initialized")
            
            # 初始化Azure OpenAI客户端
            api_key = os.getenv("AZURE_OPENAI_API_KEY")
            api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
            api_version = "2023-05-15"
            deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1-mini")
            
            if api_key and api_base:
                self.gpt_client = AzureOpenAI(
                    api_key=api_key,
                    azure_endpoint=api_base,
                    api_version=api_version,
                    timeout=120.0  # 设置120秒超时
                )
                self.gpt_deployment = deployment_name
                logger.info("Azure OpenAI client initialized")
            else:
                logger.warning("Azure OpenAI credentials not found, GPT validation will be disabled")
            
            # 加载历史案例数据
            self._load_historical_cases()
            
        except Exception as e:
            logger.error(f"Failed to initialize history match service: {e}")
            raise
    
    def _load_historical_cases(self):
        """加载历史案例数据"""
        try:
            # 数据文件路径 - 从backend目录向上到项目根目录
            data_file = Path(__file__).parent.parent.parent.parent / "data" / "case_log_rag.json"
            logger.info(f"Looking for data file at: {data_file}")
            logger.info(f"Data file exists: {data_file.exists()}")
            
            if not data_file.exists():
                logger.warning(f"Historical cases file not found: {data_file}")
                return
            
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 转换为HistoricalCase对象
            self.historical_cases = []
            for item in data:
                case = HistoricalCase(**item)
                self.historical_cases.append(case)
            
            logger.info(f"Loaded {len(self.historical_cases)} historical cases")
            
            # 检查向量数据库是否需要初始化
            if self.collection.count() == 0:
                self._vectorize_cases()
            
        except Exception as e:
            logger.error(f"Failed to load historical cases: {e}")
            self.historical_cases = []
    
    def _vectorize_cases(self):
        """向量化历史案例"""
        try:
            if not self.historical_cases:
                return
            
            documents = []
            metadatas = []
            ids = []
            
            for case in self.historical_cases:
                # 使用problem_statement作为主要文本
                documents.append(case.problem_statement)
                
                metadata = {
                    "case_id": case.id,
                    "module": case.module,
                    "mode": case.mode,
                    "is_edi": case.is_edi,
                    "timestamp": case.timestamp,
                    "alert_email": case.alert_email[:500],
                    "solution": case.solution[:500],
                    "sop": case.sop,
                    "full_text": case.full_text[:1000]
                }
                metadatas.append(metadata)
                ids.append(case.id)
            
            # 批量添加到ChromaDB
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Vectorized {len(self.historical_cases)} historical cases")
            
        except Exception as e:
            logger.error(f"Failed to vectorize cases: {e}")
    
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
            processing_time = (time.time() - start_time) * 1000
            
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
            return HistoryMatchResponse(
                incident_id=request.incident_id,
                matched_cases=[],
                total_candidates=0,
                module_filtered_count=0,
                similarity_filtered_count=0,
                gpt_validated_count=0,
                processing_time_ms=(time.time() - start_time) * 1000
            )
    
    def _module_filter(self, request: HistoryMatchRequest) -> List[HistoricalCase]:
        """第1层：模块过滤"""
        try:
            if not request.affected_module:
                return self.historical_cases[:50]  # 返回前50个案例
            
            filtered_cases = []
            for case in self.historical_cases:
                if case.module.lower() == request.affected_module.lower():
                    filtered_cases.append(case)
                elif request.affected_module.lower() in case.module.lower():
                    filtered_cases.append(case)
            
            return filtered_cases[:50]  # 限制数量
            
        except Exception as e:
            logger.error(f"Module filter failed: {e}")
            return self.historical_cases[:50]
    
    def _vector_similarity_search(self, request: HistoryMatchRequest, cases: List[HistoricalCase]) -> List[HistoricalCase]:
        """第2层：向量相似度计算"""
        try:
            if not cases:
                return []
            
            # 使用向量搜索
            results = self.collection.query(
                query_texts=[request.problem_summary],
                n_results=min(20, len(cases))
            )
            
            logger.info(f"Vector similarity search results: {len(results.get('ids', [[]])[0]) if results.get('ids') else 0} candidates")
            
            # 获取匹配的案例
            matched_cases = []
            if results['ids'] and results['ids'][0]:
                for case_id in results['ids'][0]:
                    case = next((c for c in cases if c.id == case_id), None)
                    if case:
                        matched_cases.append(case)
            
            # 如果没有找到匹配的案例，返回前10个案例
            if not matched_cases:
                logger.warning("No vector similarity matches found, returning top 10 cases")
                matched_cases = cases[:10]
            
            return matched_cases
            
        except Exception as e:
            logger.error(f"Vector similarity search failed: {e}")
            return cases[:10]
    
    def _comprehensive_ranking(self, request: HistoryMatchRequest, cases: List[HistoricalCase]) -> List[Tuple[HistoricalCase, SimilarityScore]]:
        """第3层：综合重排"""
        try:
            case_scores = []
            
            for case in cases:
                # 计算相似度分数
                similarity_score = self._calculate_similarity_score(request.problem_summary, case.problem_statement)
                
                # 计算实体重合分数
                entity_overlap_score = self._calculate_entity_overlap_score(request.entities, case.problem_statement)
                
                # 计算模块匹配分数
                module_match_score = self._calculate_module_match_score(request.affected_module, case.module)
                
                # 计算综合分数
                final_score = (
                    similarity_score * 0.7 +
                    entity_overlap_score * 0.2 +
                    module_match_score * 0.1
                )
                
                score = SimilarityScore(
                    case_id=case.id,
                    similarity_score=similarity_score,
                    entity_overlap_score=entity_overlap_score,
                    module_match_score=module_match_score,
                    final_score=final_score
                )
                
                case_scores.append((case, score))
            
            # 按分数排序
            case_scores.sort(key=lambda x: x[1].final_score, reverse=True)
            
            return case_scores[:10]  # 返回前10个
            
        except Exception as e:
            logger.error(f"Comprehensive ranking failed: {e}")
            return []
    
    def _gpt_validation(self, request: HistoryMatchRequest, case_scores: List[Tuple[HistoricalCase, SimilarityScore]]) -> List[MatchedCase]:
        """第4层：GPT验证 - 只返回通过验证的案例"""
        try:
            if not self.gpt_client or not case_scores:
                # 如果没有GPT客户端，返回空列表（不显示任何案例）
                logger.warning("GPT客户端不可用，跳过历史案例验证")
                return []
            
            # 验证前5个案例，只返回通过验证的
            validated_cases = []
            logger.info(f"[LLM Validation] 开始验证 {min(5, len(case_scores))} 个历史案例...")
            
            for i, (case, score) in enumerate(case_scores[:5]):
                logger.info(f"  [LLM Validation] 验证历史案例 {i+1}: {case.id}")
                is_similar, reasoning = self._validate_with_gpt(request, case)
                logger.info(f"  [LLM Validation] 验证结果: {'通过' if is_similar else '未通过'}")
                
                if is_similar:
                    matched_case = MatchedCase(
                        case=case,
                        similarity_score=score,
                        gpt_validation=True,
                        gpt_reasoning=reasoning
                    )
                    validated_cases.append(matched_case)
                    logger.info(f"历史案例匹配 - 添加通过验证的案例: {case.id}")
                else:
                    logger.info(f"历史案例匹配 - 案例被LLM拒绝: {case.id} - {reasoning}")
            
            logger.info(f"[LLM Validation] 历史案例验证完成: {len(validated_cases)}/{min(5, len(case_scores))} 个案例通过验证")
            return validated_cases
            
        except Exception as e:
            logger.error(f"GPT validation failed: {e}")
            return []
    
    def _calculate_similarity_score(self, query_text: str, case_text: str) -> float:
        """计算文本相似度分数"""
        try:
            query_embedding = self.encoder.encode([query_text])
            case_embedding = self.encoder.encode([case_text])
            
            similarity = np.dot(query_embedding[0], case_embedding[0]) / (
                np.linalg.norm(query_embedding[0]) * np.linalg.norm(case_embedding[0])
            )
            
            return max(0.0, min(1.0, float(similarity)))
            
        except Exception as e:
            logger.error(f"Failed to calculate similarity score: {e}")
            return 0.0
    
    def _calculate_entity_overlap_score(self, entities: List[Dict[str, str]], case_text: str) -> float:
        """计算实体重合分数"""
        try:
            if not entities:
                return 0.0
            
            query_values = [entity.get('value', '') for entity in entities if entity.get('value')]
            if not query_values:
                return 0.0
            
            found_entities = 0
            for value in query_values:
                if value.lower() in case_text.lower():
                    found_entities += 1
            
            return found_entities / len(query_values)
            
        except Exception as e:
            logger.error(f"Failed to calculate entity overlap score: {e}")
            return 0.0
    
    def _calculate_module_match_score(self, query_module: Optional[str], case_module: str) -> float:
        """计算模块匹配分数"""
        try:
            if not query_module or not case_module:
                return 0.0
            
            if query_module.lower() == case_module.lower():
                return 1.0
            
            if query_module.lower() in case_module.lower() or case_module.lower() in query_module.lower():
                return 0.8
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Failed to calculate module match score: {e}")
            return 0.0
    
    def _validate_with_gpt(self, request: HistoryMatchRequest, case: HistoricalCase) -> Tuple[bool, str]:
        """使用GPT验证案例相似性"""
        try:
            prompt = f"""
请分析以下两个问题是否相似：

【当前问题】
- 问题摘要: {request.problem_summary}
- 影响模块: {request.affected_module or '未指定'}
- 错误代码: {request.error_code or '无'}
- 紧急程度: {request.urgency}
- 提取的实体: {', '.join([f"{e.get('type', '')}: {e.get('value', '')}" for e in request.entities])}

【历史案例】
- 案例ID: {case.id}
- 问题描述: {case.problem_statement}
- 影响模块: {case.module}
- 报告方式: {case.mode}
- 解决方案: {case.solution[:200]}...

请从以下角度分析相似性：
1. 问题类型是否相同（如：都是数据重复、都是时间戳问题等）
2. 影响模块是否相关
3. 错误模式是否相似
4. 解决方案是否可参考

请回答：
- 是否相似: [是/否]
- 相似度评分: [1-10分]
- 推理说明: [详细说明为什么相似或不相似]
"""
            
            response = self.gpt_client.chat.completions.create(
                model=self.gpt_deployment,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的IT支持分析师，负责判断两个问题是否相似。请仔细分析问题的核心内容、影响模块、错误类型等，判断它们是否属于同一类问题。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            is_similar, reasoning = self._parse_gpt_response(result_text)
            
            return is_similar, reasoning
            
        except Exception as e:
            logger.error(f"Failed to validate with GPT: {e}")
            return False, f"GPT验证失败: {str(e)}"
    
    def _parse_gpt_response(self, response_text: str) -> Tuple[bool, str]:
        """解析GPT响应"""
        try:
            is_similar = False
            if "是否相似: 是" in response_text or "相似: 是" in response_text:
                is_similar = True
            elif "是否相似: 否" in response_text or "相似: 否" in response_text:
                is_similar = False
            else:
                if "相似" in response_text and "是" in response_text:
                    is_similar = True
                elif "不相似" in response_text or "不同" in response_text:
                    is_similar = False
            
            reasoning = response_text
            if "推理说明:" in response_text:
                reasoning = response_text.split("推理说明:")[-1].strip()
            elif "说明:" in response_text:
                reasoning = response_text.split("说明:")[-1].strip()
            
            return is_similar, reasoning
            
        except Exception as e:
            logger.error(f"Failed to parse GPT response: {e}")
            return False, f"解析响应失败: {str(e)}"
    
    def get_stats(self) -> Dict[str, Any]:
        """获取服务统计信息"""
        try:
            return {
                "vector_store": {
                    "count": self.collection.count() if self.collection else 0,
                    "collection_name": "historical_cases"
                },
                "historical_cases": len(self.historical_cases),
                "gpt_client": "available" if self.gpt_client else "unavailable"
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"error": str(e)}


# 全局服务实例
_history_service_instance = None


def get_history_service() -> HistoryMatchService:
    """获取或创建历史案例匹配服务实例"""
    global _history_service_instance
    
    if _history_service_instance is None:
        _history_service_instance = HistoryMatchService()
    
    return _history_service_instance
