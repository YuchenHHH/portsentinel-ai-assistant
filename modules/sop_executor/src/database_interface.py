import pymysql
import logging
from typing import List, Dict, Any, Tuple

# 数据库连接配置 - 连接到 appdb 数据库
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # 使用 root 用户，你可以根据需要修改
    'password': 'x1uktrew',  # 使用正确的密码
    'database': 'appdb',  # 连接到 appdb 数据库
    'cursorclass': pymysql.cursors.DictCursor,
    'charset': 'utf8mb4'
}

def update_db_config(new_config: dict):
    """
    动态更新数据库配置
    """
    global DB_CONFIG
    DB_CONFIG.update(new_config)
    logging.info(f"数据库配置已更新: {DB_CONFIG}")

def get_db_connection():
    """获取数据库连接"""
    try:
        # 注意：每次都创建新连接效率低下，生产中应使用连接池
        connection = pymysql.connect(**DB_CONFIG)
        return connection
    except pymysql.MySQLError as e:
        logging.error(f"数据库连接失败: {e}")
        raise

def execute_read_query(query: str) -> List[Dict[str, Any]]:
    """执行只读查询 (SELECT)"""
    logging.info(f"执行只读查询: {query[:100]}...")
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query)
                result = cursor.fetchall()
                return result
    except pymysql.MySQLError as e:
        logging.error(f"只读查询失败: {e}")
        raise

def execute_write_query(query: str) -> Dict[str, Any]:
    """执行写入查询 (DELETE, UPDATE, INSERT)"""
    logging.warning(f"执行写入查询: {query[:100]}...")
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                affected_rows = cursor.execute(query)
                connection.commit()
                return {"status": "success", "affected_rows": affected_rows}
    except pymysql.MySQLError as e:
        logging.error(f"写入查询失败: {e}")
        try:
            connection.rollback()
        except:
            pass  # 如果连接已经关闭，忽略 rollback 错误
        raise

def get_database_schema() -> str:
    """获取数据库 schema (动态查询)"""
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                # 查询当前数据库的所有表
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                
                schema_info = "数据库表结构：\n"
                for table in tables:
                    table_name = list(table.values())[0]
                    schema_info += f"\n- '{table_name}' table:\n"
                    
                    # 查询表结构
                    cursor.execute(f"DESCRIBE {table_name}")
                    columns = cursor.fetchall()
                    
                    for column in columns:
                        column_name = column['Field']
                        column_type = column['Type']
                        schema_info += f"    - '{column_name}' ({column_type})\n"
                
                return schema_info
    except Exception as e:
        logging.error(f"获取数据库schema失败: {e}")
        return f"获取数据库schema失败: {str(e)}"
