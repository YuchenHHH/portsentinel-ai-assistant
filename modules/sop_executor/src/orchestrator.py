"""
Planner / 规划者

This module contains the Planner responsible for:
- Planning and strategizing SOP execution sequences
- Analyzing SOP requirements and dependencies
- Creating execution plans and workflows
- Optimizing execution order and resource allocation
- Converting vague Resolution text into clear, executable plans
"""

import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.exceptions import OutputParserException

# Load environment variables from .env file
load_dotenv()


class SOPPlanner:
    """
    Planner responsible for converting vague Resolution text into clear, executable plans.
    
    This class uses LangChain and OpenAI to analyze historical resolution logs and
    transform them into step-by-step executable instructions.
    """
    
    def __init__(
        self,
        model_name: str = "gpt-4.1-mini",
        temperature: float = 0.0,
        api_key: Optional[str] = None,
        azure_endpoint: Optional[str] = None,
        api_version: Optional[str] = None,
        deployment_name: Optional[str] = None
    ):
        """
        Initialize the SOP Planner.
        
        Args:
            model_name: Model deployment name for Azure OpenAI (default: gpt-4.1-mini)
            temperature: Sampling temperature (0.0 for deterministic)
            api_key: Azure OpenAI API key (if not provided, reads from env var)
            azure_endpoint: Azure OpenAI endpoint URL (if not provided, reads from env var)
            api_version: Azure OpenAI API version (default: 2025-01-01-preview)
            deployment_name: Azure OpenAI deployment name (defaults to model_name)
        """
        self.model_name = model_name
        self.temperature = temperature
        
        # Set up Azure OpenAI configuration
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.azure_endpoint = azure_endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_version = api_version or "2025-01-01-preview"
        self.deployment_name = deployment_name or model_name
        
        if not self.api_key or not self.azure_endpoint:
            raise ValueError("Azure OpenAI API key and endpoint must be provided or set in environment variables")
        
        # Initialize the LLM
        self.llm = AzureChatOpenAI(
            azure_deployment=self.deployment_name,
            api_version=self.api_version,
            temperature=temperature,
            azure_endpoint=self.azure_endpoint,
            api_key=self.api_key
        )
        
        # Create the prompt template
        self.prompt = self._create_prompt_template()
        
        # Build the LangChain Expression Language (LCEL) chain
        self.chain = self.prompt | self.llm
    
    def _create_prompt_template(self) -> ChatPromptTemplate:
        """
        Create the ChatPromptTemplate for resolution planning.
        
        Returns:
            ChatPromptTemplate configured for resolution planning
        """
        system_message = """You are an expert operations planner. Your goal is to convert a vague, historical resolution log into a clear, step-by-step executable plan.

You have deep expertise in port operations, container management, vessel operations, and EDI/API systems. You understand the complexities of PORTNET operations and can break down complex resolution logs into actionable steps."""
        
        human_message = """**Incident Data:**
{incident_data}

**Available Tools (for context):**
{available_tools}

**Vague Historical Log (Your Goal):**
"{vague_resolution_text}"

**Your New Executable Plan:**
Respond *only* with a JSON list of strings. Each string is a clear, actionable instruction for the execution agent.
Keep steps simple and focused on one action.
Make sure each step is specific and can be executed by an automated system.

Example:
[
  "Check for container range overlap using CONTAINER_ID and BSIU 323099",
  "Document the conflicting serial number 'BSIU 3430001'",
  "Confirm scope on a safe test entity",
  "Check for recent deployments",
  "Apply compliant fix and document the change"
]"""
        
        return ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("human", human_message)
        ])
    
    def create_execution_plan(
        self,
        incident_data: Dict[str, Any],
        vague_resolution_text: str,
        available_tools: Optional[List[str]] = None
    ) -> List[str]:
        """
        Convert a vague resolution log into a clear, executable plan.
        
        Args:
            incident_data: Dictionary containing incident information
            vague_resolution_text: The vague historical resolution text to convert
            available_tools: List of available tools for context (optional)
            
        Returns:
            List of clear, actionable execution steps
            
        Raises:
            ValueError: If required parameters are missing
            Exception: If planning fails
        """
        if not incident_data:
            raise ValueError("incident_data cannot be empty")
        
        if not vague_resolution_text or not vague_resolution_text.strip():
            raise ValueError("vague_resolution_text cannot be empty")
        
        # Default available tools if not provided
        if available_tools is None:
            available_tools = [
                "MySQL Database Query Tool",
                "Container API Tool", 
                "Vessel API Tool",
                "EDI Message Tool",
                "System Log Tool",
                "Notification Tool"
            ]
        
        try:
            # Prepare the input data for the chain
            chain_input = {
                "incident_data": json.dumps(incident_data, indent=2),
                "available_tools": "\n".join([f"- {tool}" for tool in available_tools]),
                "vague_resolution_text": vague_resolution_text
            }
            
            # Invoke the LLM chain
            response = self.chain.invoke(chain_input)
            
            # Extract the content from the response
            response_content = response.content.strip()
            
            # Parse the JSON response
            try:
                execution_plan = json.loads(response_content)
                
                # Validate that it's a list of strings
                if not isinstance(execution_plan, list):
                    raise ValueError("Response must be a JSON list")
                
                # Validate each step is a string
                for i, step in enumerate(execution_plan):
                    if not isinstance(step, str):
                        raise ValueError(f"Step {i} must be a string, got {type(step)}")
                    if not step.strip():
                        raise ValueError(f"Step {i} cannot be empty")
                
                return execution_plan
                
            except json.JSONDecodeError as e:
                raise Exception(f"Failed to parse LLM response as JSON: {e}\nResponse: {response_content}")
            except ValueError as e:
                raise Exception(f"Invalid execution plan format: {e}\nResponse: {response_content}")
                
        except Exception as e:
            raise Exception(f"Failed to create execution plan: {e}")
    
    def create_execution_plan_from_sop(
        self,
        incident_data: Dict[str, Any],
        sop_resolution: str,
        sop_title: str,
        available_tools: Optional[List[str]] = None
    ) -> List[str]:
        """
        Create an execution plan from SOP resolution text.
        
        Args:
            incident_data: Dictionary containing incident information
            sop_resolution: The resolution text from the SOP
            sop_title: The title of the SOP
            available_tools: List of available tools for context (optional)
            
        Returns:
            List of clear, actionable execution steps
        """
        # Enhance the resolution text with SOP context
        enhanced_resolution = f"SOP: {sop_title}\n\nResolution: {sop_resolution}"
        
        return self.create_execution_plan(
            incident_data=incident_data,
            vague_resolution_text=enhanced_resolution,
            available_tools=available_tools
        )


# Convenience function for one-off planning
def create_execution_plan(
    incident_data: Dict[str, Any],
    vague_resolution_text: str,
    available_tools: Optional[List[str]] = None,
    model_name: str = "gpt-4.1-mini"
) -> List[str]:
    """
    Create an execution plan using default settings.
    
    This is a convenience function that creates a planner instance and
    creates the plan in one call.
    
    Args:
        incident_data: Dictionary containing incident information
        vague_resolution_text: The vague historical resolution text to convert
        available_tools: List of available tools for context (optional)
        model_name: OpenAI model to use (default: gpt-4.1-mini)
        
    Returns:
        List of clear, actionable execution steps
        
    Raises:
        ValueError: If required parameters are missing
        Exception: If planning fails
    """
    planner = SOPPlanner(model_name=model_name)
    return planner.create_execution_plan(
        incident_data=incident_data,
        vague_resolution_text=vague_resolution_text,
        available_tools=available_tools
    )
