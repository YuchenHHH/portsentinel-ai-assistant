"""
执行摘要 API 端点
提供 SOP 执行摘要和 Agent 4 功能
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging
import os
from pathlib import Path

from app.services.agent_4_integration import get_sop_summary_service

router = APIRouter()

@router.post("/generate/{incident_id}")
async def generate_execution_summary(
    incident_id: str,
    execution_status: str = "completed",
    execution_notes: str = "",
    total_execution_time_hours: float = 0.0,
    completed_steps: Optional[list] = None
):
    """
    为指定事件Generate Summary
    
    Args:
        incident_id: 事件ID
        execution_status: 执行状态 (completed, failed, timeout)
        execution_notes: 执行备注
        total_execution_time_hours: 总执行时间（小时）
        completed_steps: 已完成的步骤列表
    
    Returns:
        执行摘要结果
    """
    try:
        logging.info(f"收到Generate Summary请求 - 事件ID: {incident_id}")
        
        summary_service = get_sop_summary_service()
        
        # 如果没有提供 completed_steps，使用空列表
        if completed_steps is None:
            completed_steps = []
        
        result = summary_service.generate_execution_summary(
            incident_id=incident_id,
            completed_steps=completed_steps,
            execution_status=execution_status,
            execution_notes=execution_notes,
            total_execution_time_hours=total_execution_time_hours
        )
        
        if result.get("success"):
            logging.info(f"执行摘要生成成功 - 事件ID: {incident_id}")
            return {
                "success": True,
                "incident_id": incident_id,
                "summary": result
            }
        else:
            logging.error(f"执行摘要生成失败 - 事件ID: {incident_id}, 错误: {result.get('error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"执行摘要生成失败: {result.get('error')}"
            )
            
    except Exception as e:
        logging.error(f"Generate Summary时发生错误: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Generate Summary时发生错误: {str(e)}"
        )

@router.get("/status")
async def get_summary_service_status():
    """
    获取摘要服务状态
    
    Returns:
        服务状态信息
    """
    try:
        summary_service = get_sop_summary_service()
        return {
            "status": "healthy",
            "service": "SOP Execution Summary Service",
            "agent_4_integration": "enabled",
            "message": "服务正常运行"
        }
    except Exception as e:
        logging.error(f"获取摘要服务状态时发生错误: {e}")
        return {
            "status": "error",
            "service": "SOP Execution Summary Service",
            "error": str(e),
            "message": "服务状态异常"
        }

@router.get("/markdown/{incident_id}")
async def get_summary_markdown(
    incident_id: str
):
    """
    获取指定事件的执行摘要 Markdown 内容
    如果 incident_id 为 "latest"，则返回最新的摘要文件
    """
    try:
        import os
        from pathlib import Path
        
        # 使用绝对路径
        summaries_dir = Path("/backend/execution_summaries")
        
        if incident_id == "latest":
            # 获取最新的摘要文件
            summary_files = list(summaries_dir.glob("resolution_summary_*.md"))
            if not summary_files:
                raise HTTPException(
                    status_code=404,
                    detail="未找到任何摘要文件"
                )
            
            # 优先选择内容最完整的文件（文件大小最大的）
            # 如果文件大小相同，则选择最新的
            latest_file = max(summary_files, key=lambda f: (f.stat().st_size, os.path.getctime(f)))
        else:
            # 查找指定事件的摘要文件
            summary_files = list(summaries_dir.glob(f"resolution_summary_{incident_id}_*.md"))
            if not summary_files:
                raise HTTPException(
                    status_code=404,
                    detail=f"未找到事件 {incident_id} 的摘要文件"
                )
            latest_file = max(summary_files, key=os.path.getctime)
        
        # 读取 Markdown 内容
        with open(latest_file, 'r', encoding='utf-8') as f:
            markdown_content = f.read()
        
        return {
            "success": True,
            "incident_id": incident_id,
            "file_path": str(latest_file),
            "markdown_content": markdown_content,
            "file_name": latest_file.name
        }
        
    except Exception as e:
        logging.error(f"获取摘要 Markdown 内容时发生错误: {e}")
        import traceback
        logging.error(f"错误堆栈: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"获取摘要内容失败: {str(e)}"
        )

@router.get("/local-latest")
async def get_local_latest_summary():
    """
    获取本地文件系统中最新的执行摘要 Markdown 文件
    """
    try:
        # 使用绝对路径
        summaries_dir = Path("/Users/huangyuchen/Desktop/workspace/backend/execution_summaries")
        
        if not summaries_dir.exists():
            raise HTTPException(
                status_code=404,
                detail="执行摘要目录不存在"
            )
        
        # 获取所有 .md 文件
        summary_files = list(summaries_dir.glob("*.md"))
        if not summary_files:
            raise HTTPException(
                status_code=404,
                detail="未找到任何摘要文件"
            )
        
        # 按修改时间排序，获取最新的文件
        latest_file = max(summary_files, key=os.path.getmtime)
        
        # 读取 Markdown 内容
        with open(latest_file, 'r', encoding='utf-8') as f:
            markdown_content = f.read()
        
        # 从文件名中提取事件ID
        file_name = latest_file.name
        incident_id = "UNKNOWN"
        if "resolution_summary_" in file_name:
            parts = file_name.replace("resolution_summary_", "").replace(".md", "").split("_")
            if len(parts) >= 1:
                incident_id = parts[0]
        
        return {
            "success": True,
            "incident_id": incident_id,
            "file_path": str(latest_file),
            "markdown_content": markdown_content,
            "file_name": file_name,
            "file_size": latest_file.stat().st_size,
            "last_modified": os.path.getmtime(latest_file)
        }
        
    except Exception as e:
        logging.error(f"获取本地最新摘要文件时发生错误: {e}")
        import traceback
        logging.error(f"错误堆栈: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"获取本地摘要文件失败: {str(e)}"
        )

