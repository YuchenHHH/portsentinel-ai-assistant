"""
Pydantic Models for SOP Executor

This module contains Pydantic models for:
- Execution request/response schemas
- Step execution status and results
- Error handling and validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class ExecutionStatus(str, Enum):
    """Execution status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepResult(BaseModel):
    """Result of a single SOP step execution"""
    step_id: str = Field(..., description="Unique identifier for the step")
    status: ExecutionStatus = Field(..., description="Execution status")
    result: Optional[Dict[str, Any]] = Field(None, description="Step execution result")
    error_message: Optional[str] = Field(None, description="Error message if execution failed")
    execution_time: Optional[float] = Field(None, description="Execution time in seconds")


class ExecutionRequest(BaseModel):
    """Request for SOP execution"""
    incident_id: str = Field(..., description="Incident identifier")
    sop_id: str = Field(..., description="SOP identifier to execute")
    context: Dict[str, Any] = Field(default_factory=dict, description="Execution context")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Execution parameters")


class ExecutionResponse(BaseModel):
    """Response from SOP execution"""
    execution_id: str = Field(..., description="Unique execution identifier")
    status: ExecutionStatus = Field(..., description="Overall execution status")
    steps: List[StepResult] = Field(default_factory=list, description="Individual step results")
    final_result: Optional[Dict[str, Any]] = Field(None, description="Final execution result")
    error_message: Optional[str] = Field(None, description="Error message if execution failed")
    total_execution_time: Optional[float] = Field(None, description="Total execution time in seconds")


# TODO: Add more schemas as needed
