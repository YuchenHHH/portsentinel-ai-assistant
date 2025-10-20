/**
 * 执行摘要 API 服务
 * 提供与后端 Agent 4 集成的接口
 */

import apiClient from './api';

export interface ExecutionSummaryRequest {
  execution_status: 'completed' | 'failed' | 'timeout';
  execution_notes?: string;
  total_execution_time_hours?: number;
  completed_steps?: Array<{
    step: number;
    step_description: string;
    tool_output?: string;
    agent_thoughts?: string;
    tool_calls?: string;
    status: string;
  }>;
}

export interface ExecutionSummaryResponse {
  success: boolean;
  incident_id: string;
  summary: {
    success: boolean;
    incident_id: string;
    execution_status: string;
    escalation_required: boolean;
    resolution_outcome: string;
    summary_path: string;
    escalation_contact?: {
      contact_name: string;
      role: string;
      email: string;
      module: string;
    };
    escalation_email?: {
      to_email: string;
      subject: string;
      body: string;
      priority: string;
    };
    resolution_summary: {
      incident_id: string;
      resolution_outcome: string;
      error_identified: string;
      root_cause: string;
      actions_taken: string[];
      resolution_timestamp: string;
      l2_team_notes: string;
      escalation_required: boolean;
    };
    completed_steps_count: number;
    total_execution_time_hours: number;
  };
}

export interface SummaryServiceStatus {
  status: string;
  service: string;
  agent_4_integration: string;
  message: string;
}

/**
 * Generate Summary
 */
export const generateExecutionSummary = async (
  incidentId: string,
  request: ExecutionSummaryRequest
): Promise<ExecutionSummaryResponse> => {
  try {
    const response = await apiClient.post<ExecutionSummaryResponse>(
      `/api/v1/execution-summary/generate/${incidentId}`,
      request
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Execution Summary API Error:', error);
    throw new Error(
      error.response?.data?.detail || 
      error.message || 
      '执行摘要生成失败'
    );
  }
};

/**
 * 获取摘要服务状态
 */
export const getSummaryServiceStatus = async (): Promise<SummaryServiceStatus> => {
  try {
    const response = await apiClient.get<SummaryServiceStatus>(
      '/api/v1/execution-summary/status'
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Summary Service Status API Error:', error);
    throw new Error(
      error.response?.data?.detail || 
      error.message || 
      '获取摘要服务状态失败'
    );
  }
};

/**
 * 获取摘要 Markdown 内容
 */
export const getSummaryMarkdown = async (incidentId: string): Promise<{
  success: boolean;
  incident_id: string;
  file_path: string;
  markdown_content: string;
  file_name: string;
}> => {
  try {
    const response = await apiClient.get(`/api/v1/execution-summary/markdown/${incidentId}`);
    return response.data;
  } catch (error: any) {
    console.error('获取摘要 Markdown 内容失败:', error);
    throw new Error(
      error.response?.data?.detail || 
      error.message || 
      '获取摘要内容失败'
    );
  }
};

/**
 * 获取最新的摘要 Markdown 内容
 */
export const getLatestSummaryMarkdown = async (): Promise<{
  success: boolean;
  incident_id: string;
  file_path: string;
  markdown_content: string;
  file_name: string;
}> => {
  try {
    const response = await apiClient.get('/api/v1/execution-summary/markdown/latest');
    return response.data;
  } catch (error: any) {
    console.error('获取最新摘要 Markdown 内容失败:', error);
    throw new Error(
      error.response?.data?.detail || 
      error.message || 
      '获取最新摘要内容失败'
    );
  }
};

export const getLocalLatestSummary = async (): Promise<{
  success: boolean;
  incident_id: string;
  file_path: string;
  markdown_content: string;
  file_name: string;
  file_size: number;
  last_modified: number;
}> => {
  try {
    const response = await apiClient.get('/api/v1/execution-summary/local-latest');
    return response.data;
  } catch (error: any) {
    console.error('获取本地最新摘要文件失败:', error);
    throw new Error(
      error.response?.data?.detail || 
      error.message || 
      '获取本地最新摘要文件失败'
    );
  }
};
