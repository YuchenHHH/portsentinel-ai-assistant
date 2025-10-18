/**
 * API 类型定义
 * 确保与后端 IncidentReport 模型完全匹配
 */

// 实体接口
export interface Entity {
  type: string;
  value: string;
}

// 事件解析请求接口
export interface ParseRequestData {
  source_type: 'Email' | 'SMS' | 'Call';
  raw_text: string;
}

// 事件解析响应接口 - 与后端 IncidentReport 完全匹配
export interface IncidentReportResponse {
  incident_id: string | null;
  source_type: "Email" | "SMS" | "Call";
  received_timestamp_utc: string;
  reported_timestamp_hint: string | null;
  urgency: "High" | "Medium" | "Low";
  affected_module: "Container" | "Vessel" | "EDI/API" | null;
  entities: Entity[];
  error_code: string | null;
  problem_summary: string;
  potential_cause_hint: string | null;
  raw_text: string;
}

// RAG 增强请求接口
export interface EnrichmentRequest {
  incident_id: string | null;
  source_type: "Email" | "SMS" | "Call";
  problem_summary: string;
  affected_module: "Container" | "Vessel" | "EDI/API" | null;
  error_code: string | null;
  urgency: "High" | "Medium" | "Low";
  entities: Entity[];
  raw_text: string;
}

// 完整 SOP 数据结构
export interface CompleteSop {
  Title: string;
  Overview: string | null;
  Preconditions: string | null;
  Resolution: string | null;
  Verification: string | null;
  Module: string;
}

// SOP 元数据接口
export interface SopMetadata {
  sop_id?: string;
  sop_title?: string;
  chunk_type?: string;
  source?: string;
  module?: string;
  sop_index?: number;
  // 完整的 SOP 数据
  complete_sop?: CompleteSop;
  overview?: string | null;
  preconditions?: string | null;
  resolution?: string | null;
  verification?: string | null;
  [key: string]: any;
}

// SOP 片段接口 - 支持混合检索分数
export interface SopSnippet {
  content: string;
  metadata: SopMetadata;
  // 多种分数类型
  vector_score?: number | null;
  bm25_score?: number | null;
  hybrid_score?: number | null;
  rrf_score?: number | null;
  rerank_score?: number | null;
  // 主要分数（向后兼容）
  score: number | null;
}

// 检索指标接口
export interface RetrievalMetrics {
  num_expanded_queries: number;
  num_bm25_candidates: number;
  num_vector_candidates: number;
  num_merged_candidates: number;
  num_after_rrf: number;
  num_final_results: number;
  bm25_weight: number;
  vector_weight: number;
  rrf_k: number;
}

// RAG 增强响应接口
export interface EnrichmentResponse {
  incident_id: string | null;
  problem_summary: string;
  affected_module: string | null;
  error_code: string | null;
  urgency: string;
  retrieved_sops: SopSnippet[];
  retrieval_summary: string;
  total_sops_found: number;
  retrieval_metrics?: RetrievalMetrics | null;
}

// API 错误响应接口
export interface ApiErrorResponse {
  error: string;
  message: string;
  error_code?: string;
  details?: Record<string, any>;
}

// 类型守卫函数
export const isIncidentReportResponse = (data: any): data is IncidentReportResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.source_type === 'string' &&
    ['Email', 'SMS', 'Call'].includes(data.source_type) &&
    typeof data.received_timestamp_utc === 'string' &&
    typeof data.urgency === 'string' &&
    ['High', 'Medium', 'Low'].includes(data.urgency) &&
    typeof data.problem_summary === 'string' &&
    typeof data.raw_text === 'string' &&
    Array.isArray(data.entities)
  );
};

export const isApiErrorResponse = (data: any): data is ApiErrorResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.error === 'string' &&
    typeof data.message === 'string'
  );
};

export const isEnrichmentResponse = (data: any): data is EnrichmentResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.problem_summary === 'string' &&
    typeof data.urgency === 'string' &&
    typeof data.retrieval_summary === 'string' &&
    typeof data.total_sops_found === 'number' &&
    Array.isArray(data.retrieved_sops)
  );
};
