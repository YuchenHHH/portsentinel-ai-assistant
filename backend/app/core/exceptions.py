"""
自定义业务异常类
用于服务层和业务逻辑层的异常处理
"""


class IncidentParsingError(Exception):
    """事件解析业务异常"""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AIServiceUnavailableError(IncidentParsingError):
    """AI 服务不可用异常"""
    
    def __init__(self, message: str = "AI 服务暂时不可用", details: dict = None):
        super().__init__(message, "AI_SERVICE_UNAVAILABLE", details)


class InvalidInputError(IncidentParsingError):
    """输入数据无效异常"""
    
    def __init__(self, message: str = "输入数据无效", details: dict = None):
        super().__init__(message, "INVALID_INPUT", details)


class ConfigurationError(IncidentParsingError):
    """配置错误异常"""
    
    def __init__(self, message: str = "系统配置错误", details: dict = None):
        super().__init__(message, "CONFIGURATION_ERROR", details)


class OrchestratorError(Exception):
    """Orchestrator 业务异常"""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)
