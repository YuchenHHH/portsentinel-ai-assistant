"""
SOP Execution API Endpoints

This module provides FastAPI endpoints for executing Standard Operating Procedures.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import logging

from app.services.sop_executor_service import get_sop_executor_service, SOPExecutorService
from app.services.sop_executor_service import ExecutionRequest, ExecutionResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/execute", response_model=ExecutionResponse)
async def execute_sop(
    request: ExecutionRequest,
    sop_service: SOPExecutorService = Depends(get_sop_executor_service)
):
    """
    Execute a Standard Operating Procedure
    
    Args:
        request: Execution request containing incident and SOP information
        sop_service: SOP Executor Service dependency
        
    Returns:
        ExecutionResponse: Result of the SOP execution
        
    Raises:
        HTTPException: If execution fails or service is unavailable
    """
    try:
        logger.info(f"Received SOP execution request for incident {request.incident_id}, SOP {request.sop_id}")
        
        result = await sop_service.execute_sop(request)
        
        if result.status.value == "failed":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "SOP execution failed",
                    "message": result.error_message or "Unknown error occurred",
                    "execution_id": result.execution_id
                }
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SOP execution endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "SOP execution service error",
                "message": str(e)
            }
        )


@router.get("/execute/{execution_id}", response_model=ExecutionResponse)
async def get_execution_status(
    execution_id: str,
    sop_service: SOPExecutorService = Depends(get_sop_executor_service)
):
    """
    Get the status of a running or completed execution
    
    Args:
        execution_id: Unique execution identifier
        sop_service: SOP Executor Service dependency
        
    Returns:
        ExecutionResponse: Current execution status
        
    Raises:
        HTTPException: If execution not found or service error
    """
    try:
        logger.info(f"Retrieving execution status for {execution_id}")
        
        result = await sop_service.get_execution_status(execution_id)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "Execution not found",
                    "message": f"Execution {execution_id} not found"
                }
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get execution status endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Failed to retrieve execution status",
                "message": str(e)
            }
        )


@router.delete("/execute/{execution_id}")
async def cancel_execution(
    execution_id: str,
    sop_service: SOPExecutorService = Depends(get_sop_executor_service)
):
    """
    Cancel a running execution
    
    Args:
        execution_id: Unique execution identifier
        sop_service: SOP Executor Service dependency
        
    Returns:
        dict: Cancellation result
        
    Raises:
        HTTPException: If cancellation fails
    """
    try:
        logger.info(f"Cancelling execution {execution_id}")
        
        success = await sop_service.cancel_execution(execution_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Failed to cancel execution",
                    "message": f"Could not cancel execution {execution_id}"
                }
            )
        
        return {
            "message": "Execution cancelled successfully",
            "execution_id": execution_id,
            "cancelled": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel execution endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Failed to cancel execution",
                "message": str(e)
            }
        )
