import sys
import os
import logging
from typing import Optional

# 导入自定义异常
from core.exceptions import (
    IncidentParsingError, 
    AIServiceUnavailableError, 
    InvalidInputError,
    ConfigurationError
)

# 确保 Python 解释器能找到 modules/ 目录下的代码
# 这是一个用于开发的简单解决方案
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../modules/incident_parser/src'))
if module_path not in sys.path:
    sys.path.append(module_path)

try:
    from parsing_agent.parser import parse_incident_report, ParsingError
    from parsing_agent.models import IncidentReport, Entity
except ImportError as e:
    raise ConfigurationError(
        f"无法从 '{module_path}' 导入 parsing_agent。请检查路径和模块是否正确。",
        details={"module_path": module_path, "original_error": str(e)}
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_parser(source_type: str, raw_text: str, use_fallback: bool = True) -> IncidentReport:
    """
    调用真实的 AI 模块解析事件报告
    
    Args:
        source_type: 事件来源类型
        raw_text: 原始事件文本
        use_fallback: 是否在 AI 解析失败时使用模拟解析回退
        
    Returns:
        IncidentReport: 解析后的事件报告
        
    Raises:
        InvalidInputError: 输入参数无效
        AIServiceUnavailableError: AI 服务不可用且不允许回退
        IncidentParsingError: 其他解析相关错误
    """
    # 输入验证
    if not source_type or not isinstance(source_type, str):
        raise InvalidInputError("source_type 必须是非空字符串")
    
    if not raw_text or not isinstance(raw_text, str) or len(raw_text.strip()) == 0:
        raise InvalidInputError("raw_text 必须是非空字符串")
    
    if source_type not in ["Email", "SMS", "Call"]:
        raise InvalidInputError(f"不支持的 source_type: {source_type}")
    
    logger.info(f"开始真实解析，来源: {source_type}")
    
    try:
        # 调用真实的 AI 解析函数
        report = parse_incident_report(
            source_type=source_type,
            raw_text=raw_text
        )
        logger.info(f"真实解析完成，事件ID: {report.incident_id}")
        return report
        
    except ParsingError as e:
        logger.error(f"AI 模块解析失败: {str(e)}")
        if use_fallback:
            logger.info("回退到模拟解析")
            return _create_mock_report(source_type, raw_text)
        else:
            raise AIServiceUnavailableError(
                f"AI 解析服务暂时不可用: {str(e)}",
                details={"original_error": str(e), "source_type": source_type}
            )
            
    except ValueError as e:
        logger.warning(f"AI 模块输入值错误: {str(e)}")
        if use_fallback:
            logger.info("回退到模拟解析")
            return _create_mock_report(source_type, raw_text)
        else:
            raise InvalidInputError(
                f"输入数据格式错误: {str(e)}",
                details={"original_error": str(e), "source_type": source_type}
            )
            
    except Exception as e:
        logger.error(f"AI 模块未知错误: {str(e)}", exc_info=True)
        if use_fallback:
            logger.info("回退到模拟解析")
            return _create_mock_report(source_type, raw_text)
        else:
            raise IncidentParsingError(
                f"解析过程中发生未知错误: {str(e)}",
                details={"original_error": str(e), "source_type": source_type}
            )


def _create_mock_report(source_type: str, raw_text: str) -> IncidentReport:
    """
    创建模拟的解析报告
    """
    import uuid
    from datetime import datetime, timezone
    
    # 简单的实体提取
    entities = []
    
    # 提取容器号
    import re
    container_pattern = r'\b[A-Z]{4}\d{7}\b'
    containers = re.findall(container_pattern, raw_text)
    for container in containers:
        entities.append(Entity(type="container_number", value=container))
    
    # 提取错误代码
    error_pattern = r'\b[A-Z_]+\d+\b'
    errors = re.findall(error_pattern, raw_text)
    for error in errors:
        entities.append(Entity(type="error_code", value=error))
    
    # 提取邮箱
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, raw_text)
    for email in emails:
        entities.append(Entity(type="user_id", value=email))
    
    # 确定紧急程度
    urgency = "Medium"
    if any(keyword in raw_text.lower() for keyword in ["urgent", "critical", "emergency", "asap"]):
        urgency = "High"
    elif any(keyword in raw_text.lower() for keyword in ["low", "minor", "informational"]):
        urgency = "Low"
    
    # 确定受影响模块
    affected_module = None
    if any(keyword in raw_text.lower() for keyword in ["container", "gate", "yard"]):
        affected_module = "Container"
    elif any(keyword in raw_text.lower() for keyword in ["vessel", "ship", "berth"]):
        affected_module = "Vessel"
    elif any(keyword in raw_text.lower() for keyword in ["edi", "api", "message", "integration"]):
        affected_module = "EDI/API"
    
    # 生成问题摘要
    problem_summary = "事件报告需要进一步分析"
    if containers:
        problem_summary = f"容器 {containers[0]} 相关问题"
    elif errors:
        problem_summary = f"系统错误 {errors[0]} 相关问题"
    else:
        problem_summary = "系统事件需要处理"
    
    return IncidentReport(
        incident_id=f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
        source_type=source_type,
        received_timestamp_utc=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        reported_timestamp_hint="模拟解析",
        urgency=urgency,
        affected_module=affected_module,
        entities=entities,
        error_code=errors[0] if errors else None,
        problem_summary=problem_summary,
        potential_cause_hint="需要进一步调查",
        raw_text=raw_text
    )