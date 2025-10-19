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
        return f"只读查询失败: {str(e)}"

@tool("execute_sql_write_query", args_schema=SQLWriteQuery)
def execute_sql_write_query(query: str, approval_granted: bool = False) -> str:
    """
    执行一个高危的 SQL 写入操作 (DELETE, UPDATE, INSERT)。
    *** 警告: *** 除非 'approval_granted' 标志为 True，否则此工具不会执行，
    而是会返回一个请求批准的消息。
    """
    logging.info(f"收到写入请求: {query[:100]}... 批准状态: {approval_granted}")
    
    # 【关键的 HITL 检查】
    if not approval_granted:
        logging.warning("需要人工批准。暂停执行。")
        # 返回一个结构化的 JSON，以便编排器可以解析它
        return json.dumps({
            "status": "needs_approval",
            "message": "高危操作需要人工批准才能执行。",
            "query": query
        })

    # 如果批准了，才真正执行
    try:
        result = db_interface.execute_write_query(query)
        return json.dumps(result, default=str)
    except Exception as e:
        return f"写入查询失败: {str(e)}"