"""
RAG API Endpoints

FastAPI endpoints for RAG-based SOP retrieval and enrichment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.api.v1.schemas.rag import (
    EnrichmentRequest,
    EnrichmentResponse,
    RAGSearchRequest,
    RAGSearchResponse
)
from app.services.rag_service import get_rag_service, RAGService
from app.core.exceptions import (
    IncidentParsingError,
    AIServiceUnavailableError,
    ConfigurationError
)

router = APIRouter()


@router.post(
    "/rag/enrich",
    response_model=EnrichmentResponse,
    summary="Enrich incident with relevant SOPs",
    description="Retrieve relevant Standard Operating Procedures (SOPs) for an incident report using RAG"
)
async def enrich_incident(
    request: EnrichmentRequest,
    rag_service: RAGService = Depends(get_rag_service)
) -> EnrichmentResponse:
    """
    Enrich an incident report with relevant SOPs from the knowledge base.
    
    This endpoint takes an incident report and uses RAG (Retrieval Augmented Generation)
    to find and return relevant Standard Operating Procedures that can help resolve
    the incident.
    
    Args:
        request: Incident data including problem summary, affected module, error codes, etc.
        rag_service: RAG service instance (injected dependency)
        
    Returns:
        EnrichmentResponse containing the original incident data plus retrieved SOPs
        
    Raises:
        HTTPException: If enrichment fails or service is unavailable
    """
    try:
        result = rag_service.get_enrichment_for_incident(request)
        return result
        
    except ConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "RAG service configuration error",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except AIServiceUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "RAG service unavailable",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except IncidentParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Incident enrichment failed",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred during incident enrichment",
                "error_code": "INTERNAL_ERROR"
            }
        )


@router.post(
    "/rag/search",
    response_model=RAGSearchResponse,
    summary="Search SOPs by query",
    description="Direct search for Standard Operating Procedures using a text query"
)
async def search_sops(
    request: RAGSearchRequest,
    rag_service: RAGService = Depends(get_rag_service)
) -> RAGSearchResponse:
    """
    Search for relevant SOPs using a direct text query.
    
    This endpoint allows direct searching of the knowledge base using natural language
    queries. It's useful for general SOP discovery and exploration.
    
    Args:
        request: Search request with query text and optional filters
        rag_service: RAG service instance (injected dependency)
        
    Returns:
        RAGSearchResponse containing matching SOPs and metadata
        
    Raises:
        HTTPException: If search fails or service is unavailable
    """
    try:
        result = rag_service.search_sops(request)
        return result
        
    except ConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "RAG service configuration error",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except AIServiceUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "RAG service unavailable",
                "message": e.message,
                "error_code": e.error_code,
                "details": e.details
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred during SOP search",
                "error_code": "INTERNAL_ERROR"
            }
        )


@router.get(
    "/rag/health",
    summary="RAG service health check",
    description="Check if the RAG service is available and properly configured"
)
async def rag_health_check(
    rag_service: RAGService = Depends(get_rag_service)
) -> dict:
    """
    Check the health status of the RAG service.
    
    Returns:
        Health status information including service availability and configuration
    """
    try:
        # Try to access the vector store to verify it's working
        if rag_service.vector_store and rag_service.rag_agent:
            # Get basic stats to verify the service is working
            stats = rag_service.vector_store.get_collection_stats()
            
            return {
                "status": "healthy",
                "service": "RAG",
                "vector_store_available": True,
                "rag_agent_available": True,
                "vector_count": stats.get("count", 0),
                "collection_name": stats.get("name", "unknown")
            }
        else:
            return {
                "status": "unhealthy",
                "service": "RAG",
                "vector_store_available": rag_service.vector_store is not None,
                "rag_agent_available": rag_service.rag_agent is not None,
                "error": "Service components not properly initialized"
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "RAG",
            "error": str(e)
        }
