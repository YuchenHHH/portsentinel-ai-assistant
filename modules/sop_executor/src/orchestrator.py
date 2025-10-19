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
import re
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
        system_message = """You are an expert operations planner for a critical port community system (PORTNET). Your goal is to convert a vague, historical resolution log into a clear, step-by-step executable plan.

You have deep expertise in port operations, container management, vessel operations, and EDI/API systems. Your plans must be precise, factual, and directly executable by an automated agent."""
        
        # --- MODIFICATION START ---
        # This new human_message template includes our critical rules
        human_message = """**Incident Context (The Facts):**
{incident_context}

**Available Tools (for context):**
{available_tools}

**Vague Historical Log (Your Goal):**
"{vague_resolution_text}"

**CRITICAL RULES FOR PLANNING:**
1.  **Factuality is essential:** You MUST strictly adhere to the entities (like message types, error codes, and IDs) provided in the 'Incident Context' and 'Vague Historical Log'. DO NOT invent or substitute entities (e.g., if the log says 'COARRI', you MUST use 'COARRI', not 'COPARN').
2.  **Combine logical steps:** Consolidate multiple micro-actions (like 'identify', 'find', 'validate', 'log', 'and then quarantine') into a single, high-level, logical step. For example, instead of four steps, use one: "Locate and quarantine all `COARRI` messages that failed schema validation."
3.  **Avoid meta-instructions:** DO NOT generate steps for 'logging' or 'documenting'. The execution agent logs its actions automatically. Only include 'monitoring' if it's a specific, actionable task (e.g., "Monitor translator logs for new errors post-reprocessing").
4.  **Focus on Action:** Every step in your plan must be an *actionable instruction* for the agent.
5.  **Include specific SQL for database operations:** For database verification steps, include the exact SQL query. For example: "Verify that only the latest container record per vessel_id and eta_ts remains for 'CMAU0000020' by re-running: SELECT * FROM container WHERE cntr_no = 'CMAU0000020' ORDER BY created_at DESC;"
6.  **Avoid placeholders in SQL:** Do not use placeholders like :VESSEL_ID, :ETA_TS, <VESSEL_ID>, or <ETA_TS> in SQL queries. Instead, use actual values or remove the specific conditions. For example, use "WHERE cntr_no = 'CMAU0000020'" instead of "WHERE cntr_no = 'CMAU0000020' AND vessel_id = :VESSEL_ID".

**Your New Executable Plan:**
Respond *only* with a JSON list of strings. Each string is a clear, actionable instruction for the execution agent.
"""
        # --- MODIFICATION END ---
        
        return ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("human", human_message)
        ])
    
    def create_execution_plan(
        self,
        incident_context: Dict[str, Any],  # Changed from incident_data
        vague_resolution_text: str,
        available_tools: Optional[List[str]] = None
    ) -> List[str]:
        """
        Convert a vague resolution log into a clear, executable plan.
        
        Args:
            incident_context: Dictionary containing ALL incident information 
                              (e.g., ID, Title, Error Code, SOP Title, etc.)
            vague_resolution_text: The vague historical resolution text to convert
            available_tools: List of available tools for context (optional)
            
        Returns:
            List of clear, actionable execution steps
            
        Raises:
            ValueError: If required parameters are missing
            Exception: If planning fails
        """
        if not incident_context:
            raise ValueError("incident_context cannot be empty")
        
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
                "incident_context": json.dumps(incident_context, indent=2), # Pass the full context
                "available_tools": "\n".join([f"- {tool}" for tool in available_tools]),
                "vague_resolution_text": vague_resolution_text
            }
            
            # Invoke the LLM chain
            response = self.chain.invoke(chain_input)
            
            # Extract the content from the response
            response_content = response.content.strip()
            
            # Attempt to find the JSON block, even if there's other text
            json_match = re.search(r'\[.*\]', response_content, re.DOTALL)
            if not json_match:
                raise Exception(f"No JSON list found in LLM response.\nResponse: {response_content}")
            
            plan_json_str = json_match.group(0)

            # Parse the JSON response
            try:
                execution_plan = json.loads(plan_json_str)
                
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
                raise Exception(f"Failed to parse LLM response as JSON: {e}\nResponse: {plan_json_str}")
            except ValueError as e:
                raise Exception(f"Invalid execution plan format: {e}\nResponse: {plan_json_str}")
                
        except Exception as e:
            # Re-raise with more context
            raise Exception(f"Failed to create execution plan: {e}")
    
    # We no longer need the separate `create_execution_plan_from_sop`
    # because the main `create_execution_plan` now handles all context.
    # This simplifies the interface.


# Convenience function for one-off planning
def create_execution_plan(
    incident_context: Dict[str, Any],
    vague_resolution_text: str,
    available_tools: Optional[List[str]] = None,
    model_name: str = "gpt-4.1-mini"
) -> List[str]:
    """
    Create an execution plan using default settings.
    
    This is a convenience function that creates a planner instance and
    creates the plan in one call.
    
    Args:
        incident_context: Dictionary containing ALL incident information
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
        incident_context=incident_context,
        vague_resolution_text=vague_resolution_text,
        available_tools=available_tools
    )