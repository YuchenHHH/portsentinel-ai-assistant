import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import logging

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
        
        # 生成唯一的事件ID
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # 模拟AI解析逻辑
        # 这里可以根据不同的source_type应用不同的解析策略
        parsed_data = _simulate_ai_parsing(source_type, raw_text, incident_id)
        
        logger.info(f"事件解析完成，事件ID: {incident_id}")
        return parsed_data
        
    except Exception as e:
        logger.error(f"事件解析失败: {str(e)}")
        raise Exception(f"解析事件报告时发生错误: {str(e)}")


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
