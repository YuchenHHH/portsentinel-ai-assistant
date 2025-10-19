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
    * **CRITICAL RULE - 提取并执行SQL: 如果步骤描述中包含冒号(:)后跟完整SQL语句，必须逐字提取冒号后的SQL并执行，绝对不要修改任何部分（包括表名、字段名、WHERE条件、常量值等）。**
    * **示例1**: 步骤 "Query container records: SELECT * FROM container WHERE cntr_no = 'CMAU0000020' ORDER BY created_at DESC;"
      → 你必须执行: `SELECT * FROM container WHERE cntr_no = 'CMAU0000020' ORDER BY created_at DESC;`
      → 不要修改为: `SELECT * FROM container WHERE cntr_no = 'ABC';` (错误!)
    * **示例2**: 步骤 "Delete duplicate: DELETE FROM container WHERE container_id = 123;"
      → 你必须执行: `DELETE FROM container WHERE container_id = 123;`
      → 不要修改container_id的值
    * 如果步骤只是描述性的（不包含SQL语句），才需要根据描述自己编写SQL。
    * 对于查询操作，使用 `execute_sql_read_query` 工具。
    * 对于删除、更新、插入操作，使用 `execute_sql_write_query` 工具。
    * 不要询问更多信息，直接执行。

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

    def _extract_sql_from_step(self, plan_step: str) -> str:
        """
        从步骤描述中提取SQL语句。
        如果步骤包含冒号后跟SQL关键字，提取完整的SQL语句。
        """
        import re

        # 查找模式: "描述: SELECT/UPDATE/DELETE/INSERT ..."
        # 支持多行SQL
        pattern = r':\s*((?:SELECT|UPDATE|DELETE|INSERT|WITH)[^;]*;?)'

        match = re.search(pattern, plan_step, re.IGNORECASE | re.DOTALL)
        if match:
            sql = match.group(1).strip()
            # 确保SQL以分号结尾
            if not sql.endswith(';'):
                sql += ';'

            # 【关键修复】移除占位符（:VESSEL_ID, :ETA_TS等）
            # 如果SQL包含占位符，说明Planner期望这些值从前面的步骤获取
            # 但由于我们直接执行SQL，需要移除这些条件或让LLM处理
            if ':' in sql and re.search(r':\w+', sql):
                logging.warning(f"检测到SQL包含占位符，将使用LLM生成完整SQL")
                logging.warning(f"原始SQL: {sql}")
                # 移除包含占位符的WHERE条件
                # 例如: "WHERE cntr_no = 'X' AND vessel_id = :VESSEL_ID" -> "WHERE cntr_no = 'X'"
                sql = re.sub(r'\s+AND\s+\w+\s*=\s*:\w+', '', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+WHERE\s+\w+\s*=\s*:\w+\s+AND\s+', ' WHERE ', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+WHERE\s+\w+\s*=\s*:\w+', '', sql, flags=re.IGNORECASE)
                logging.info(f"移除占位符后的SQL: {sql}")

            logging.info(f"从步骤中提取到SQL: {sql}")
            return sql

        logging.info("步骤中未找到完整SQL语句，将使用LLM生成")
        return None

    def execute_step(self, plan_step: str, incident_context: Dict[str, Any], chat_history: List) -> Dict[str, Any]:
        """
        【关键方法】只执行一个步骤。
        由外部的 'Orchestrator' 调用。
        """
        logging.info(f"Agent 开始执行步骤: {plan_step}")

        # 【关键修复】先尝试直接提取并执行SQL，绕过LLM的"创造性"
        extracted_sql = self._extract_sql_from_step(plan_step)
        if extracted_sql:
            logging.info(f"直接执行提取的SQL（绕过LLM）: {extracted_sql}")
            try:
                # 判断是读还是写操作
                sql_upper = extracted_sql.upper().strip()
                if sql_upper.startswith('SELECT') or sql_upper.startswith('SHOW') or sql_upper.startswith('DESCRIBE'):
                    # 只读查询 - 使用invoke()方法
                    result = tools.execute_sql_read_query.invoke({"query": extracted_sql})
                    output = f"查询成功执行。结果: {result}"
                else:
                    # 写操作（需要审批）- 使用invoke()方法
                    result = tools.execute_sql_write_query.invoke({
                        "query": extracted_sql,
                        "approval_granted": False
                    })
                    # 直接返回工具的JSON输出，不要包装成字符串
                    output = result

                logging.info(f"SQL直接执行结果: {output}")
                return {
                    'output': output,
                    'agent_thoughts': f"从步骤中提取到SQL并直接执行: {extracted_sql}",
                    'tool_calls': f"执行工具: execute_sql_{'read' if sql_upper.startswith('SELECT') else 'write'}_query\n输入: {extracted_sql}\n输出: {output}",
                    'original_response': {'output': output}
                }
            except Exception as e:
                logging.error(f"SQL直接执行失败: {e}")
                # 如果直接执行失败，继续使用LLM
                pass

        # 如果没有提取到SQL或直接执行失败，使用原来的LLM方式
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
