import logging
import json
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from langchain.tools import tool

# 导入数据库接口
try:
    from . import database_interface as db_interface
except ImportError:
    # 如果相对导入失败，尝试直接导入
    import database_interface as db_interface

class SQLQuery(BaseModel):
    query: str = Field(..., description="要执行的 SQL 查询语句")

class SQLWriteQuery(BaseModel):
    query: str = Field(..., description="要执行的 SQL 写入 (DELETE, UPDATE, INSERT) 查询语句")
    approval_granted: bool = Field(False, description="此高危操作是否已获得人工批准。默认为 False。")

@tool("get_database_schema")
def get_database_schema() -> str:
    """
    检索数据库的 schema，显示所有表格及其列名和数据类型。
    """
    try:
        return db_interface.get_database_schema()
    except Exception as e:
        return f"获取 Schema 失败: {str(e)}"

@tool("execute_sql_read_query", args_schema=SQLQuery)
def execute_sql_read_query(query: str) -> str:
    """
    安全地执行一个 SQL 'SELECT' 只读查询以从数据库获取信息。
    严禁用于修改、删除或插入数据。
    """
    try:
        result = db_interface.execute_read_query(query)
        return json.dumps(result, default=str) # 确保 datetime 等对象可以序列化
    except Exception as e:
        return f"Read-only query failed: {str(e)}"

@tool("execute_sql_write_query", args_schema=SQLWriteQuery)
def execute_sql_write_query(query: str, approval_granted: bool = False) -> str:
    """
    Execute a high-risk SQL write operation (DELETE, UPDATE, INSERT).
    WARNING: Unless 'approval_granted' is True, this tool will NOT execute the query,
    but will return a message requesting approval.
    """
    logging.info(f"Received write request: {query[:100]}... approved: {approval_granted}")
    
    # Preflight: block unresolved placeholders to avoid SQL errors (regardless of approval)
    placeholder_detected = (('<' in query and re.search(r'<[^>]+>', query)) or (':' in query and re.search(r':\w+', query)))
    if placeholder_detected:
        logging.warning("Placeholders detected in SQL; execution blocked until actual values are provided.")
        return json.dumps({
            "status": "invalid_parameters",
            "message": "Unresolved placeholders found in SQL (e.g., <active_vessel_advice_no>). Replace with actual values before execution.",
            "query": query
        })

    # Human-in-the-loop approval check
    if not approval_granted:
        logging.warning("Approval required. Execution paused.")
        return json.dumps({
            "status": "needs_approval",
            "message": "High-risk operation requires human approval before execution.",
            "query": query
        })

    # 如果批准了，才真正执行
    try:
        result = db_interface.execute_write_query(query)
        return json.dumps(result, default=str)
    except Exception as e:
        return f"Write query failed: {str(e)}"