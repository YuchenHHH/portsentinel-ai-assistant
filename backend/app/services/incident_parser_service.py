import json
import uuid
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging

# Add the modules directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'modules', 'incident_parser'))

try:
    from src.parsing_agent import IncidentReportParser, parse_incident_report, ParsingError
    AI_MODULE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"AI module not available: {e}")
    AI_MODULE_AVAILABLE = False

logger = logging.getLogger(__name__)


def parse_incident(source_type: str, raw_text: str) -> Dict[str, Any]:
    """
    解析事件报告
    
    Args:
        source_type: 事件来源类型
        raw_text: 原始事件文本
        
    Returns:
        解析后的事件数据
    """
    try:
        logger.info(f"开始解析事件报告，来源类型: {source_type}")
        
        # 检查AI模块是否可用
        if AI_MODULE_AVAILABLE:
            logger.info("使用真实AI模块进行解析")
            return _parse_with_ai_module(source_type, raw_text)
        else:
            logger.info("AI模块不可用，使用模拟解析")
            # 生成唯一的事件ID
            incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            return _simulate_ai_parsing(source_type, raw_text, incident_id)
        
    except Exception as e:
        logger.error(f"事件解析失败: {str(e)}")
        raise Exception(f"解析事件报告时发生错误: {str(e)}")


def _parse_with_ai_module(source_type: str, raw_text: str) -> Dict[str, Any]:
    """
    使用真实的AI模块解析事件报告
    
    Args:
        source_type: 事件来源类型
        raw_text: 原始事件文本
        
    Returns:
        解析后的事件数据
    """
    try:
        # 转换source_type格式以匹配AI模块期望的格式
        source_type_mapping = {
            "email": "Email",
            "log": "Email",  # 日志文件按邮件处理
            "manual": "Email",  # 手动输入按邮件处理
            "system": "Email",  # 系统报告按邮件处理
            "other": "Email"  # 其他类型按邮件处理
        }
        
        ai_source_type = source_type_mapping.get(source_type.lower(), "Email")
        
        # 使用AI模块解析
        incident_report = parse_incident_report(
            source_type=ai_source_type,
            raw_text=raw_text
        )
        
        # 转换为后端期望的格式
        result = {
            "incident_id": incident_report.incident_id or f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "source_type": source_type,
            "raw_text": raw_text,
            "timestamp": incident_report.received_timestamp_utc,
            "parsed_at": datetime.now().isoformat(),
            "severity": incident_report.urgency.lower(),
            "summary": incident_report.problem_summary,
            "description": incident_report.problem_summary,
            "category": f"{incident_report.affected_module.lower()}_incident" if incident_report.affected_module else "generic_incident",
            "confidence": 0.95,  # AI解析的置信度
            "extracted_entities": {
                "containers": [e.value for e in incident_report.entities if e.type == "container_number"],
                "vessels": [e.value for e in incident_report.entities if e.type == "vessel_name"],
                "users": [e.value for e in incident_report.entities if e.type == "user_id"],
                "error_codes": [e.value for e in incident_report.entities if e.type == "error_code"],
                "all_entities": [{"type": e.type, "value": e.value} for e in incident_report.entities]
            },
            "ai_parsed": True,
            "urgency": incident_report.urgency,
            "affected_module": incident_report.affected_module,
            "potential_cause": incident_report.potential_cause_hint,
            "reported_timestamp_hint": incident_report.reported_timestamp_hint
        }
        
        logger.info(f"AI解析完成，事件ID: {result['incident_id']}")
        return result
        
    except ParsingError as e:
        logger.error(f"AI解析失败: {str(e)}")
        # 如果AI解析失败，回退到模拟解析
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        return _simulate_ai_parsing(source_type, raw_text, incident_id)
    except Exception as e:
        logger.error(f"AI模块调用失败: {str(e)}")
        # 如果AI模块调用失败，回退到模拟解析
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        return _simulate_ai_parsing(source_type, raw_text, incident_id)


def _simulate_ai_parsing(source_type: str, raw_text: str, incident_id: str) -> Dict[str, Any]:
    """
    模拟AI解析过程
    
    这里是一个占位符实现，实际项目中会调用真正的AI模块
    """
    
    # 基础解析结果
    result = {
        "incident_id": incident_id,
        "source_type": source_type,
        "raw_text": raw_text,
        "timestamp": datetime.now().isoformat(),
        "parsed_at": datetime.now().isoformat(),
    }
    
    # 根据来源类型进行不同的解析
    if source_type == "email":
        result.update(_parse_email_incident(raw_text))
    elif source_type == "log":
        result.update(_parse_log_incident(raw_text))
    elif source_type == "system":
        result.update(_parse_system_incident(raw_text))
    else:
        result.update(_parse_generic_incident(raw_text))
    
    return result


def _parse_email_incident(text: str) -> Dict[str, Any]:
    """解析邮件类型事件"""
    # 简单的关键词匹配来模拟AI解析
    severity = "low"
    if any(keyword in text.lower() for keyword in ["critical", "urgent", "紧急", "严重"]):
        severity = "high"
    elif any(keyword in text.lower() for keyword in ["warning", "alert", "警告", "注意"]):
        severity = "medium"
    
    return {
        "severity": severity,
        "summary": "邮件事件报告",
        "description": f"从邮件中解析的事件: {text[:100]}...",
        "category": "email_incident",
        "confidence": 0.85,
        "extracted_entities": {
            "emails": _extract_emails(text),
            "ips": _extract_ips(text),
            "urls": _extract_urls(text)
        }
    }


def _parse_log_incident(text: str) -> Dict[str, Any]:
    """解析日志类型事件"""
    severity = "medium"
    if any(keyword in text.lower() for keyword in ["error", "fatal", "critical", "错误", "致命"]):
        severity = "high"
    elif any(keyword in text.lower() for keyword in ["warning", "warn", "警告"]):
        severity = "medium"
    else:
        severity = "low"
    
    return {
        "severity": severity,
        "summary": "日志事件报告",
        "description": f"从日志中解析的事件: {text[:100]}...",
        "category": "log_incident",
        "confidence": 0.90,
        "extracted_entities": {
            "ips": _extract_ips(text),
            "timestamps": _extract_timestamps(text),
            "error_codes": _extract_error_codes(text)
        }
    }


def _parse_system_incident(text: str) -> Dict[str, Any]:
    """解析系统类型事件"""
    return {
        "severity": "medium",
        "summary": "系统事件报告",
        "description": f"系统事件: {text[:100]}...",
        "category": "system_incident",
        "confidence": 0.95,
        "extracted_entities": {
            "ips": _extract_ips(text),
            "ports": _extract_ports(text),
            "services": _extract_services(text)
        }
    }


def _parse_generic_incident(text: str) -> Dict[str, Any]:
    """解析通用类型事件"""
    return {
        "severity": "low",
        "summary": "通用事件报告",
        "description": f"通用事件: {text[:100]}...",
        "category": "generic_incident",
        "confidence": 0.70,
        "extracted_entities": {
            "ips": _extract_ips(text),
            "emails": _extract_emails(text),
            "urls": _extract_urls(text)
        }
    }


def _extract_ips(text: str) -> list:
    """提取IP地址"""
    import re
    ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
    return re.findall(ip_pattern, text)


def _extract_emails(text: str) -> list:
    """提取邮箱地址"""
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    return re.findall(email_pattern, text)


def _extract_urls(text: str) -> list:
    """提取URL"""
    import re
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    return re.findall(url_pattern, text)


def _extract_timestamps(text: str) -> list:
    """提取时间戳"""
    import re
    timestamp_patterns = [
        r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}',
        r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',
        r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}'
    ]
    timestamps = []
    for pattern in timestamp_patterns:
        timestamps.extend(re.findall(pattern, text))
    return timestamps


def _extract_error_codes(text: str) -> list:
    """提取错误代码"""
    import re
    error_pattern = r'(?:error|Error|ERROR)\s*[:\-]?\s*(\d+)'
    return re.findall(error_pattern, text)


def _extract_ports(text: str) -> list:
    """提取端口号"""
    import re
    port_pattern = r':(\d{1,5})\b'
    return re.findall(port_pattern, text)


def _extract_services(text: str) -> list:
    """提取服务名称"""
    services = []
    common_services = ['http', 'https', 'ssh', 'ftp', 'smtp', 'pop3', 'imap', 'mysql', 'postgresql']
    for service in common_services:
        if service in text.lower():
            services.append(service)
    return services
