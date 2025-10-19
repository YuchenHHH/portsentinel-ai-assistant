import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import pymysql
import json

from app.api.v1.schemas.database import (
    DatabaseConfigRequest, 
    DatabaseConfigResponse, 
    DatabaseTestRequest
)

router = APIRouter()

# 全局数据库配置存储
current_db_config = None

def get_current_db_config():
    """获取当前数据库配置"""
    return current_db_config

@router.post("/test-connection", response_model=DatabaseConfigResponse)
async def test_database_connection(request: DatabaseTestRequest):
    """
    测试数据库连接
    """
    try:
        logging.info(f"测试数据库连接: {request.host}:{request.port}/{request.database}")
        
        # 构建连接配置
        config = {
            'host': request.host,
            'user': request.user,
            'password': request.password,
            'database': request.database,
            'port': request.port,
            'cursorclass': pymysql.cursors.DictCursor,
            'charset': 'utf8mb4'
        }
        
        # 测试连接
        connection = pymysql.connect(**config)
        
        # 获取数据库信息
        with connection.cursor() as cursor:
            # 使用更兼容的 SQL 语法
            cursor.execute("SELECT DATABASE() as current_database, VERSION() as mysql_version")
            db_info = cursor.fetchone()
            
            # 获取当前用户信息（使用更安全的方式）
            try:
                cursor.execute("SELECT USER() as current_user")
                user_info = cursor.fetchone()
                if user_info:
                    db_info['current_user'] = user_info.get('current_user')
            except Exception:
                # 如果 USER() 函数不支持，使用连接信息
                db_info['current_user'] = f"{config['user']}@{config['host']}"
            
            # 获取表列表
            try:
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                db_info['tables'] = [list(table.values())[0] for table in tables]
            except Exception:
                db_info['tables'] = []
        
        connection.close()
        
        return DatabaseConfigResponse(
            success=True,
            message="数据库连接成功",
            database_info=db_info
        )
        
    except pymysql.MySQLError as e:
        logging.error(f"数据库连接失败: {e}")
        return DatabaseConfigResponse(
            success=False,
            message=f"数据库连接失败: {str(e)}"
        )
    except Exception as e:
        logging.error(f"连接测试异常: {e}")
        return DatabaseConfigResponse(
            success=False,
            message=f"连接测试异常: {str(e)}"
        )

@router.post("/configure", response_model=DatabaseConfigResponse)
async def configure_database(request: DatabaseConfigRequest):
    """
    配置数据库连接
    """
    global current_db_config
    
    try:
        logging.info(f"配置数据库连接: {request.host}:{request.port}/{request.database}")
        
        # 首先测试连接
        test_request = DatabaseTestRequest(
            host=request.host,
            user=request.user,
            password=request.password,
            database=request.database,
            port=request.port
        )
        
        test_result = await test_database_connection(test_request)
        
        if test_result.success:
            # 保存配置到全局变量
            global current_db_config
            current_db_config = {
                'host': request.host,
                'user': request.user,
                'password': request.password,
                'database': request.database,
                'port': request.port,
                'cursorclass': pymysql.cursors.DictCursor,
                'charset': 'utf8mb4'
            }
            logging.info(f"数据库配置已保存: {request.host}:{request.port}/{request.database}")
            logging.info(f"当前配置: {current_db_config}")
            
            # 更新 SOP 执行器的数据库配置
            await update_sop_executor_config(current_db_config)
            
            return DatabaseConfigResponse(
                success=True,
                message="数据库配置成功并已保存",
                database_info=test_result.database_info
            )
        else:
            return test_result
            
    except Exception as e:
        logging.error(f"数据库配置异常: {e}")
        return DatabaseConfigResponse(
            success=False,
            message=f"数据库配置异常: {str(e)}"
        )

@router.get("/status", response_model=DatabaseConfigResponse)
async def get_database_status():
    """
    获取当前数据库连接状态
    """
    global current_db_config
    
    if not current_db_config:
        return DatabaseConfigResponse(
            success=False,
            message="数据库未配置"
        )
    
    try:
        # 测试当前配置
        logging.info(f"使用配置测试连接: {current_db_config}")
        connection = pymysql.connect(**current_db_config)
        
        with connection.cursor() as cursor:
            # 使用更兼容的 SQL 语法
            cursor.execute("SELECT DATABASE() as current_database")
            db_info = cursor.fetchone()
            
            # 获取当前用户信息（使用更安全的方式）
            try:
                cursor.execute("SELECT USER() as current_user")
                user_info = cursor.fetchone()
                if user_info:
                    db_info['current_user'] = user_info.get('current_user')
            except Exception:
                # 如果 USER() 函数不支持，使用连接信息
                db_info['current_user'] = f"{current_db_config['user']}@{current_db_config['host']}"
        
        connection.close()
        
        return DatabaseConfigResponse(
            success=True,
            message="数据库连接正常",
            database_info=db_info
        )
        
    except Exception as e:
        logging.error(f"数据库状态检查失败: {e}")
        return DatabaseConfigResponse(
            success=False,
            message=f"数据库连接失败: {str(e)}"
        )

async def update_sop_executor_config(config: Dict[str, Any]):
    """
    更新 SOP 执行器的数据库配置
    """
    try:
        # 动态更新 SOP 执行器的数据库配置
        import sys
        from pathlib import Path
        
        # 添加 SOP 执行器路径到 sys.path
        sop_executor_path = Path(__file__).parent.parent.parent.parent / "modules" / "sop_executor" / "src"
        sys.path.insert(0, str(sop_executor_path))
        
        # 导入并更新数据库配置
        import database_interface as db_interface
        db_interface.update_db_config(config)
        
        logging.info("数据库配置已更新，SOP 执行器将使用新配置")
        return True
    except Exception as e:
        logging.error(f"更新 SOP 执行器配置失败: {e}")
        return False

@router.get("/health")
async def health_check():
    """
    健康检查
    """
    return {
        "status": "healthy",
        "service": "Database Configuration API",
        "version": "1.0.0"
    }
