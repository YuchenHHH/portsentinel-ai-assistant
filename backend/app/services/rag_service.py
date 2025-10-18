"""
RAG Service Layer

Service functions for RAG-based SOP retrieval and enrichment.
"""

import sys
import os
import logging
import json
from typing import Optional, List, Dict, Any
from pathlib import Path

# Add paths for RAG module imports
rag_module_path = Path(__file__).parent.parent.parent.parent / "modules" / "rag_module" / "src"
incident_parser_path = Path(__file__).parent.parent.parent.parent / "modules" / "incident_parser" / "src"

if str(rag_module_path) not in sys.path:
    sys.path.insert(0, str(rag_module_path))
if str(incident_parser_path) not in sys.path:
    sys.path.insert(0, str(incident_parser_path))

from app.api.v1.schemas.rag import EnrichmentRequest, EnrichmentResponse, SopSnippet, RAGSearchRequest, RAGSearchResponse
from app.core.exceptions import (
    IncidentParsingError,
    AIServiceUnavailableError,
    ConfigurationError
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGService:
    """RAG service for SOP retrieval and enrichment"""
    
    def __init__(self):
        """Initialize RAG service with vector store and agent"""
        self.vector_store = None
        self.rag_agent = None
        self.knowledge_base_data = None
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize vector store and RAG agent components"""
        try:
            # Import RAG components
            from data_sources.vector_store_interface import VectorStoreInterface
            from data_sources.bm25_retriever import BM25Retriever
            from rag_agent.validator import RagAgent
            from rag_agent.query_expander import QueryExpander
            from data_sources.reranker import SemanticReranker
            from parsing_agent.models import IncidentReport, Entity
            
            # Set up vector store path
            vector_store_path = Path(__file__).parent.parent.parent.parent / "modules" / "rag_module" / "db_chroma_kb"
            
            if not vector_store_path.exists():
                raise ConfigurationError(
                    f"Vector database not found at {vector_store_path}. "
                    "Please run vectorization script first.",
                    details={"vector_store_path": str(vector_store_path)}
                )
            
            # Initialize vector store
            self.vector_store = VectorStoreInterface(persist_directory=str(vector_store_path))
            logger.info("Vector store initialized successfully")
            
            # Initialize RAG agent (components are initialized internally)
            self.rag_agent = RagAgent(
                vector_store_interface=self.vector_store
            )
            logger.info("RAG agent initialized successfully")
            
            # Load knowledge base data for complete SOP retrieval
            self._load_knowledge_base_data()
            
        except ImportError as e:
            raise ConfigurationError(
                f"Failed to import RAG components: {str(e)}",
                details={"error": str(e)}
            )
        except Exception as e:
            raise ConfigurationError(
                f"Failed to initialize RAG service: {str(e)}",
                details={"error": str(e)}
            )
    
    def _load_knowledge_base_data(self):
        """Load the complete knowledge base data for SOP retrieval"""
        try:
            # Path to the knowledge base JSON file
            kb_path = Path(__file__).parent.parent.parent.parent / "data" / "knowledge_base_structured.json"
            
            if not kb_path.exists():
                logger.warning(f"Knowledge base file not found at {kb_path}")
                self.knowledge_base_data = []
                return
            
            with open(kb_path, 'r', encoding='utf-8') as f:
                self.knowledge_base_data = json.load(f)
            
            logger.info(f"Loaded {len(self.knowledge_base_data)} SOPs from knowledge base")
            
        except Exception as e:
            logger.error(f"Failed to load knowledge base data: {e}")
            self.knowledge_base_data = []
    
    def _get_complete_sop_by_title(self, sop_title: str) -> Optional[Dict[str, Any]]:
        """Get complete SOP data by title"""
        if not self.knowledge_base_data:
            return None
        
        for sop in self.knowledge_base_data:
            if sop.get("Title") == sop_title:
                return sop
        
        return None
    
    def get_enrichment_for_incident(self, request: EnrichmentRequest) -> EnrichmentResponse:
        """
        Get RAG enrichment for an incident report.
        
        Args:
            request: Enrichment request containing incident data
            
        Returns:
            EnrichmentResponse with retrieved SOPs and summary
            
        Raises:
            AIServiceUnavailableError: If RAG service is not available
            IncidentParsingError: If incident processing fails
        """
        if not self.rag_agent:
            raise AIServiceUnavailableError("RAG service not initialized")
        
        try:
            logger.info(f"Processing enrichment request for incident: {request.incident_id}")
            
            # Convert request to IncidentReport
            incident_report = self._convert_request_to_incident_report(request)
            
            # Retrieve relevant SOPs using RAG agent
            enriched = self.rag_agent.retrieve(incident_report, k=3)
            
            # Convert to response format
            response = self._convert_enriched_to_response(enriched, request)
            
            logger.info(f"Successfully retrieved {len(response.retrieved_sops)} SOPs for incident {request.incident_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error in get_enrichment_for_incident: {str(e)}")
            raise IncidentParsingError(
                f"Failed to enrich incident with RAG: {str(e)}",
                details={"incident_id": request.incident_id, "error": str(e)}
            )
    
    def search_sops(self, request: RAGSearchRequest) -> RAGSearchResponse:
        """
        Search SOPs using direct query.
        
        Args:
            request: Search request with query and parameters
            
        Returns:
            RAGSearchResponse with matching SOPs
            
        Raises:
            AIServiceUnavailableError: If RAG service is not available
        """
        if not self.vector_store:
            raise AIServiceUnavailableError("Vector store not initialized")
        
        try:
            logger.info(f"Processing search request: '{request.query}'")
            
            # Perform search
            if request.module_filter:
                # Use metadata filtering if module filter is specified
                # Note: search_by_metadata returns List[Document], we need to get scores separately
                documents = self.vector_store.search_by_metadata(
                    query=request.query,
                    metadata_filter={"module": request.module_filter},
                    k=request.k
                )
                # For now, assign default score of 1.0 for metadata filtered results
                results = [(doc, 1.0) for doc in documents]
            else:
                # Use regular search
                results = self.vector_store.search_with_scores(request.query, k=request.k)
            
            # Convert results to response format with deduplication
            sop_snippets = []
            seen_sop_ids = set()
            
            # Sort by score (highest first) to prioritize the best match for each SOP
            sorted_results = sorted(results, key=lambda x: x[1], reverse=True)
            
            for doc, score in sorted_results:
                # Get SOP ID for deduplication
                sop_id = doc.metadata.get("sop_id")
                
                # Skip if we've already processed this SOP ID
                if sop_id and sop_id in seen_sop_ids:
                    continue
                
                # Mark this SOP ID as seen
                if sop_id:
                    seen_sop_ids.add(sop_id)
                
                snippet = SopSnippet(
                    content=doc.page_content,
                    metadata=doc.metadata,
                    vector_score=score,  # For simple search, this is the vector score
                    score=score  # Primary score
                )
                sop_snippets.append(snippet)
            
            response = RAGSearchResponse(
                query=request.query,
                results=sop_snippets,
                total_found=len(sop_snippets)
            )
            
            logger.info(f"Found {len(sop_snippets)} SOPs for query: '{request.query}'")
            return response
            
        except Exception as e:
            logger.error(f"Error in search_sops: {str(e)}")
            raise AIServiceUnavailableError(
                f"Failed to search SOPs: {str(e)}",
                details={"query": request.query, "error": str(e)}
            )
    
    def _convert_request_to_incident_report(self, request: EnrichmentRequest):
        """Convert EnrichmentRequest to IncidentReport"""
        from parsing_agent.models import IncidentReport, Entity
        
        # Convert entities
        entities = [
            Entity(type=entity.type, value=entity.value)
            for entity in request.entities
        ]
        
        # Create IncidentReport
        incident_report = IncidentReport(
            incident_id=request.incident_id,
            source_type=request.source_type,
            received_timestamp_utc="2025-01-01T00:00:00Z",  # Default timestamp
            reported_timestamp_hint=None,
            urgency=request.urgency,
            affected_module=request.affected_module,
            entities=entities,
            error_code=request.error_code,
            problem_summary=request.problem_summary,
            potential_cause_hint=None,
            raw_text=request.raw_text
        )
        
        return incident_report
    
    def _filter_by_relevance(self, sop_snippets: List, incident_module: str = None, original_request = None, top_k: int = 3) -> List:
        """
        Filter SOP snippets by relevance to the incident module
        
        Args:
            sop_snippets: List of SOP snippets to filter
            incident_module: The affected module from the incident report
            top_k: Maximum number of results to return
            
        Returns:
            Filtered list of most relevant SOP snippets
        """
        if not sop_snippets:
            return sop_snippets
        
        # Calculate relevance scores for each SOP
        scored_sops = []
        for sop in sop_snippets:
            relevance_score = 0.0
            
            # 1. Module matching bonus (highest priority)
            if incident_module and sop.metadata.get('module'):
                if sop.metadata['module'].lower() == incident_module.lower():
                    relevance_score += 10.0  # Exact module match
                elif incident_module.lower() in sop.metadata['module'].lower():
                    relevance_score += 5.0   # Partial module match
            
            # 2. Score-based relevance (use the highest available score)
            primary_score = sop.score or 0.0
            if hasattr(sop, 'rerank_score') and sop.rerank_score:
                primary_score = max(primary_score, sop.rerank_score)
            if hasattr(sop, 'hybrid_score') and sop.hybrid_score:
                primary_score = max(primary_score, sop.hybrid_score)
            if hasattr(sop, 'vector_score') and sop.vector_score:
                primary_score = max(primary_score, sop.vector_score)
            
            relevance_score += primary_score * 5.0  # Scale score contribution
            
            # 3. Content relevance bonus
            if sop.metadata.get('sop_title'):
                title = sop.metadata['sop_title'].lower()
                if incident_module and incident_module.lower() in title:
                    relevance_score += 2.0
            
            # 4. Error code matching bonus
            if original_request and original_request.error_code and sop.metadata.get('sop_title'):
                title = sop.metadata['sop_title'].upper()
                if original_request.error_code.upper() in title:
                    relevance_score += 3.0
            
            scored_sops.append((sop, relevance_score))
        
        # Sort by relevance score (highest first)
        scored_sops.sort(key=lambda x: x[1], reverse=True)
        
        # Return top-k most relevant SOPs
        filtered_sops = [sop for sop, score in scored_sops[:top_k]]
        
        logger.info(f"Filtered {len(sop_snippets)} SOPs to {len(filtered_sops)} most relevant ones")
        if scored_sops:
            logger.info(f"Top relevance scores: {[score for _, score in scored_sops[:3]]}")
        
        return filtered_sops

    def _convert_enriched_to_response(self, enriched, original_request: EnrichmentRequest) -> EnrichmentResponse:
        """Convert enriched context to EnrichmentResponse"""
        # Convert SOP snippets with complete data and deduplicate by SOP ID
        sop_snippets = []
        seen_sop_ids = set()
        
        # Handle new format where retrieved_sops is a list of dictionaries (full SOP JSON)
        if enriched.retrieved_sops and len(enriched.retrieved_sops) > 0:
            # Check if it's the new format (list of dicts) or old format (list of SopSnippet objects)
            if isinstance(enriched.retrieved_sops[0], dict):
                # New format: list of full SOP dictionaries
                for sop_dict in enriched.retrieved_sops:
                    sop_title = sop_dict.get("Title", "")
                    sop_module = sop_dict.get("Module", "")
                    
                    # Create a unique identifier for deduplication
                    sop_id = f"{sop_module}_{sop_title}".replace(" ", "_")
                    
                    # Skip if we've already processed this SOP
                    if sop_id in seen_sop_ids:
                        continue
                    
                    # Mark this SOP as seen
                    seen_sop_ids.add(sop_id)
                    
                    # Create metadata for the SOP
                    metadata = {
                        "sop_title": sop_title,
                        "module": sop_module,
                        "complete_sop": sop_dict,
                        "overview": sop_dict.get("Overview"),
                        "preconditions": sop_dict.get("Preconditions"),
                        "resolution": sop_dict.get("Resolution"),
                        "verification": sop_dict.get("Verification")
                    }
                    
                    # Create content from title and overview
                    content = f"{sop_title}\n\n{sop_dict.get('Overview', '')}"
                    
                    snippet = SopSnippet(
                        content=content,
                        metadata=metadata,
                        score=1.0  # Default score for new format
                    )
                    sop_snippets.append(snippet)
            else:
                # Old format: list of SopSnippet objects
                # Sort by score (highest first) to prioritize the best match for each SOP
                sorted_sops = sorted(enriched.retrieved_sops, key=lambda x: getattr(x, 'score', 0), reverse=True)
                
                for sop in sorted_sops:
                    # Get SOP ID for deduplication
                    sop_id = sop.metadata.get("sop_id") if hasattr(sop, 'metadata') else None
                    sop_title = sop.metadata.get("sop_title") if hasattr(sop, 'metadata') else None
                    
                    # Skip if we've already processed this SOP ID
                    if sop_id and sop_id in seen_sop_ids:
                        continue
                    
                    # Mark this SOP ID as seen
                    if sop_id:
                        seen_sop_ids.add(sop_id)
                    
                    # Get complete SOP data by title
                    complete_sop = None
                    if sop_title:
                        complete_sop = self._get_complete_sop_by_title(sop_title)
                    
                    # Create enhanced metadata with complete SOP data
                    enhanced_metadata = sop.metadata.copy() if hasattr(sop, 'metadata') else {}
                    if complete_sop:
                        enhanced_metadata.update({
                            "complete_sop": complete_sop,
                            "overview": complete_sop.get("Overview"),
                            "preconditions": complete_sop.get("Preconditions"),
                            "resolution": complete_sop.get("Resolution"),
                            "verification": complete_sop.get("Verification"),
                            "module": complete_sop.get("Module")
                        })
                    
                    # Determine the primary score (highest available)
                    primary_score = None
                    if hasattr(sop, 'rerank_score') and sop.rerank_score is not None:
                        primary_score = sop.rerank_score
                    elif hasattr(sop, 'hybrid_score') and sop.hybrid_score is not None:
                        primary_score = sop.hybrid_score
                    elif hasattr(sop, 'vector_score') and sop.vector_score is not None:
                        primary_score = sop.vector_score
                    elif hasattr(sop, 'score') and sop.score is not None:
                        primary_score = sop.score
                    
                    snippet = SopSnippet(
                        content=sop.content if hasattr(sop, 'content') else "",
                        metadata=enhanced_metadata,
                        vector_score=getattr(sop, 'vector_score', None),
                        bm25_score=getattr(sop, 'bm25_score', None),
                        hybrid_score=getattr(sop, 'hybrid_score', None),
                        rrf_score=getattr(sop, 'rrf_score', None),
                        rerank_score=getattr(sop, 'rerank_score', None),
                        score=primary_score
                    )
                    sop_snippets.append(snippet)
        
        # Apply relevance filtering to keep only the most relevant SOPs
        sop_snippets = self._filter_by_relevance(
            sop_snippets, 
            incident_module=original_request.affected_module,
            original_request=original_request,
            top_k=3  # Keep top 3 most relevant SOPs
        )
        
        # Create response with retrieval metrics
        # Convert RetrievalMetrics to dict if it's an object
        retrieval_metrics_dict = None
        if enriched.retrieval_metrics:
            if hasattr(enriched.retrieval_metrics, '__dict__'):
                retrieval_metrics_dict = enriched.retrieval_metrics.__dict__
            elif isinstance(enriched.retrieval_metrics, dict):
                retrieval_metrics_dict = enriched.retrieval_metrics
            else:
                # Try to convert to dict
                try:
                    retrieval_metrics_dict = dict(enriched.retrieval_metrics)
                except:
                    retrieval_metrics_dict = None
        
        response = EnrichmentResponse(
            incident_id=original_request.incident_id,
            problem_summary=original_request.problem_summary,
            affected_module=original_request.affected_module,
            error_code=original_request.error_code,
            urgency=original_request.urgency,
            retrieved_sops=sop_snippets,
            retrieval_summary=enriched.retrieval_summary,
            total_sops_found=len(sop_snippets),
            retrieval_metrics=retrieval_metrics_dict
        )
        
        return response


# Global service instance
_rag_service_instance: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create RAG service instance"""
    global _rag_service_instance
    
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    
    return _rag_service_instance


# Convenience functions for direct use
def get_enrichment_for_incident(request: EnrichmentRequest) -> EnrichmentResponse:
    """Get enrichment for incident (convenience function)"""
    service = get_rag_service()
    return service.get_enrichment_for_incident(request)


def search_sops(request: RAGSearchRequest) -> RAGSearchResponse:
    """Search SOPs (convenience function)"""
    service = get_rag_service()
    return service.search_sops(request)
