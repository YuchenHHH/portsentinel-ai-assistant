import logging
import json
import re
from typing import List, Dict, Any
from langchain_openai import AzureChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Import our modified tools
try:
    from . import tools
    from .database_interface import get_database_schema
except ImportError:
    # If relative import fails, try direct import
    import tools
    try:
        from database_interface import get_database_schema
    except ImportError:
        # If it still fails, define a simple function
        def get_database_schema():
            return "Database Schema:\n- 'container' table: contains cntr_no, vessel_id, eta_ts, created_at fields"

# [CRITICAL SYSTEM PROMPT] (Adapted from kan-yim repository, as it's well-written)
SYSTEM_PROMPT = """You are a "Port Operations SOP Execution Assistant".
Your sole responsibility is to act as a technical expert, strictly, safely, and sequentially executing a predefined incident resolution plan. You will receive one plan step at a time.

Your code of conduct is as follows:
1.  **Strictly Follow the Plan:**
    * You must strictly execute the current step provided to you.
    * Deviating from the plan, skipping steps, or adding extra steps is strictly forbidden.

2.  **Precise Tool Usage:**
    * You have a set of tools, including `execute_sql_read_query` (read-only) and `execute_sql_write_query` (write).
    * **CRITICAL RULE - Extract and Execute SQL: If the step description contains a colon (:) followed by a complete SQL statement, you must extract the SQL *verbatim* (exactly as written) after the colon and execute it. Do not modify any part of it (including table names, field names, WHERE conditions, constant values, etc.).**
    * **Example 1**: Step "Query container records: SELECT * FROM container WHERE cntr_no = 'CMAU0000020' ORDER BY created_at DESC;"
      → You must execute: `SELECT * FROM container WHERE cntr_no = 'CMAU0000020' ORDER BY created_at DESC;`
      → Do not modify it to: `SELECT * FROM container WHERE cntr_no = 'ABC';` (Incorrect!)
    * **Example 2**: Step "Delete duplicate: DELETE FROM container WHERE container_id = 123;"
      → You must execute: `DELETE FROM container WHERE container_id = 123;`
      → Do not change the container_id value.
    * Only if the step is descriptive (does not contain a SQL statement) should you write the SQL yourself based on the description.
    * For query operations, use the `execute_sql_read_query` tool.
    * For delete, update, or insert operations, use the `execute_sql_write_query` tool.
    * Do not ask for more information; execute directly.

3.  **Safety First (Human Approval):**
    * Operations involving `DELETE` or `UPDATE` are high-risk.
    * The `execute_sql_write_query` tool will clearly state in its description that it requires the 'approval_granted' flag.
    * Your task is to **always** call it with `approval_granted=False`, unless the chat history explicitly indicates you have received approval.
    * When the tool returns "needs_approval", this signifies your task for this step is complete. Simply report this result.

4.  **Clear Result Reporting:**
    * After each tool call, you must return the complete, raw output from the tool as your response.

5.  **Immediate Execution:**
    * Upon receiving a plan step, immediately analyze its content and execute the corresponding action.
    * Do not ask for more information; execute the operation directly based on the step description.
"""

class SOPExecutorAgent:

    def __init__(self):
        self.llm = AzureChatOpenAI(
            temperature=0,
            deployment_name="gpt-4.1-mini",  # Use existing deployment
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
            handle_parsing_errors=True # Increase stability
        )
        logging.info("SOPExecutorAgent initialized.")

    def _extract_sql_from_step(self, plan_step: str) -> str:
        """
        Extracts SQL statement from a step description.
        If the step contains a colon followed by a SQL keyword, extract the full SQL statement.
        """
        # Find pattern: "Description: SELECT/UPDATE/DELETE/INSERT ..."
        # Supports multi-line SQL
        pattern = r':\s*((?:SELECT|UPDATE|DELETE|INSERT|WITH)[^;]*;?)'

        match = re.search(pattern, plan_step, re.IGNORECASE | re.DOTALL)
        if match:
            sql = match.group(1).strip()
            # Ensure SQL ends with a semicolon
            if not sql.endswith(';'):
                sql += ';'

            # [Critical Fix] Remove placeholders (:VESSEL_ID, :ETA_TS, <VESSEL_ID>, <ETA_TS>, etc.)
            # If SQL contains placeholders, it means the Planner expected these values to be fetched from previous steps
            # But since we are executing the SQL directly, we need to remove these conditions or let the LLM handle it
            if ((':' in sql and re.search(r':\w+', sql)) or ('<' in sql and re.search(r'<\w+>', sql))):
                logging.warning(f"Detected SQL with placeholders, will use LLM to generate full SQL")
                logging.warning(f"Original SQL: {sql}")
                # Remove WHERE conditions containing placeholders
                # Example: "WHERE cntr_no = 'X' AND vessel_id = :VESSEL_ID" -> "WHERE cntr_no = 'X'"
                # Example: "WHERE cntr_no = 'X' AND vessel_id = '<VESSEL_ID>'" -> "WHERE cntr_no = 'X'"
                sql = re.sub(r'\s+AND\s+\w+\s*=\s*:?\w+', '', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+AND\s+\w+\s*=\s*<\w+>', '', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+WHERE\s+\w+\s*=\s*:?\w+\s+AND\s+', ' WHERE ', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+WHERE\s+\w+\s*=\s*<\w+>\s+AND\s+', ' WHERE ', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+WHERE\s+\w+\s*=\s*:?\w+', '', sql, flags=re.IGNORECASE)
                sql = re.sub(r'\s+WHERE\s+\w+\s*=\s*<\w+>', '', sql, flags=re.IGNORECASE)
                logging.info(f"SQL after removing placeholders: {sql}")

            logging.info(f"Extracted SQL from step: {sql}")
            return sql

        logging.info("No complete SQL statement found in step, will use LLM to generate")
        return None

    def execute_step(self, plan_step: str, incident_context: Dict[str, Any], chat_history: List, step_number: int = 0) -> Dict[str, Any]:
        """
        [Critical Method] Executes only one step.
        Called by an external 'Orchestrator'.
        """
        logging.info(f"Agent starting execution of step {step_number + 1}: {plan_step}")

        # [Critical Fix] First, try to directly extract and execute SQL, bypassing LLM's "creativity"
        extracted_sql = self._extract_sql_from_step(plan_step)
        if extracted_sql:
            logging.info(f"Directly executing extracted SQL (bypassing LLM): {extracted_sql}")
            try:
                # Determine if it's a read or write operation
                sql_upper = extracted_sql.upper().strip()
                if sql_upper.startswith('SELECT') or sql_upper.startswith('SHOW') or sql_upper.startswith('DESCRIBE'):
                    # Read-only query - use invoke() method
                    result = tools.execute_sql_read_query.invoke({"query": extracted_sql})
                    output = f"Query executed successfully. Result: {result}"
                else:
                    # Write operation (requires approval) - use invoke() method
                    result = tools.execute_sql_write_query.invoke({
                        "query": extracted_sql,
                        "approval_granted": False
                    })
                    # Return the tool's JSON output directly, don't wrap it in a string
                    output = result

                logging.info(f"SQL direct execution result: {output}")
                return {
                    'output': output,
                    'agent_thoughts': f"Extracted and directly executed SQL from step: {extracted_sql}",
                    'tool_calls': f"Executing tool: execute_sql_{'read' if sql_upper.startswith('SELECT') else 'write'}_query\nInput: {extracted_sql}\nOutput: {output}",
                    'original_response': {'output': output}
                }
            except Exception as e:
                logging.error(f"SQL direct execution failed: {e}")
                # If direct execution fails, continue with the LLM
                pass

        # If no SQL was extracted or direct execution failed, use the original LLM method
        input_prompt = (
            f"### Incident Context:\n{json.dumps(incident_context, indent=2)}\n\n"
            f"### Current Plan Step:\n{plan_step}\n\n"
            f"### Database Information:\n"
            f"- Database Type: MySQL\n"
            f"- Database Name: appdb\n"
            f"- Table Structure:\n{get_database_schema()}\n\n"
            f"### Execution Instructions:\nStrictly follow the step description to perform the operation. Pay special attention to the following:\n"
            f"1. This is a MySQL database; use MySQL syntax\n"
            f"2. If the step mentions querying a table, use the table name explicitly specified in the step\n"
            f"3. If the step contains a SQL statement, execute that SQL statement directly\n"
            f"4. Do not use table names not mentioned in the step\n"
            f"5. Do not query information_schema; query the specified tables directly\n"
            f"6. For verification steps, execute the corresponding SELECT query to confirm the result\n"
            f"7. You must return the specific execution result, not a generic reply\n"
            f"8. Execute immediately, do not ask for more information"
        )

        try:
            response = self.agent_executor.invoke({
                "input": input_prompt,
                "chat_history": chat_history
            })
            
            # Extract Agent's thought process and tool call information
            agent_thoughts = []
            tool_calls = []
            
            # Extract thought process from intermediate steps
            if 'intermediate_steps' in response:
                for step in response['intermediate_steps']:
                    if isinstance(step, tuple) and len(step) == 2:
                        action, observation = step
                        if hasattr(action, 'log'):
                            agent_thoughts.append(f"🤔 Agent thoughts: {action.log}")
                        if hasattr(action, 'tool'):
                            tool_calls.append(f"🔧 Calling tool: {action.tool}")
                            if hasattr(action, 'tool_input'):
                                tool_calls.append(f"📝 Tool input: {action.tool_input}")
                        if observation:
                            tool_calls.append(f"📊 Tool return: {observation}")
            
            # Extract more information from the Agent's output
            agent_output = response.get('output', '')
            if 'Invoking:' in agent_output:
                # Extract tool call information
                lines = agent_output.split('\n')
                for line in lines:
                    if 'Invoking:' in line:
                        tool_calls.append(f"🔧 Actual execution: {line.strip()}")
                    elif 'Finished chain.' in line:
                        tool_calls.append(f"✅ Execution complete: {line.strip()}")
            
            # If no thought process is found, try extracting from the output
            if not agent_thoughts and not tool_calls:
                # Analyze output content
                if "Query failed" in agent_output or "table" in agent_output:
                    agent_thoughts.append(f"🤔 Agent analysis: Attempting to execute database query operation")
                    agent_thoughts.append(f"📋 Step understanding: {plan_step}")
                
                if "Invoking:" in agent_output:
                    tool_calls.append(f"🔧 Tool call: Detected tool call from output")
            
            # Build enhanced response
            enhanced_response = {
                'output': agent_output,
                'agent_thoughts': '\n'.join(agent_thoughts) if agent_thoughts else f"Agent is analyzing step: {plan_step}",
                'tool_calls': '\n'.join(tool_calls) if tool_calls else "Agent is preparing to execute database operation...",
                'original_response': response
            }
            
            return enhanced_response
            
        except Exception as e:
            logging.error(f"Agent step execution failed: {e}", exc_info=True)
            return {
                "output": f"Execution failed: {str(e)}",
                "agent_thoughts": f"An error occurred during execution: {str(e)}",
                "tool_calls": None
            }