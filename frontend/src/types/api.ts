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

// Orchestrator 相关接口

// 解析后的事件数据结构
export interface ParsedIncident {
  incident_id: string | null;
  problem_summary: string;
  affected_module: string;
  error_code: string | null;
  urgency: string;
  entities: Entity[];
  raw_text: string | null;
}

// SOP 响应数据结构 - 匹配后端新的schema
export interface SOPResponse {
  incident_id: string | null;
  problem_summary: string;
  affected_module: string | null;
  error_code: string | null;
  urgency: string;
  retrieved_sops: SopSnippet[];
}

// 执行计划请求接口
export interface PlanRequest {
  incident_context: ParsedIncident;
  sop_response: SOPResponse;
}

// 执行计划响应接口
export interface PlanResponse {
  plan: string[];
  success: boolean;
  message: string | null;
}

// 类型守卫函数
export const isPlanResponse = (data: any): data is PlanResponse => {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.plan) &&
    typeof data.success === 'boolean' &&
    (data.message === null || typeof data.message === 'string')
  );
};

// SOP 执行相关接口

// 执行请求接口
export interface ExecutionRequest {
  plan: string[];
  incident_context: Record<string, any>;
}

// 执行响应接口
export interface ExecutionResponse {
  status: 'in_progress' | 'needs_approval' | 'failed' | 'completed';
  step: number;
  step_description: string;
  tool_output?: string;
  state_token?: string;
  message?: string;
  agent_thoughts?: string;
  tool_calls?: string;
  completed_steps?: Array<{
    step: number;
    step_description: string;
    tool_output: string;
    agent_thoughts?: string;
    tool_calls?: string;
    status: string;
  }>;
}

// 批准请求接口
export interface ApprovalRequest {
  state_token: string;
  approved_query: string;
  approved: boolean;
}

// 继续执行请求接口
export interface ContinueRequest {
  state_token: string;
}

// 批准响应接口
export interface ApprovalResponse {
  success: boolean;
  message: string;
  execution_result?: ExecutionResponse;
}

// 执行状态接口
export interface ExecutionStatus {
  state_token: string;
  status: string;
  step: number;
  total_steps: number;
  created_at: string;
  last_updated: string;
}

// 类型守卫函数
export const isExecutionResponse = (data: any): data is ExecutionResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.status === 'string' &&
    typeof data.step === 'number' &&
    typeof data.step_description === 'string' &&
    (data.tool_output === undefined || typeof data.tool_output === 'string') &&
    (data.state_token === undefined || typeof data.state_token === 'string') &&
    (data.message === undefined || typeof data.message === 'string') &&
    (data.agent_thoughts === undefined || typeof data.agent_thoughts === 'string') &&
    (data.tool_calls === undefined || typeof data.tool_calls === 'string') &&
    (data.completed_steps === undefined || Array.isArray(data.completed_steps))
  );
};

export const isApprovalResponse = (data: any): data is ApprovalResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    typeof data.message === 'string' &&
    (data.execution_result === undefined || isExecutionResponse(data.execution_result))
  );
};

// 历史案例匹配相关接口

// 历史案例接口
export interface HistoricalCase {
  id: string;
  module: string;
  mode: string;
  is_edi: string;
  timestamp: string;
  alert_email: string;
  problem_statement: string;
  solution: string;
  sop: string;
  full_text: string;
}

// 相似度分数接口
export interface SimilarityScore {
  case_id: string;
  similarity_score: number;
  entity_overlap_score: number;
  module_match_score: number;
  final_score: number;
}

// 匹配的历史案例接口
export interface MatchedCase {
  case: HistoricalCase;
  similarity_score: SimilarityScore;
  gpt_validation: boolean;
  gpt_reasoning: string;
}

// 历史案例匹配请求接口
export interface HistoryMatchRequest {
  incident_id: string | null;
  source_type: "Email" | "SMS" | "Call";
  problem_summary: string;
  affected_module: string | null;
  entities: Entity[];
  error_code: string | null;
  urgency: "High" | "Medium" | "Low";
  raw_text: string;
}

// 历史案例匹配响应接口
export interface HistoryMatchResponse {
  incident_id: string | null;
  matched_cases: MatchedCase[];
  total_candidates: number;
  module_filtered_count: number;
  similarity_filtered_count: number;
  gpt_validated_count: number;
  processing_time_ms: number;
}

// 类型守卫函数
export const isHistoryMatchResponse = (data: any): data is HistoryMatchResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.incident_id === 'string' &&
    Array.isArray(data.matched_cases) &&
    typeof data.total_candidates === 'number' &&
    typeof data.module_filtered_count === 'number' &&
    typeof data.similarity_filtered_count === 'number' &&
    typeof data.gpt_validated_count === 'number' &&
    typeof data.processing_time_ms === 'number'
  );
};

// 数据库配置相关接口

// 数据库配置请求接口
export interface DatabaseConfigRequest {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

// 数据库配置响应接口
export interface DatabaseConfigResponse {
  success: boolean;
  message: string;
  database_info?: {
    current_database?: string;
    current_user?: string;
    mysql_version?: string;
    tables?: string[];
  };
}

// 类型守卫函数
export const isDatabaseConfigResponse = (data: any): data is DatabaseConfigResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    typeof data.message === 'string' &&
    (data.database_info === undefined || typeof data.database_info === 'object')
  );
};
