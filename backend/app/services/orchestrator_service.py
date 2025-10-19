"""
Orchestrator Service

实现 SOP 执行计划的业务逻辑层。
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

# 添加 SOP executor 模块到 Python 路径
# 从 backend/app/services/orchestrator_service.py 到 modules/sop_executor/src
sop_executor_path = Path(__file__).parent.parent.parent.parent / "modules" / "sop_executor" / "src"
sys.path.insert(0, str(sop_executor_path))

logging.info(f"SOP executor path added to sys.path: {sop_executor_path}")
logging.info(f"Current sys.path: {sys.path[:3]}...")  # 只显示前3个路径

try:
    from orchestrator import SOPPlanner
    logging.info("Successfully imported SOPPlanner")
except ImportError as e:
    logging.error(f"Failed to import SOPPlanner: {e}")
    logging.error(f"Available files in {sop_executor_path}: {list(sop_executor_path.iterdir())}")
    SOPPlanner = None

from app.api.v1.schemas.orchestrator import PlanRequest, PlanResponse, PlanError
from app.core.exceptions import OrchestratorError, ConfigurationError

logger = logging.getLogger(__name__)


class OrchestratorService:
    """
    Orchestrator Service 类
    
    负责调用 SOP Executor 模块生成执行计划。
    """
    
    def __init__(self):
        """初始化 Orchestrator Service"""
        self.planner = None
        self._initialize_planner()
    
    def _initialize_planner(self):
        """初始化 SOP Planner"""
        try:
            if SOPPlanner is None:
                raise ConfigurationError("SOPPlanner module not available")
            
            self.planner = SOPPlanner()
            logger.info("SOP Planner initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize SOP Planner: {e}")
            raise OrchestratorError(f"Failed to initialize SOP Planner: {e}")
    
    def _prepare_combined_context(
        self, 
        incident_context: Dict[str, Any], 
        sop_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        准备合并的上下文数据
        
        Args:
            incident_context: 事件上下文数据
            sop_response: SOP 响应数据
            
        Returns:
            合并后的上下文字典
        """
        combined_context = {
            # 基础事件信息
            "incident_id": incident_context.get("incident_id"),
            "problem_summary": incident_context.get("problem_summary"),
            "affected_module": incident_context.get("affected_module"),
            "error_code": incident_context.get("error_code"),
            "urgency": incident_context.get("urgency"),
            "entities": incident_context.get("entities", {}),
            "raw_text": incident_context.get("raw_text"),
            
            # SOP 相关信息 - 从第一个检索到的SOP中提取
            "retrieved_sops": sop_response.get("retrieved_sops", []),
            "sop_title": sop_response.get("retrieved_sops", [{}])[0].get("metadata", {}).get("sop_title") if sop_response.get("retrieved_sops") else None,
            "sop_overview": sop_response.get("retrieved_sops", [{}])[0].get("metadata", {}).get("overview") if sop_response.get("retrieved_sops") else None,
            "sop_preconditions": sop_response.get("retrieved_sops", [{}])[0].get("metadata", {}).get("preconditions") if sop_response.get("retrieved_sops") else None,
            "sop_verification": sop_response.get("retrieved_sops", [{}])[0].get("metadata", {}).get("verification") if sop_response.get("retrieved_sops") else None,
            "sop_module": sop_response.get("retrieved_sops", [{}])[0].get("metadata", {}).get("module") if sop_response.get("retrieved_sops") else None,
            
            # 额外的上下文信息
            "timestamp": "2025-01-19T10:00:00Z",
            "environment": "production",
            "priority": incident_context.get("urgency", "Medium").lower()
        }
        
        return combined_context
    
    async def create_plan(self, request: PlanRequest) -> PlanResponse:
        """
        创建执行计划
        
        Args:
            request: 计划请求对象
            
        Returns:
            PlanResponse: 包含执行计划的响应对象
        """
        try:
            logger.info(f"Creating execution plan for incident: {request.incident_context.incident_id}")
            
            # 检查 planner 是否已初始化
            if self.planner is None:
                raise OrchestratorError("SOP Planner not initialized")
            
            # 从请求中解构数据
            incident_context_dict = request.incident_context.dict()
            sop_response_dict = request.sop_response.dict()
            
            # 准备合并的上下文
            combined_context = self._prepare_combined_context(
                incident_context_dict, 
                sop_response_dict
            )
            
            # 准备解决方案文本 - 从第一个检索到的SOP中提取
            retrieved_sops = sop_response_dict.get("retrieved_sops", [])
            vague_resolution_text = ""
            if retrieved_sops and retrieved_sops[0].get("metadata", {}).get("resolution"):
                vague_resolution_text = retrieved_sops[0]["metadata"]["resolution"]
            
            if not vague_resolution_text.strip():
                logger.warning("Empty resolution text provided")
                vague_resolution_text = "No specific resolution steps provided in SOP"
            
            # 调用 SOP Planner 生成执行计划
            execution_plan = self.planner.create_execution_plan(
                incident_context=combined_context,
                vague_resolution_text=vague_resolution_text
            )
            
            logger.info(f"Successfully generated execution plan with {len(execution_plan)} steps")
            
            # 返回成功响应
            return PlanResponse(
                plan=execution_plan,
                success=True,
                message=f"Execution plan generated successfully with {len(execution_plan)} steps"
            )
            
        except ValueError as e:
            logger.error(f"Validation error in create_plan: {e}")
            return PlanResponse(
                plan=[],
                success=False,
                message=f"Validation error: {str(e)}"
            )
            
        except Exception as e:
            logger.error(f"Unexpected error in create_plan: {e}")
            return PlanResponse(
                plan=[],
                success=False,
                message=f"Failed to generate execution plan: {str(e)}"
            )
    
    async def create_plan_with_fallback(self, request: PlanRequest) -> PlanResponse:
        """
        创建执行计划（带降级处理）
        
        如果主要计划生成失败，返回一个基本的降级计划。
        
        Args:
            request: 计划请求对象
            
        Returns:
            PlanResponse: 包含执行计划的响应对象
        """
        try:
            # 尝试正常生成计划
            result = await self.create_plan(request)
            
            # 如果成功，直接返回
            if result.success:
                return result
            
            # 如果失败，生成降级计划
            logger.warning(f"Primary plan generation failed, creating fallback plan for incident: {request.incident_context.incident_id}")
            
            fallback_plan = self._create_fallback_plan(request)
            
            return PlanResponse(
                plan=fallback_plan,
                success=True,
                message="Fallback execution plan generated due to primary plan generation failure"
            )
            
        except Exception as e:
            logger.error(f"Error in create_plan_with_fallback: {e}")
            return PlanResponse(
                plan=[],
                success=False,
                message=f"Failed to generate execution plan: {str(e)}"
            )
    
    def _create_fallback_plan(self, request: PlanRequest) -> List[str]:
        """
        创建降级执行计划
        
        Args:
            request: 计划请求对象
            
        Returns:
            降级执行计划列表
        """
        incident_id = request.incident_context.incident_id
        affected_module = request.incident_context.affected_module
        error_code = request.incident_context.error_code
        
        fallback_plan = [
            f"Log incident {incident_id} in the system",
            f"Verify the status of the {affected_module} module",
            f"Query the database for any related errors or issues"
        ]
        
        if error_code:
            fallback_plan.append(f"Investigate error code {error_code} in the {affected_module} module")
        
        fallback_plan.extend([
            f"Notify the operations team about incident {incident_id}",
            f"Monitor the {affected_module} module for resolution",
            f"Document the resolution steps for incident {incident_id}"
        ])
        
        return fallback_plan
    
    def health_check(self) -> Dict[str, Any]:
        """
        健康检查
        
        Returns:
            健康状态信息
        """
        return {
            "status": "healthy" if self.planner is not None else "unhealthy",
            "planner_initialized": self.planner is not None,
            "service": "OrchestratorService",
            "version": "1.0.0"
        }
