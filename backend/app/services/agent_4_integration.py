"""
Agent 4 Integration Service
集成 agent_4_followup 到 SOP 执行工作流中
"""

import sys
import logging
import json
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime

# 添加 agent_4_followup 模块到 Python 路径
agent_4_path = Path(__file__).parent.parent.parent.parent / "modules" / "agent_4_followup"
sys.path.insert(0, str(agent_4_path))

logging.info(f"Agent 4 integration: Adding path to sys.path: {agent_4_path}")

try:
    from agent import ResolutionFollowupAgent
    from models import ExecutionResult, L2ExecutionStatus, ResolutionSummary, FollowupResult
    logging.info("Successfully imported Agent 4 components")
except ImportError as e:
    logging.error(f"Failed to import Agent 4 components: {e}")
    # 创建模拟实现
    class ResolutionFollowupAgent:
        def __init__(self, escalation_contacts_path: str):
            logging.info("ResolutionFollowupAgent (模拟) 初始化完毕")
        
        def process_followup(self, execution_result, l2_status):
            # 返回一个模拟的FollowupResult对象
            class MockFollowupResult:
                def __init__(self):
                    self.escalation_required = False
                    self.escalation_contact = None
                    self.escalation_email = None
                    self.resolution_summary = MockResolutionSummary()
            
            class MockResolutionSummary:
                def __init__(self):
                    self.incident_id = "MOCK"
                    self.resolution_outcome = "Resolved Successfully"
                    self.error_identified = "Mock error"
                    self.root_cause = "Mock root cause"
                    self.resolution_attempted = "Mock resolution"
                    self.actions_taken = ["Mock action"]
                    self.timeline = []
                    self.escalated_to_l3 = False
                    self.lessons_learned = "Mock lessons"
                    self.generated_at = "2025-01-01T00:00:00"
            
            return MockFollowupResult()
        
        def save_summary_to_file(self, summary, output_dir="."):
            return "mock_summary.md"
    
    class ExecutionResult:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class L2ExecutionStatus:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)


class SOPExecutionSummaryService:
    """SOP 执行摘要服务 - 集成 Agent 4"""
    
    def __init__(self):
        # 初始化 Agent 4
        contacts_path = Path(__file__).parent.parent.parent.parent / "modules" / "agent_4_followup" / "escalation_contacts.csv"
        self.agent = ResolutionFollowupAgent(str(contacts_path))
        logging.info("SOPExecutionSummaryService 初始化完毕")
    
    def generate_execution_summary(
        self, 
        incident_id: str,
        completed_steps: list,
        execution_status: str,
        execution_notes: str = "",
        total_execution_time_hours: float = 0.0
    ) -> Dict[str, Any]:
        """
        生成 SOP 执行摘要
        
        Args:
            incident_id: 事件ID
            completed_steps: 已完成的步骤列表
            execution_status: 执行状态 ("completed", "failed", "timeout")
            execution_notes: 执行备注
            total_execution_time_hours: 总执行时间（小时）
        
        Returns:
            包含摘要信息的字典
        """
        try:
            logging.info(f"开始生成 SOP 执行摘要 - 事件ID: {incident_id}")
            logging.info(f"completed_steps 数量: {len(completed_steps) if completed_steps else 0}")
            logging.info(f"completed_steps 内容: {completed_steps}")
            
            # 创建 ExecutionResult 对象
            actions_taken = self._extract_actions_taken(completed_steps)
            logging.info(f"提取的 actions_taken: {actions_taken}")
            
            execution_result = ExecutionResult(
                incident_id=incident_id,
                execution_success=(execution_status == "completed"),
                execution_summary=self._generate_execution_summary_text(completed_steps, execution_status),
                sql_queries=self._extract_sql_queries(completed_steps),
                actions_taken=actions_taken
            )
            
            # 创建 L2ExecutionStatus 对象
            l2_status = L2ExecutionStatus(
                execution_success=(execution_status == "completed"),
                execution_timestamp=datetime.utcnow().isoformat(),
                time_elapsed_hours=total_execution_time_hours,
                execution_notes=execution_notes or self._generate_execution_notes(completed_steps, execution_status),
                timeout_threshold_hours=24.0,
                is_timeout=(execution_status == "timeout")
            )
            
            # 使用 Agent 4 处理后续跟进
            result = self.agent.process_followup(execution_result, l2_status)
            
            # 生成摘要文件
            summary_path = self.agent.save_summary_to_file(
                result.resolution_summary, 
                output_dir=str(Path(__file__).parent.parent.parent.parent / "backend" / "execution_summaries")
            )
            
            # 返回结构化结果
            return {
                "success": True,
                "incident_id": incident_id,
                "execution_status": execution_status,
                "escalation_required": result.escalation_required,
                "resolution_outcome": result.resolution_summary.resolution_outcome,
                "summary_path": summary_path,
                "escalation_contact": result.escalation_contact.__dict__ if result.escalation_contact else None,
                "escalation_email": result.escalation_email.__dict__ if result.escalation_email else None,
                "resolution_summary": result.resolution_summary.__dict__,
                "completed_steps_count": len(completed_steps),
                "total_execution_time_hours": total_execution_time_hours
            }
            
        except Exception as e:
            logging.error(f"生成 SOP 执行摘要失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "incident_id": incident_id
            }
    
    def _generate_execution_summary_text(self, completed_steps: list, execution_status: str) -> str:
        """Generate Summary文本"""
        summary_parts = []
        
        if execution_status == "completed":
            summary_parts.append(f"Successfully completed {len(completed_steps)} steps of the SOP execution plan.")
        elif execution_status == "failed":
            summary_parts.append(f"SOP execution failed after completing {len(completed_steps)} steps.")
        elif execution_status == "timeout":
            summary_parts.append(f"SOP execution timed out after {len(completed_steps)} steps.")
        else:
            summary_parts.append(f"SOP execution status: {execution_status} with {len(completed_steps)} completed steps.")
        
        # 添加详细的执行步骤信息
        if completed_steps:
            summary_parts.append("\nDetailed execution steps:")
            for i, step in enumerate(completed_steps, 1):
                step_desc = step.get("step_description", f"Step {i}")
                step_output = step.get("tool_output", "No output")
                summary_parts.append(f"{i}. {step_desc}")
                if step_output and step_output != "No output":
                    summary_parts.append(f"   Output: {step_output}")
        
        return "\n".join(summary_parts)
    
    def _extract_sql_queries(self, completed_steps: list) -> list:
        """从完成的步骤中提取 SQL 查询"""
        sql_queries = []
        for step in completed_steps:
            if step.get("tool_output"):
                # 尝试从工具输出中提取 SQL 查询
                tool_output = step["tool_output"]
                if isinstance(tool_output, str):
                    # 简单的 SQL 查询提取逻辑
                    if "SELECT" in tool_output.upper() or "UPDATE" in tool_output.upper() or "DELETE" in tool_output.upper():
                        # 提取 SQL 查询部分
                        lines = tool_output.split('\n')
                        for line in lines:
                            if any(keyword in line.upper() for keyword in ["SELECT", "UPDATE", "DELETE", "INSERT"]):
                                sql_queries.append(line.strip())
        return sql_queries
    
    def _extract_actions_taken(self, completed_steps: list) -> list:
        """从完成的步骤中提取执行的操作"""
        actions = []
        for step in completed_steps:
            if step.get("step_description"):
                actions.append(step["step_description"])
        return actions
    
    def _generate_execution_notes(self, completed_steps: list, execution_status: str) -> str:
        """生成执行备注"""
        if execution_status == "completed":
            return f"All {len(completed_steps)} steps completed successfully."
        elif execution_status == "failed":
            return f"Execution failed after {len(completed_steps)} steps."
        elif execution_status == "timeout":
            return f"Execution timed out after {len(completed_steps)} steps."
        else:
            return f"Execution ended with status: {execution_status}"


# 全局实例
_sop_summary_service = None

def get_sop_summary_service() -> SOPExecutionSummaryService:
    """获取 SOP 执行摘要服务实例"""
    global _sop_summary_service
    if _sop_summary_service is None:
        _sop_summary_service = SOPExecutionSummaryService()
    return _sop_summary_service
