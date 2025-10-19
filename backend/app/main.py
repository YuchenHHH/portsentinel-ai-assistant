import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.endpoints import incident_parser, rag, orchestrator, sop_execution, database

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="PortSentinel AI Assistant - 智能事件报告解析系统",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(
    incident_parser.router,
    prefix=f"{settings.api_v1_prefix}/incidents",
    tags=["事件解析"]
)

app.include_router(
    rag.router,
    prefix=f"{settings.api_v1_prefix}",
    tags=["RAG知识检索"]
)

app.include_router(
    orchestrator.router,
    prefix=f"{settings.api_v1_prefix}/orchestrator",
    tags=["Orchestrator"]
)

app.include_router(
    sop_execution.router,
    prefix=f"{settings.api_v1_prefix}/sop-execution",
    tags=["SOP Execution"]
)

app.include_router(
    database.router,
    prefix=f"{settings.api_v1_prefix}/database",
    tags=["Database Configuration"]
)


@app.get("/", summary="根路径", description="API根路径，返回服务信息")
async def root():
    """根路径端点"""
    return JSONResponse(
        content={
            "message": f"欢迎使用 {settings.app_name}",
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/health"
        }
    )


@app.get("/health", summary="健康检查", description="检查服务是否正常运行")
async def health_check():
    """健康检查端点"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version
        }
    )


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info(f"{settings.app_name} v{settings.app_version} 启动成功")
    logger.info(f"API文档地址: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info(f"{settings.app_name} 正在关闭...")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
