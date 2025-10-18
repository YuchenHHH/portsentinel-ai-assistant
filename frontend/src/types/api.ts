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
