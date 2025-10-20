import sys
import logging
import json
from typing import List, Dict, Any, Union, Optional
from pydantic import BaseModel
from pathlib import Path
from langchain_core.messages import HumanMessage, AIMessage
from datetime import datetime

# 添加 SOP executor 模块到 Python 路径（与orchestrator_service.py相同的方式）
# 从 backend/app/services/sop_execution_service.py 到 modules/sop_executor/src
sop_executor_path = Path(__file__).parent.parent.parent.parent / "modules" / "sop_executor" / "src"
sys.path.insert(0, str(sop_executor_path))

logging.info(f"SOP execution service: SOP executor path added to sys.path: {sop_executor_path}")

# 导入在 modules 中定义的 Agent
try:
    from agent import SOPExecutorAgent
    logging.info("Successfully imported SOPExecutorAgent")
except ImportError as e:
    logging.error(f"Failed to import SOPExecutorAgent: {e}")
    logging.error(f"Available files in {sop_executor_path}: {list(sop_executor_path.iterdir())}")
    # 创建一个模拟的 Agent 类
    logging.warning("无法导入 SOPExecutorAgent，使用模拟实现")
    class SOPExecutorAgent:
        def __init__(self):
            logging.info("SOPExecutorAgent (模拟) 初始化完毕")

        def execute_step(self, plan_step: str, incident_context: dict, chat_history: list) -> dict:
            return {"output": f"模拟执行步骤: {plan_step}"}


# --- 用于在 API 和服务之间传递状态的数据模型 ---

class ExecutionState(BaseModel):
    """用于保存暂停的执行状态的模型"""
    plan: List[str]
    current_step_index: int
    incident_context: Dict[str, Any]
    chat_history_tuples: List[tuple] # Pydantic 不能直接存 AIMessage, 转为 tuple
    completed_steps: List[Dict[str, Any]] = [] # 已完成的步骤历史

class ExecutionStepResult(BaseModel):
    status: str # "in_progress", "needs_approval", "failed", "completed"
    step: int
    step_description: str
    tool_input: str = None
    tool_output: str = None
    state_token: str = None # 用于恢复执行的令牌
    message: str = None
    agent_thoughts: Optional[str] = None # Agent思考过程
    tool_calls: Optional[str] = None # Agent工具调用详情
    completed_steps: List[Dict[str, Any]] = [] # 已完成的步骤历史

# --- 服务本身 ---

# 全局状态缓存（跨请求共享）
_global_state_cache: Dict[str, ExecutionState] = {}

class SOPExecutionService:

    def __init__(self):
        # Service 持有 Agent 实例
        self.agent = SOPExecutorAgent()
        # 使用全局缓存而不是实例缓存
        self.state_cache = _global_state_cache
        logging.info("SOPExecutionService 初始化完毕。")

    def _convert_history_to_messages(self, history_tuples: List[tuple]) -> List:
        """将元组转回 LangChain 消息对象"""
        messages = []
        for type, content in history_tuples:
            if type == "human":
                messages.append(HumanMessage(content=content))
            elif type == "ai":
                messages.append(AIMessage(content=content))
        return messages

    def _convert_messages_to_tuples(self, messages: List) -> List[tuple]:
        """将 LangChain 消息对象转为可序列化的元组"""
        tuples = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                tuples.append(("human", msg.content))
            elif isinstance(msg, AIMessage):
                tuples.append(("ai", msg.content))
        return tuples

    async def start_plan_execution(
        self, 
        plan: List[str], 
        incident_context: Dict[str, Any]
    ) -> ExecutionStepResult:
        """
        开始执行一个新计划。
        """
        logging.info(f"开始执行新计划，共 {len(plan)} 步。")
        state = ExecutionState(
            plan=plan,
            current_step_index=0,
            incident_context=incident_context,
            chat_history_tuples=[]
        )
        return await self._run_next_step(state)

    async def resume_plan_execution(
        self,
        state_token: str,
        approved_query: str
    ) -> ExecutionStepResult:
        """
        在获得人工批准后，恢复执行。
        """
        logging.info(f"收到恢复执行请求，令牌: {state_token}")
        logging.info(f"批准的查询: {approved_query[:100]}...")

        state = self.state_cache.get(state_token)
        if not state:
            logging.error("状态令牌无效或已过期")
            return ExecutionStepResult(
                status="failed",
                step=0,
                step_description="状态已过期",
                message="执行状态已过期或无效。"
            )

        # 解析approved_query - 可能是JSON字符串
        actual_query = approved_query
        try:
            query_json = json.loads(approved_query)
            if isinstance(query_json, dict) and 'query' in query_json:
                actual_query = query_json['query']
                logging.info(f"从JSON中提取到SQL: {actual_query[:100]}...")
        except (json.JSONDecodeError, TypeError):
            # 不是JSON，直接使用原始字符串
            pass

        # 直接执行批准的SQL（不通过LLM）
        try:
            # 导入工具模块
            import sys
            from pathlib import Path
            tools_path = Path(__file__).parent.parent.parent.parent / "modules" / "sop_executor" / "src"
            if str(tools_path) not in sys.path:
                sys.path.insert(0, str(tools_path))

            from tools import execute_sql_write_query

            # 直接执行已批准的写操作
            logging.info("直接执行已批准的SQL...")
            result = execute_sql_write_query.invoke({
                "query": approved_query,
                "approval_granted": True
            })
            logging.info(f"批准后执行结果: {result}")

            # 更新聊天历史
            chat_history = self._convert_history_to_messages(state.chat_history_tuples)
            chat_history.append(HumanMessage(content=f"人工批准执行: {approved_query}"))
            chat_history.append(AIMessage(content=f"执行成功: {result}"))
            state.chat_history_tuples = self._convert_messages_to_tuples(chat_history)

            # 将批准的步骤添加到历史中（在增加索引之前）
            completed_step = {
                "step": state.current_step_index,
                "step_description": state.plan[state.current_step_index] if state.current_step_index < len(state.plan) else "N/A",
                "tool_output": str(result),
                "agent_thoughts": "人工批准执行",
                "tool_calls": f"批准执行SQL: {approved_query}",
                "status": "completed"
            }
            state.completed_steps.append(completed_step)
            
            # 步骤完成，进入下一步
            state.current_step_index += 1

            # 继续执行后续步骤
            next_result = await self._run_next_step(state)
            # 确保返回的结果包含当前的 completed_steps
            next_result.completed_steps = state.completed_steps
            return next_result

        except Exception as e:
            logging.error(f"批准后执行失败: {e}", exc_info=True)
            return ExecutionStepResult(
                status="failed",
                step=state.current_step_index,
                step_description=state.plan[state.current_step_index] if state.current_step_index < len(state.plan) else "N/A",
                message=f"批准后执行失败: {str(e)}",
                tool_output=str(e),
                completed_steps=state.completed_steps
            )

    async def continue_next_step(self, state_token: str) -> ExecutionStepResult:
        """
        继续执行下一步（用于手动控制的逐步执行）
        """
        logging.info(f"收到继续执行请求，令牌: {state_token}")
        
        state = self.state_cache.get(state_token)
        if not state:
            logging.error("状态令牌无效或已过期")
            return ExecutionStepResult(
                status="failed",
                step=0,
                step_description="状态已过期",
                message="执行状态已过期或无效。"
            )
        
        # 继续执行下一步
        result = await self._run_next_step(state)
        return result

    async def _run_next_step(self, state: ExecutionState) -> ExecutionStepResult:
        """
        【核心编排逻辑】执行当前步骤，并处理结果。
        """
        if state.current_step_index >= len(state.plan):
            logging.info(f"计划执行完成，返回completed状态。completed_steps数量: {len(state.completed_steps)}")
            
            # 调用 Agent 4 生成执行摘要
            try:
                from .agent_4_integration import get_sop_summary_service
                summary_service = get_sop_summary_service()
                
                # 计算执行时间（简化计算）
                execution_time_hours = len(state.completed_steps) * 0.5  # 假设每个步骤平均0.5小时
                
                summary_result = summary_service.generate_execution_summary(
                    incident_id=state.incident_context.get("incident_id") or "UNKNOWN",
                    completed_steps=state.completed_steps,
                    execution_status="completed",
                    execution_notes="SOP execution completed successfully",
                    total_execution_time_hours=execution_time_hours
                )
                
                if summary_result.get("success"):
                    logging.info(f"Agent 4 摘要生成成功: {summary_result.get('summary_path')}")
                else:
                    logging.warning(f"Agent 4 摘要生成失败: {summary_result.get('error')}")
                    
            except Exception as e:
                logging.error(f"调用 Agent 4 生成摘要时出错: {e}")
            
            return ExecutionStepResult(
                status="completed",
                step=state.current_step_index - 1,  # 返回最后一个执行的步骤编号
                step_description="N/A",
                message="计划已成功执行完毕。",
                completed_steps=state.completed_steps
            )
        
        current_step_desc = state.plan[state.current_step_index]
        chat_history = self._convert_history_to_messages(state.chat_history_tuples)
        
        # --- 1. 调用 Agent 执行单一步骤 ---
        agent_response = self.agent.execute_step(
            plan_step=current_step_desc,
            incident_context=state.incident_context,
            chat_history=chat_history,
            step_number=state.current_step_index
        )
        
        agent_output = agent_response.get("output", "Agent 没有返回 output。")
        
        # --- 2. 更新历史记录 ---
        # (我们总是保存历史，无论成功与否)
        chat_history.append(HumanMessage(content=agent_response.get("input", current_step_desc)))
        chat_history.append(AIMessage(content=agent_output))
        state.chat_history_tuples = self._convert_messages_to_tuples(chat_history)

        # --- 3. 分析 Agent 的输出 ---
        try:
            # 尝试看 Agent 的输出是不是工具返回的 JSON
            tool_output_json = json.loads(agent_output)
            
            # A. 检查是否需要人工批准 (HITL)
            if isinstance(tool_output_json, dict) and tool_output_json.get("status") == "needs_approval":
                logging.warning(f"步骤 {state.current_step_index + 1} 需要人工批准。暂停执行。")
                
                # 保存状态并返回令牌
                state_token = f"exec_token_{hash(tuple(state.plan))}_{state.current_step_index}"
                self.state_cache[state_token] = state
                
                return ExecutionStepResult(
                    status="needs_approval",
                    step=state.current_step_index,
                    step_description=current_step_desc,
                    tool_output=agent_output, # 包含 "needs_approval" 和 "query"
                    state_token=state_token,
                    message="高危操作，等待人工批准。",
                    agent_thoughts=agent_response.get("agent_thoughts"),
                    tool_calls=agent_response.get("tool_calls"),
                    completed_steps=state.completed_steps
                )

            # B. 检查是否是工具的成功写入
            if isinstance(tool_output_json, dict) and tool_output_json.get("status") == "success":
                # 写入成功
                pass
                
        except json.JSONDecodeError:
            # Agent 的输出不是 JSON (例如只是 'OK' 或 '查询结果: [...]')
            # 这是正常情况
            pass
        except Exception as e:
            # Agent 执行或输出解析失败
            logging.error(f"步骤 {state.current_step_index} 失败: {e}")
            return ExecutionStepResult(
                status="failed",
                step=state.current_step_index,
                step_description=current_step_desc,
                tool_output=agent_output,
                message=f"步骤执行失败: {e}",
                agent_thoughts=agent_response.get("agent_thoughts"),
                tool_calls=agent_response.get("tool_calls"),
                completed_steps=state.completed_steps
            )

        # --- 4. 成功，进入下一步 ---
        logging.info(f"步骤 {state.current_step_index + 1} ('{current_step_desc}') 执行成功。")
        
        # 将完成的步骤添加到历史中（在增加索引之前）
        completed_step = {
            "step": state.current_step_index,
            "step_description": current_step_desc,
            "tool_output": agent_output,
            "agent_thoughts": agent_response.get("agent_thoughts"),
            "tool_calls": agent_response.get("tool_calls"),
            "status": "completed"
        }
        state.completed_steps.append(completed_step)
        logging.info(f"步骤 {state.current_step_index + 1} 已添加到completed_steps，当前completed_steps数量: {len(state.completed_steps)}")
        
        # 增加步骤索引
        state.current_step_index += 1

        # 检查是否还有更多步骤
        if state.current_step_index >= len(state.plan):
            # 所有步骤已完成，返回 completed 状态
            logging.info(f"计划执行完成，返回completed状态。completed_steps数量: {len(state.completed_steps)}")
            
            # 调用 Agent 4 生成执行摘要
            try:
                from .agent_4_integration import get_sop_summary_service
                summary_service = get_sop_summary_service()
                
                # 计算执行时间（简化计算）
                execution_time_hours = len(state.completed_steps) * 0.5  # 假设每个步骤平均0.5小时
                
                summary_result = summary_service.generate_execution_summary(
                    incident_id=state.incident_context.get("incident_id") or "UNKNOWN",
                    completed_steps=state.completed_steps,
                    execution_status="completed",
                    execution_notes="SOP execution completed successfully",
                    total_execution_time_hours=execution_time_hours
                )
                
                if summary_result.get("success"):
                    logging.info(f"Agent 4 摘要生成成功: {summary_result.get('summary_path')}")
                else:
                    logging.warning(f"Agent 4 摘要生成失败: {summary_result.get('error')}")
                    
            except Exception as e:
                logging.error(f"调用 Agent 4 生成摘要时出错: {e}")
            
            return ExecutionStepResult(
                status="completed",
                step=state.current_step_index - 1,  # 返回最后一个执行的步骤编号
                step_description="N/A",
                message="计划已成功执行完毕。",
                completed_steps=state.completed_steps
            )
        else:
            # 还有更多步骤，返回 in_progress 状态，等待用户手动继续
            state_token = f"exec_token_{hash(tuple(state.plan))}_{state.current_step_index}"
            self.state_cache[state_token] = state
            
            return ExecutionStepResult(
                status="in_progress",
                step=state.current_step_index - 1,  # 返回刚完成的步骤编号
                step_description=current_step_desc,
                tool_output=agent_output,
                state_token=state_token,
                message=f"Step {state.current_step_index} Execution complete. Awaiting next step",
                agent_thoughts=agent_response.get("agent_thoughts"),
                tool_calls=agent_response.get("tool_calls"),
                completed_steps=state.completed_steps
            )
