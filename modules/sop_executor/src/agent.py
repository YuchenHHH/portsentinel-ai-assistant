import logging
import json
from typing import List, Dict, Any
from langchain_openai import AzureChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# 导入我们修改过的工具
try:
    from . import tools
    from .database_interface import get_database_schema
except ImportError:
    # 如果相对导入失败，尝试直接导入
    import tools
    try:
        from database_interface import get_database_schema
    except ImportError:
        # 如果还是失败，定义一个简单的函数
        def get_database_schema():
            return "数据库表结构：\n- 'container' table: 包含 cntr_no, vessel_id, eta_ts, created_at 等字段" 

# 【关键的系统提示词】(取自 kan-yim 仓库，因为它写得很好)
SYSTEM_PROMPT = """你是一个"港口运营SOP执行助手"（Port Operations SOP Execution Assistant）。
你的唯一职责是作为一名技术专家，严格、安全、并按顺序地执行一个预先定义好的事件解决方案。你将一次收到一个计划步骤。

你的行为准则如下：
1.  **严格遵循计划：**
    * 你必须严格执行提供给你的当前步骤。
    * 严禁偏离计划、跳过步骤、添加额外步骤。

2.  **精确使用工具：**
    * 你拥有一套工具，包括 `execute_sql_read_query` (只读) 和 `execute_sql_write_query` (写入)。
    * 当计划步骤描述需要查询数据库时，你必须根据步骤描述编写相应的SQL语句并立即执行。
    * 对于查询操作，使用 `execute_sql_read_query` 工具。
    * 对于删除、更新、插入操作，使用 `execute_sql_write_query` 工具。
    * **关键：严格按照步骤描述中的表名、字段名、条件等编写SQL语句，不要使用步骤中未提到的表名。**
    * **如果步骤中包含完整的SQL语句，请直接执行该SQL语句。**
    * 不要询问更多信息，直接根据步骤描述执行相应的操作。

3.  **安全第一（人工审批）：**
    * 涉及 `DELETE`、`UPDATE` 的操作是高风险的。
    * `execute_sql_write_query` 工具在其描述中会明确指出它需要 'approval_granted' 标志。
    * 你的任务是**始终**用 `approval_granted=False` 来调用它，除非历史消息明确指示你已获得批准。
    * 当工具返回 "needs_approval" 时，这代表你的任务已完成，只需报告这个结果即可。

4.  **清晰报告结果：**
    * 在每次调用工具后，你必须将工具返回的完整输出结果作为你的回复。

5.  **立即执行：**
    * 收到计划步骤后，立即分析步骤内容并执行相应的操作。
    * 不要要求更多信息，直接根据步骤描述执行操作。
"""

class SOPExecutorAgent:
    
    def __init__(self):
        self.llm = AzureChatOpenAI(
            temperature=0,
            deployment_name="gpt-4.1-mini",  # 使用现有的部署
            api_version="2025-01-01-preview"
        )
        self.tools = [
            tools.get_database_schema,
            tools.execute_sql_read_query,
            tools.execute_sql_write_query,
        ]
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessage(content="{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        agent = create_openai_tools_agent(self.llm, self.tools, prompt)
        
        self.agent_executor = AgentExecutor(
            agent=agent, 
            tools=self.tools, 
            verbose=True,
            handle_parsing_errors=True # 增加稳定性
        )
        logging.info("SOPExecutorAgent 初始化完毕。")

    def execute_step(self, plan_step: str, incident_context: Dict[str, Any], chat_history: List) -> Dict[str, Any]:
        """
        【关键方法】只执行一个步骤。
        由外部的 'Orchestrator' 调用。
        """
        logging.info(f"Agent 开始执行步骤: {plan_step}")
        
        input_prompt = (
            f"### 事件上下文:\n{json.dumps(incident_context, indent=2)}\n\n"
            f"### 当前计划步骤:\n{plan_step}\n\n"
            f"### 数据库信息:\n"
            f"- 数据库类型: MySQL\n"
            f"- 数据库名: appdb\n"
            f"- 表结构:\n{get_database_schema()}\n\n"
            f"### 执行指令:\n请严格按照上述步骤描述执行操作。特别注意：\n"
            f"1. 这是MySQL数据库，使用MySQL语法\n"
            f"2. 如果步骤中提到查询某个表，请使用步骤中明确指定的表名\n"
            f"3. 如果步骤中包含SQL语句，请直接执行该SQL语句\n"
            f"4. 不要使用步骤中未提到的表名\n"
            f"5. 不要查询information_schema，直接查询指定的表\n"
            f"6. 立即执行，不要询问更多信息"
        )
        
        try:
            response = self.agent_executor.invoke({
                "input": input_prompt,
                "chat_history": chat_history
            })
            
            # 提取Agent的思考过程和工具调用信息
            agent_thoughts = []
            tool_calls = []
            
            # 从中间步骤中提取思考过程
            if 'intermediate_steps' in response:
                for step in response['intermediate_steps']:
                    if isinstance(step, tuple) and len(step) == 2:
                        action, observation = step
                        if hasattr(action, 'log'):
                            agent_thoughts.append(f"🤔 Agent思考: {action.log}")
                        if hasattr(action, 'tool'):
                            tool_calls.append(f"🔧 调用工具: {action.tool}")
                            if hasattr(action, 'tool_input'):
                                tool_calls.append(f"📝 工具输入: {action.tool_input}")
                        if observation:
                            tool_calls.append(f"📊 工具返回: {observation}")
            
            # 从Agent的输出中提取更多信息
            agent_output = response.get('output', '')
            if 'Invoking:' in agent_output:
                # 提取工具调用信息
                lines = agent_output.split('\n')
                for line in lines:
                    if 'Invoking:' in line:
                        tool_calls.append(f"🔧 实际执行: {line.strip()}")
                    elif 'Finished chain.' in line:
                        tool_calls.append(f"✅ 执行完成: {line.strip()}")
            
            # 如果没有找到思考过程，尝试从输出中提取
            if not agent_thoughts and not tool_calls:
                # 分析输出内容
                if "查询失败" in agent_output or "表" in agent_output:
                    agent_thoughts.append(f"🤔 Agent分析: 尝试执行数据库查询操作")
                    agent_thoughts.append(f"📋 步骤理解: {plan_step}")
                
                if "Invoking:" in agent_output:
                    tool_calls.append(f"🔧 工具调用: 从输出中检测到工具调用")
            
            # 构建增强的响应
            enhanced_response = {
                'output': agent_output,
                'agent_thoughts': '\n'.join(agent_thoughts) if agent_thoughts else f"Agent正在分析步骤: {plan_step}",
                'tool_calls': '\n'.join(tool_calls) if tool_calls else "Agent正在准备执行数据库操作...",
                'original_response': response
            }
            
            return enhanced_response
            
        except Exception as e:
            logging.error(f"Agent 步骤执行失败: {e}", exc_info=True)
            return {
                "output": f"执行失败: {str(e)}",
                "agent_thoughts": f"执行过程中发生错误: {str(e)}",
                "tool_calls": None
            }
