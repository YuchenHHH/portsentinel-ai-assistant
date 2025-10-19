"""
SOP Executor Module

This module provides intelligent execution capabilities for Standard Operating Procedures (SOPs)
based on parsed incident reports and retrieved knowledge base information.

Architecture:
- tools.py: MySQL and API utilities for concrete operations
- agent.py: Executor / 执行者 - executes individual steps and operations
- orchestrator.py: Planner / 规划者 - plans execution sequences and workflows
- schemas.py: Pydantic models for data validation and type safety

Execution Flow:
1. Planner analyzes SOP requirements and creates execution plan
2. Executor performs concrete operations based on the plan
3. Tools provide the actual implementation for database/API operations
4. Schemas ensure data integrity throughout the process
"""

__version__ = "1.0.0"
__author__ = "PortSentinel AI Assistant Team"

# Export the main classes for easier imports
from .agent import SOPExecutorAgent
from .orchestrator import SOPPlanner

__all__ = ["SOPExecutorAgent", "SOPPlanner"]
