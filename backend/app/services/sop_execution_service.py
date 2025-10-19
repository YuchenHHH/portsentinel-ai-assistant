import logging
import json
from typing import List, Dict, Any, Union, Optional
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

# 导入在 modules 中定义的 Agent
# (需要正确设置 PYTHONPATH)
try:
    from modules.sop_executor.src.agent import SOPExecutorAgent
except ImportError:
    # 备用路径，根据您的项目结构调整
    import sys
    from pathlib import Path
    sop_executor_path = Path(__file__).parent.parent.parent.parent / "modules" / "sop_executor" / "src"
    sys.path.insert(0, str(sop_executor_path))
    try:
        from agent import SOPExecutorAgent
    except ImportError:
        # 如果仍然失败，创建一个模拟的 Agent 类
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

# --- 服务本身 ---

class SOPExecutionService:
    
    def __init__(self):
        # Service 持有 Agent 实例
        self.agent = SOPExecutorAgent()
        # 模拟一个用于存储暂停状态的数据库 (在生产中，这应该是 Redis 或数据库)
        self.state_cache: Dict[str, ExecutionState] = {}
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
        state = self.state_cache.get(state_token)
        if not state:
            return ExecutionStepResult(
                status="failed", 
                step=0,
                step_description="状态已过期",
                message="执行状态已过期或无效。"
            )
        
        # 1. 更新聊天记录，告知 Agent 它已获得批准
        chat_history = self._convert_history_to_messages(state.chat_history_tuples)
        
        # (这是关键) Agent 的上一步是 AI: "需要批准"
        # 我们添加 Human: "已批准，请执行"
        approval_message = (
            f"人工操作员已批准执行以下高危查询。\n"
            f"请使用 `approval_granted=True` 再次调用 `execute_sql_write_query` 工具。\n"
            f"查询: {approved_query}"
        )
        chat_history.append(HumanMessage(content=approval_message))
        
        # 2. Agent 会再次执行 *同一步骤* (例如 "删除重复记录")
        #    但这次，由于有新的人类消息，它会用 approval_granted=True 来调用工具
        
        # (我们不增加 current_step_index，因为我们是重试上一步)
        state.chat_history_tuples = self._convert_messages_to_tuples(chat_history)
        
        return await self._run_next_step(state)


    async def _run_next_step(self, state: ExecutionState) -> ExecutionStepResult:
        """
        【核心编排逻辑】执行当前步骤，并处理结果。
        """
        if state.current_step_index >= len(state.plan):
            return ExecutionStepResult(
                status="completed",
                step=state.current_step_index,
                step_description="N/A",
                message="计划已成功执行完毕。"
            )
        
        current_step_desc = state.plan[state.current_step_index]
        chat_history = self._convert_history_to_messages(state.chat_history_tuples)
        
        # --- 1. 调用 Agent 执行单一步骤 ---
        agent_response = self.agent.execute_step(
            plan_step=current_step_desc,
            incident_context=state.incident_context,
            chat_history=chat_history
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
                logging.warning(f"步骤 {state.current_step_index} 需要人工批准。暂停执行。")
                
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
                    tool_calls=agent_response.get("tool_calls")
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
                tool_calls=agent_response.get("tool_calls")
            )

        # --- 4. 成功，进入下一步 ---
        logging.info(f"步骤 {state.current_step_index} ('{current_step_desc}') 执行成功。")
        state.current_step_index += 1
        
        # (为了演示，我们递归调用下一步。在 FastAPI 中，您可能会直接返回)
        # return await self._run_next_step(state)
        
        # 在 FastAPI 服务中，您会保存状态并返回 "in_progress"
        # 这里我们假设它会立即进行下一步 (简单起见)
        if state.current_step_index < len(state.plan):
             # 暂时只返回第一步的结果，并提示正在进行
             # 在真实的 API 中，您会把状态保存到 Redis，只返回当前步骤结果
             state_token = f"exec_token_{hash(tuple(state.plan))}_{state.current_step_index}"
             self.state_cache[state_token] = state
             
             return ExecutionStepResult(
                 status="in_progress",
                 step=state.current_step_index - 1, # 返回刚完成的步骤
                 step_description=state.plan[state.current_step_index - 1],
                 tool_output=agent_output,
                 state_token=state_token, # 客户端需要用这个令牌来请求下一步
                 message="步骤成功，准备进行下一步。",
                 agent_thoughts=agent_response.get("agent_thoughts"),
                 tool_calls=agent_response.get("tool_calls")
             )
        else:
             return ExecutionStepResult(
                status="completed",
                step=state.current_step_index - 1,
                step_description=state.plan[state.current_step_index - 1],
                tool_output=agent_output,
                message="计划已成功执行完毕。",
                agent_thoughts=agent_response.get("agent_thoughts"),
                tool_calls=agent_response.get("tool_calls")
            )
