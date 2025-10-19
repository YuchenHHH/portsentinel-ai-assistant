"""
GPT验证器

使用Azure OpenAI GPT模型验证历史案例的相似性。
"""

import os
import logging
from typing import List, Dict, Any, Tuple, Optional
import openai
from openai import AzureOpenAI

from .models import HistoricalCase, HistoryMatchRequest

logger = logging.getLogger(__name__)


class GPTValidator:
    """GPT验证器"""
    
    def __init__(self, 
                 api_key: str = None,
                 api_base: str = None,
                 api_version: str = "2023-05-15",
                 deployment_name: str = "gpt-4.1-mini"):
        """
        初始化GPT验证器
        
        Args:
            api_key: Azure OpenAI API密钥
            api_base: Azure OpenAI API基础URL
            api_version: API版本
            deployment_name: 部署名称
        """
        # 从环境变量获取配置
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.api_base = api_base or os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_version = api_version
        self.deployment_name = deployment_name or os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1-mini")
        
        if not self.api_key or not self.api_base:
            raise ValueError("Azure OpenAI API key and endpoint must be provided")
        
        # 初始化OpenAI客户端
        self.client = AzureOpenAI(
            api_key=self.api_key,
            api_base=self.api_base,
            api_version=self.api_version
        )
        
        logger.info(f"GPTValidator initialized with deployment: {self.deployment_name}")
    
    def validate_case_similarity(self, 
                               request: HistoryMatchRequest, 
                               case: HistoricalCase) -> Tuple[bool, str]:
        """
        验证单个案例的相似性
        
        Args:
            request: 匹配请求
            case: 历史案例
            
        Returns:
            (是否相似, 推理说明)
        """
        try:
            # 构建验证提示
            prompt = self._build_validation_prompt(request, case)
            
            # 调用GPT API
            response = self.client.chat.completions.create(
                model=self.deployment_name,
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
            
            # 解析响应
            result_text = response.choices[0].message.content.strip()
            is_similar, reasoning = self._parse_validation_response(result_text)
            
            logger.info(f"GPT validation for case {case.id}: {is_similar}")
            return is_similar, reasoning
            
        except Exception as e:
            logger.error(f"Failed to validate case similarity: {e}")
            return False, f"验证失败: {str(e)}"
    
    def validate_multiple_cases(self, 
                              request: HistoryMatchRequest, 
                              cases: List[HistoricalCase],
                              max_cases: int = 3) -> List[Tuple[HistoricalCase, bool, str]]:
        """
        验证多个案例的相似性
        
        Args:
            request: 匹配请求
            cases: 历史案例列表
            max_cases: 最大验证案例数量
            
        Returns:
            验证结果列表，每个元素包含(案例, 是否相似, 推理说明)
        """
        try:
            results = []
            
            # 限制验证数量
            cases_to_validate = cases[:max_cases]
            
            for case in cases_to_validate:
                is_similar, reasoning = self.validate_case_similarity(request, case)
                results.append((case, is_similar, reasoning))
            
            logger.info(f"Validated {len(results)} cases, {sum(1 for _, is_similar, _ in results if is_similar)} similar")
            return results
            
        except Exception as e:
            logger.error(f"Failed to validate multiple cases: {e}")
            return []
    
    def _build_validation_prompt(self, 
                              request: HistoryMatchRequest, 
                              case: HistoricalCase) -> str:
        """
        构建验证提示
        
        Args:
            request: 匹配请求
            case: 历史案例
            
        Returns:
            验证提示文本
        """
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
        return prompt
    
    def _parse_validation_response(self, response_text: str) -> Tuple[bool, str]:
        """
        解析验证响应
        
        Args:
            response_text: GPT响应文本
            
        Returns:
            (是否相似, 推理说明)
        """
        try:
            # 查找是否相似
            is_similar = False
            if "是否相似: 是" in response_text or "相似: 是" in response_text:
                is_similar = True
            elif "是否相似: 否" in response_text or "相似: 否" in response_text:
                is_similar = False
            else:
                # 尝试从文本中推断
                if "相似" in response_text and "是" in response_text:
                    is_similar = True
                elif "不相似" in response_text or "不同" in response_text:
                    is_similar = False
            
            # 提取推理说明
            reasoning = response_text
            if "推理说明:" in response_text:
                reasoning = response_text.split("推理说明:")[-1].strip()
            elif "说明:" in response_text:
                reasoning = response_text.split("说明:")[-1].strip()
            
            return is_similar, reasoning
            
        except Exception as e:
            logger.error(f"Failed to parse validation response: {e}")
            return False, f"解析响应失败: {str(e)}"


class HistoryGPTValidator:
    """历史案例GPT验证服务"""
    
    def __init__(self, 
                 api_key: str = None,
                 api_base: str = None,
                 deployment_name: str = "gpt-4.1-mini"):
        """
        初始化GPT验证服务
        
        Args:
            api_key: Azure OpenAI API密钥
            api_base: Azure OpenAI API基础URL
            deployment_name: 部署名称
        """
        self.validator = GPTValidator(
            api_key=api_key,
            api_base=api_base,
            deployment_name=deployment_name
        )
        logger.info("HistoryGPTValidator initialized")
    
    def validate_top_cases(self, 
                          request: HistoryMatchRequest, 
                          case_scores: List[Tuple[HistoricalCase, Any]],
                          top_k: int = 3) -> List[Tuple[HistoricalCase, Any, bool, str]]:
        """
        验证前K个案例
        
        Args:
            request: 匹配请求
            case_scores: 案例和分数列表
            top_k: 验证的案例数量
            
        Returns:
            验证结果列表，每个元素包含(案例, 分数, 是否相似, 推理说明)
        """
        try:
            # 取前K个案例
            top_cases = case_scores[:top_k]
            
            # 验证每个案例
            results = []
            for case, score in top_cases:
                is_similar, reasoning = self.validator.validate_case_similarity(request, case)
                results.append((case, score, is_similar, reasoning))
            
            # 统计结果
            similar_count = sum(1 for _, _, is_similar, _ in results if is_similar)
            logger.info(f"Validated {len(results)} cases, {similar_count} similar")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to validate top cases: {e}")
            return []
    
    def get_similar_cases_only(self, 
                              validation_results: List[Tuple[HistoricalCase, Any, bool, str]]) -> List[Tuple[HistoricalCase, Any, str]]:
        """
        获取仅相似的案例
        
        Args:
            validation_results: 验证结果列表
            
        Returns:
            相似案例列表，每个元素包含(案例, 分数, 推理说明)
        """
        try:
            similar_cases = [
                (case, score, reasoning) 
                for case, score, is_similar, reasoning in validation_results 
                if is_similar
            ]
            
            logger.info(f"Found {len(similar_cases)} similar cases after GPT validation")
            return similar_cases
            
        except Exception as e:
            logger.error(f"Failed to get similar cases: {e}")
            return []
