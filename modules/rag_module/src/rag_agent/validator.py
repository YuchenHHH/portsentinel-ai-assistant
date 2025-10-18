"""
混合检索 RAG Agent：BM25 + Vector + Multi-Query + RRF + Rerank
"""

import json
from typing import List, Dict, Any, Tuple
from collections import defaultdict
import sys
from pathlib import Path

# Add paths
parsing_module_path = Path(__file__).parent.parent.parent.parent / "incident_parser" / "src"
sys.path.insert(0, str(parsing_module_path))

from parsing_agent.models import IncidentReport
from rag_agent.models import EnrichedContext, SopSnippet, RetrievalMetrics
from rag_agent.query_expander import QueryExpander
from data_sources.vector_store_interface import VectorStoreInterface
from data_sources.bm25_retriever import BM25Retriever
from data_sources.reranker import SemanticReranker, SimpleReranker


class HybridRagAgent:
    """
    混合检索 RAG Agent
    
    工作流：
    1. Multi-Query 生成查询变体
    2. 对每个查询执行 BM25 + Vector 混合检索
    3. RRF (Reciprocal Rank Fusion) 融合多查询结果
    4. 语义 Rerank 重排序
    5. 返回 Top-K 完整 SOP (原始 JSON 格式)
    """
    
    def __init__(
        self,
        vector_store_interface: VectorStoreInterface,
        bm25_retriever: BM25Retriever = None,
        query_expander: QueryExpander = None,
        reranker: SemanticReranker = None,
        bm25_weight: float = 0.4,
        vector_weight: float = 0.6,
        rrf_k: int = 60,
        use_llm: bool = True,
        verbose: bool = True
    ):
        """
        初始化混合 RAG Agent
        
        Args:
            vector_store_interface: 向量存储接口
            bm25_retriever: BM25 检索器（可选，自动创建）
            query_expander: 查询扩展器（可选）
            reranker: 语义 Reranker（可选）
            bm25_weight: BM25 权重
            vector_weight: 向量检索权重
            rrf_k: RRF 参数
            use_llm: 是否使用 LLM（Query Expansion 和 Rerank）
            verbose: 是否显示详细日志
        """
        self.vector_store = vector_store_interface
        self.bm25_weight = bm25_weight
        self.vector_weight = vector_weight
        self.rrf_k = rrf_k
        self.use_llm = use_llm
        self.verbose = verbose
        
        # 初始化 BM25
        if bm25_retriever is None:
            try:
                self.bm25_retriever = BM25Retriever()
            except Exception as e:
                print(f"Warning: BM25 initialization failed: {e}")
                self.bm25_retriever = None
        else:
            self.bm25_retriever = bm25_retriever
        
        # 初始化 Query Expander
        if query_expander is None:
            if not use_llm:
                raise ValueError(
                    "QueryExpander requires LLM support. "
                    "Provide a custom query_expander when use_llm=False."
                )
            self.query_expander = QueryExpander()
        else:
            self.query_expander = query_expander
        
        # 初始化 Reranker
        if reranker is None:
            if use_llm:
                try:
                    self.reranker = SemanticReranker()
                except Exception as e:
                    print(f"Warning: LLM Reranker failed, using simple reranker: {e}")
                    self.reranker = SimpleReranker()
            else:
                self.reranker = SimpleReranker()
        else:
            self.reranker = reranker
    
    def _build_search_query(self, report: IncidentReport) -> str:
        """构建初始搜索查询"""
        query_parts = []
        
        if report.error_code:
            query_parts.append(f"Error code: {report.error_code}")
        
        query_parts.append(report.problem_summary)
        
        if report.affected_module:
            query_parts.append(f"Module: {report.affected_module}")
        
        # 关键实体
        for entity in report.entities[:5]:
            if entity.type in ["container_number", "vessel_name", "error_code", "message_type"]:
                query_parts.append(f"{entity.type}: {entity.value}")
        
        return " | ".join(query_parts)
    

    
    def _hybrid_search_single_query(
        self,
        query: str,
        k: int = 10
    ) -> List[Tuple[Dict[str, Any], float, str, float, float]]:
        """
        单个查询的混合检索
        
        Returns:
            List of (SOP, hybrid_score, source, bm25_score, vector_score)
        """
        results_dict = {}
        
        # ===== BM25 检索 =====
        if self.verbose:
            print(f"\n  [BM25] 检索中...")
        
        bm25_results = []
        if self.bm25_retriever:
            try:
                bm25_results = self.bm25_retriever.search_normalized(query, k=k)
                
                if self.verbose:
                    print(f"  [BM25] ✓ 返回 {len(bm25_results)} 个结果")
                    if bm25_results:
                        print(f"  [BM25] Top 3:")
                        for i, (sop, score) in enumerate(bm25_results[:3], 1):
                            title = sop.get('Title', 'Unknown')
                            print(f"    {i}. {title[:45]}... (归一化分数: {score:.4f})")
            except Exception as e:
                if self.verbose:
                    print(f"  [BM25] ⚠️ 失败: {e}")
        
        # ===== 向量检索 =====
        if self.verbose:
            print(f"\n  [Vector] 检索中...")
        
        vector_results = []
        try:
            docs_and_scores = self.vector_store.search_with_scores(query, k=k)
            
            for doc, score in docs_and_scores:
                full_sop_json = doc.metadata.get('full_sop_json')
                
                if full_sop_json:
                    try:
                        sop = json.loads(full_sop_json)
                        vector_results.append((sop, float(score)))
                    except json.JSONDecodeError:
                        continue
            
            if self.verbose:
                print(f"  [Vector] ✓ 返回 {len(vector_results)} 个结果")
                if vector_results:
                    print(f"  [Vector] Top 3:")
                    for i, (sop, score) in enumerate(vector_results[:3], 1):
                        title = sop.get('Title', 'Unknown')
                        print(f"    {i}. {title[:45]}... (余弦相似度: {score:.4f})")
                        
        except Exception as e:
            if self.verbose:
                print(f"  [Vector] ⚠️ 失败: {e}")
        
        # ===== 合并 =====
        for sop, bm25_score in bm25_results:
            sop_id = sop.get("Title", "")
            if sop_id:
                results_dict[sop_id] = (sop, bm25_score, 0.0)
        
        for sop, vector_score in vector_results:
            sop_id = sop.get("Title", "")
            if sop_id:
                if sop_id in results_dict:
                    existing_sop, bm25_score, _ = results_dict[sop_id]
                    results_dict[sop_id] = (existing_sop, bm25_score, vector_score)
                else:
                    results_dict[sop_id] = (sop, 0.0, vector_score)
        
        if self.verbose:
            print(f"\n  [Merge] ✓ 合并后唯一文档数: {len(results_dict)}")
        
        # ===== 计算混合分数 =====
        if self.verbose:
            print(f"  [Hybrid] 计算加权分数 (α={self.bm25_weight}, β={self.vector_weight})...")
        
        hybrid_results = []
        for sop_id, (sop, bm25_score, vector_score) in results_dict.items():
            hybrid_score = (
                self.bm25_weight * bm25_score +
                self.vector_weight * vector_score
            )
            
            if bm25_score > 0 and vector_score > 0:
                source = 'both'
            elif bm25_score > 0:
                source = 'bm25'
            else:
                source = 'vector'
            
            hybrid_results.append((sop, hybrid_score, source, bm25_score, vector_score))
        
        hybrid_results.sort(key=lambda x: x[1], reverse=True)
        
        if self.verbose and hybrid_results:
            print(f"  [Hybrid] Top 5 结果:")
            for i, (sop, hybrid_score, source, bm25_score, vector_score) in enumerate(hybrid_results[:5], 1):
                title = sop.get('Title', 'Unknown')
                print(f"    {i}. {title[:35]}...")
                print(f"       BM25={bm25_score:.4f}, Vec={vector_score:.4f}, Hybrid={hybrid_score:.4f} [{source}]")
        
        return hybrid_results


    def _reciprocal_rank_fusion(
        self,
        multi_query_results: List[List[Tuple[Dict, float, str, float, float]]],
        k: int = 60
    ) -> List[Tuple[Dict[str, Any], float]]:
        """RRF 融合（更新参数类型）"""
        rrf_scores = defaultdict(float)
        sop_dict = {}
        
        for query_results in multi_query_results:
            # ✅ 解包 5 个元素
            for rank, (sop, hybrid_score, source, bm25_score, vector_score) in enumerate(query_results):
                sop_id = sop.get("Title", "")
                if not sop_id:
                    continue
                
                rrf_scores[sop_id] += 1.0 / (k + rank + 1)
                
                if sop_id not in sop_dict:
                    sop_dict[sop_id] = sop
        
        fused_results = [
            (sop_dict[sop_id], rrf_score)
            for sop_id, rrf_score in rrf_scores.items()
        ]
        
        fused_results.sort(key=lambda x: x[1], reverse=True)
        
        return fused_results
    
    def _extract_full_sops(self, snippets: List[Tuple[Dict, float]]) -> List[Dict[str, Any]]:
        """
        提取完整 SOP（已经是原始 JSON 格式）
        
        Args:
            snippets: [(SOP dict, score), ...]
        
        Returns:
            List of SOP dicts
        """
        return [sop for sop, _ in snippets]
    
    def retrieve(
        self,
        report: IncidentReport,
        num_query_variants: int = 3,
        k_per_query: int = 10,
        top_k_after_rrf: int = 10,
        final_top_k: int = 3
    ) -> EnrichedContext:
        """
        混合检索主流程
        """
        # ===== Step 1: Multi-Query 生成 =====
        original_query = self._build_search_query(report)
        
        try:
            expanded_queries = self.query_expander.expand_from_report(
                report, 
                num_variants=num_query_variants
            )
        except Exception as e:
            print(f"Warning: Query expansion failed: {e}")
            expanded_queries = [original_query]
        
        print(f"\n[Multi-Query] Generated {len(expanded_queries)} queries:")
        for i, q in enumerate(expanded_queries, 1):
            print(f"  {i}. {q[:100]}...")
        
        # ===== Step 2: 对每个查询执行混合检索 =====
        all_query_results = []
        total_bm25_candidates = 0
        total_vector_candidates = 0
        
        for idx, query in enumerate(expanded_queries, 1):
            if self.verbose:
                print(f"\n{'=' * 80}")
                print(f"[Hybrid Search] 查询 {idx}/{len(expanded_queries)}")
                print(f"{'=' * 80}")
            
            query_results = self._hybrid_search_single_query(query, k=k_per_query)
            all_query_results.append(query_results)
            
            # ✅ 修复：解包 5 个元素 (sop, hybrid_score, source, bm25_score, vector_score)
            bm25_count = sum(1 for _, _, src, bm25_s, _ in query_results if src in ['bm25', 'both'])
            vector_count = sum(1 for _, _, src, _, vec_s in query_results if src in ['vector', 'both'])
            
            total_bm25_candidates += bm25_count
            total_vector_candidates += vector_count
        
        print(f"\n[Hybrid Search] Retrieved candidates per query: {k_per_query}")
        print(f"  - Total BM25 candidates: {total_bm25_candidates}")
        print(f"  - Total Vector candidates: {total_vector_candidates}")
        
        # ===== Step 3: RRF 融合 =====
        rrf_results = self._reciprocal_rank_fusion(
            all_query_results,
            k=self.rrf_k
        )
        
        # 取 Top-K after RRF
        rrf_top_k = rrf_results[:top_k_after_rrf]
        
        print(f"\n[RRF Fusion] Top {len(rrf_top_k)} candidates after RRF")
        
        # ===== Step 4: 语义 Rerank =====
        candidate_sops = [sop for sop, _ in rrf_top_k]
        
        try:
            reranked_results = self.reranker.rerank(
                query=original_query,
                candidates=candidate_sops,
                top_k=final_top_k
            )
        except Exception as e:
            print(f"Warning: Reranking failed: {e}")
            reranked_results = rrf_top_k[:final_top_k]
        
        print(f"\n[Rerank] Final Top {len(reranked_results)} SOPs:")
        for i, (sop, score) in enumerate(reranked_results, 1):
            print(f"  {i}. {sop.get('Title', 'Unknown')[:60]}... (score: {score:.4f})")
        
        # ===== Step 5: 提取完整 SOP =====
        final_sops = self._extract_full_sops(reranked_results)
        
        # ===== Step 6: 生成摘要 =====
        retrieval_summary = self._generate_summary(
            report=report,
            final_sops=final_sops,
            num_queries=len(expanded_queries),
            num_candidates_after_rrf=len(rrf_top_k)
        )
        
        # ===== Step 7: 收集评估指标 =====
        metrics = RetrievalMetrics(
            num_expanded_queries=len(expanded_queries),
            num_bm25_candidates=total_bm25_candidates,
            num_vector_candidates=total_vector_candidates,
            num_merged_candidates=len(rrf_results),
            num_after_rrf=len(rrf_top_k),
            num_final_results=len(final_sops),
            bm25_weight=self.bm25_weight,
            vector_weight=self.vector_weight,
            rrf_k=self.rrf_k
        )
        
        # ===== Step 8: 构建输出 =====
        enriched_context = EnrichedContext(
            original_report=report,
            expanded_queries=expanded_queries,
            retrieved_sops=final_sops,
            retrieval_summary=retrieval_summary,
            retrieval_metrics=metrics
        )
        
        return enriched_context
    
    def _generate_summary(
        self,
        report: IncidentReport,
        final_sops: List[Dict],
        num_queries: int,
        num_candidates_after_rrf: int
    ) -> str:
        """生成检索摘要"""
        if not final_sops:
            return (
                f"No relevant SOPs found for incident {report.incident_id} "
                f"after multi-query hybrid search. Manual review recommended."
            )
        
        top_sop = final_sops[0]
        top_title = top_sop.get("Title", "Unknown")
        
        summary_parts = [
            f"Retrieved {len(final_sops)} SOP(s) for incident {report.incident_id} "
            f"using hybrid search (BM25 + Vector + Multi-Query + RRF + Rerank).",
            f"Generated {num_queries} query variants.",
            f"Processed {num_candidates_after_rrf} candidates after RRF.",
            f"Top match: {top_title}"
        ]
        
        if report.affected_module:
            summary_parts.append(f"Affected module: {report.affected_module}")
        
        if report.error_code:
            summary_parts.append(f"Error code: {report.error_code}")
        
        return " ".join(summary_parts)


# 向后兼容的简单版本 (原 RagAgent)
class RagAgent(HybridRagAgent):
    """
    简化版 RAG Agent（保持向后兼容）
    使用默认参数的混合检索
    """
    
    def __init__(self, vector_store_interface: VectorStoreInterface):
        """使用默认配置初始化"""
        super().__init__(
            vector_store_interface=vector_store_interface,
            use_llm=True,
            verbose=False   # 默认不显示详细日志
        )
    
    def retrieve(self, report: IncidentReport, k: int = 3) -> EnrichedContext:
        """
        简化接口（向后兼容）
        
        Args:
            report: 事件报告
            k: 返回 Top-K SOPs
        
        Returns:
            EnrichedContext
        """
        return super().retrieve(
            report=report,
            num_query_variants=2,  # 较少的查询变体
            k_per_query=10,
            top_k_after_rrf=10,
            final_top_k=k
        )
