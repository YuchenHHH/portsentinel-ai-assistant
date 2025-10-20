import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.endpoints import incident_parser, rag, orchestrator, sop_execution, database, history_match, auth, execution_summary

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="PortSentinel AI Assistant - Intelligent Incident Report Parsing System",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    incident_parser.router,
    prefix=f"{settings.api_v1_prefix}/incidents",
    tags=["Incident Parsing"]
)

app.include_router(
    rag.router,
    prefix=f"{settings.api_v1_prefix}",
    tags=["RAG Knowledge Retrieval"]
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

app.include_router(
    history_match.router,
    prefix=f"{settings.api_v1_prefix}",
    tags=["历史案例匹配"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.api_v1_prefix}/auth",
    tags=["用户认证"]
)

app.include_router(
    execution_summary.router,
    prefix=f"{settings.api_v1_prefix}/execution-summary",
    tags=["执行摘要"]
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
