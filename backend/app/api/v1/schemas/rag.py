"""
RAG API Schemas

Pydantic models for RAG-based SOP retrieval API endpoints.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


class Entity(BaseModel):
    """Entity extracted from incident report"""
    type: str = Field(..., description="Type/category of the entity")
    value: str = Field(..., description="The actual value of the extracted entity")


class EnrichmentRequest(BaseModel):
    """
    Request model for RAG enrichment endpoint.
    
    Contains key fields from IncidentReport needed for SOP retrieval.
    """
    incident_id: Optional[str] = Field(
        None,
        description="Unique identifier for the incident"
    )
    
    source_type: Literal["Email", "SMS", "Call"] = Field(
        ...,
        description="Source channel of the incident report"
    )
    
    problem_summary: str = Field(
        ...,
        description="A concise summary of the core issue reported"
    )
    
    affected_module: Optional[Literal["Container", "Vessel", "EDI/API"]] = Field(
        None,
        description="Primary system module affected by the incident"
    )
    
    error_code: Optional[str] = Field(
        None,
        description="Specific error code mentioned in the report"
    )
    
    urgency: Literal["High", "Medium", "Low"] = Field(
        "Medium",
        description="Inferred urgency level based on keywords and context"
    )
    
    entities: List[Entity] = Field(
        default_factory=list,
        description="List of key entities extracted from the report"
    )
    
    raw_text: str = Field(
        ...,
        description="The complete original input text for context"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "ALR-861631",
                "source_type": "Email",
                "problem_summary": "Unable to create vessel advice due to duplicate system vessel name",
                "affected_module": "Vessel",
                "error_code": "VESSEL_ERR_4",
                "urgency": "High",
                "entities": [
                    {
                        "type": "vessel_name",
                        "value": "LIONCITY07"
                    },
                    {
                        "type": "error_code",
                        "value": "VESSEL_ERR_4"
                    }
                ],
                "raw_text": "Subject: Unable to create vessel advice\n\nError VESSEL_ERR_4 when trying to create vessel advice for LIONCITY07..."
            }
        }


class SopSnippet(BaseModel):
    """
    Represents a retrieved SOP snippet from the knowledge base (supports hybrid search scores).
    """
    content: str = Field(..., description="Text content of the SOP snippet")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadata associated with this snippet (e.g., sop_title, module, source)"
    )
    
    # Multiple score types for hybrid search
    vector_score: Optional[float] = Field(
        None, 
        description="Vector similarity score (0-1, cosine similarity)"
    )
    bm25_score: Optional[float] = Field(
        None,
        description="BM25 score (normalized to 0-1)"
    )
    hybrid_score: Optional[float] = Field(
        None,
        description="Hybrid score (weighted combination of vector + BM25)"
    )
    rrf_score: Optional[float] = Field(
        None,
        description="RRF (Reciprocal Rank Fusion) score"
    )
    rerank_score: Optional[float] = Field(
        None,
        description="Semantic rerank score"
    )
    
    # Legacy score field for backward compatibility
    score: Optional[float] = Field(
        None,
        description="Primary relevance score (highest available score)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "VAS: VESSEL_ERR_4 - System Vessel Name has been used by other vessel advice...",
                "metadata": {
                    "sop_title": "VAS: VESSEL_ERR_4",
                    "module": "Vessel",
                    "source": "Knowledge Base.docx",
                    "chunk_type": "resolution"
                },
                "vector_score": 0.89,
                "bm25_score": 0.75,
                "hybrid_score": 0.82,
                "rrf_score": 0.0156,
                "rerank_score": 0.92,
                "score": 0.92
            }
        }


class RetrievalMetrics(BaseModel):
    """
    Retrieval process metrics for hybrid search
    """
    num_expanded_queries: int = Field(..., description="Number of expanded queries generated")
    num_bm25_candidates: int = Field(..., description="Number of BM25 candidates")
    num_vector_candidates: int = Field(..., description="Number of vector candidates")
    num_merged_candidates: int = Field(..., description="Number of merged candidates")
    num_after_rrf: int = Field(..., description="Number after RRF fusion")
    num_final_results: int = Field(..., description="Number of final results")
    bm25_weight: float = Field(..., description="BM25 weight")
    vector_weight: float = Field(..., description="Vector weight")
    rrf_k: int = Field(..., description="RRF parameter k")


class EnrichmentResponse(BaseModel):
    """
    Response model for RAG enrichment endpoint.
    
    Contains the original incident data plus retrieved SOP snippets.
    """
    incident_id: Optional[str] = Field(
        None,
        description="Unique identifier for the incident"
    )
    
    problem_summary: str = Field(
        ...,
        description="Summary of the core issue reported"
    )
    
    affected_module: Optional[str] = Field(
        None,
        description="Primary system module affected by the incident"
    )
    
    error_code: Optional[str] = Field(
        None,
        description="Specific error code mentioned in the report"
    )
    
    urgency: str = Field(
        ...,
        description="Urgency level of the incident"
    )
    
    retrieved_sops: List[SopSnippet] = Field(
        default_factory=list,
        description="Relevant SOP snippets retrieved from knowledge base"
    )
    
    retrieval_summary: str = Field(
        ...,
        description="Human-readable summary of retrieved SOPs and relevance"
    )
    
    total_sops_found: int = Field(
        0,
        description="Total number of relevant SOPs found"
    )
    
    retrieval_metrics: Optional[RetrievalMetrics] = Field(
        None,
        description="Retrieval process metrics"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "ALR-861631",
                "problem_summary": "Unable to create vessel advice due to duplicate system vessel name",
                "affected_module": "Vessel",
                "error_code": "VESSEL_ERR_4",
                "urgency": "High",
                "retrieved_sops": [
                    {
                        "content": "VAS: VESSEL_ERR_4 - System Vessel Name has been used by other vessel advice...",
                        "metadata": {
                            "sop_title": "VAS: VESSEL_ERR_4",
                            "module": "Vessel",
                            "source": "Knowledge Base.docx"
                        },
                        "score": 0.89
                    }
                ],
                "retrieval_summary": "Retrieved 3 relevant SOPs for vessel advice error. Top match: VAS: VESSEL_ERR_4 (score: 0.89)",
                "total_sops_found": 3
            }
        }


class RAGSearchRequest(BaseModel):
    """
    Request model for direct RAG search endpoint.
    """
    query: str = Field(
        ...,
        min_length=1,
        description="Search query for SOP retrieval"
    )
    
    k: int = Field(
        3,
        ge=1,
        le=10,
        description="Number of SOPs to retrieve (1-10)"
    )
    
    module_filter: Optional[Literal["Container", "Vessel", "EDI/API"]] = Field(
        None,
        description="Optional module filter for search results"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "VESSEL_ERR_4 duplicate vessel name",
                "k": 3,
                "module_filter": "Vessel"
            }
        }


class RAGSearchResponse(BaseModel):
    """
    Response model for direct RAG search endpoint.
    """
    query: str = Field(
        ...,
        description="The search query that was processed"
    )
    
    results: List[SopSnippet] = Field(
        default_factory=list,
        description="Retrieved SOP snippets matching the query"
    )
    
    total_found: int = Field(
        0,
        description="Total number of results found"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "VESSEL_ERR_4 duplicate vessel name",
                "results": [
                    {
                        "content": "VAS: VESSEL_ERR_4 - System Vessel Name has been used by other vessel advice...",
                        "metadata": {
                            "sop_title": "VAS: VESSEL_ERR_4",
                            "module": "Vessel"
                        },
                        "score": 0.89
                    }
                ],
                "total_found": 3
            }
        }
