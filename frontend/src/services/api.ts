import axios from 'axios'
import {
  ParseRequestData,
  IncidentReportResponse,
  EnrichmentRequest,
  EnrichmentResponse,
  PlanRequest,
  PlanResponse,
  isIncidentReportResponse,
  isEnrichmentResponse,
  isPlanResponse,
  isApiErrorResponse
} from '../types/api'

// API 基础配置
// 在开发模式下，使用代理，所以使用相对路径
const API_BASE_URL = process.env.REACT_APP_API_URL || ''

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('发送请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('响应错误:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

// 解析事件报告
export const parseIncidentReport = async (data: ParseRequestData): Promise<IncidentReportResponse> => {
  try {
    const response = await apiClient.post<IncidentReportResponse>('/api/v1/incidents/parse', data);
    
    // 验证响应数据类型
    if (!isIncidentReportResponse(response.data)) {
      console.error('API 响应数据格式不正确:', response.data);
      throw new Error('服务器返回的数据格式不正确');
    }
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      
      // 检查是否是结构化的错误响应
      if (isApiErrorResponse(errorData)) {
        console.error('API Error:', errorData);
        throw new Error(`${errorData.error}: ${errorData.message}`);
      } else if (errorData?.detail) {
        // 处理 FastAPI 的错误格式
        console.error('API Error:', errorData.detail);
        throw new Error(typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail));
      } else {
        console.error('API Error:', error.message);
        throw new Error(error.message || 'An unexpected API error occurred.');
      }
    }
    console.error('Unexpected Error:', error);
    throw new Error('An unexpected error occurred.');
  }
}

// RAG 增强事件报告
export const enrichIncident = async (data: EnrichmentRequest): Promise<EnrichmentResponse> => {
  try {
    const response = await apiClient.post<EnrichmentResponse>('/api/v1/rag/enrich', data);
    
    // 验证响应数据类型
    if (!isEnrichmentResponse(response.data)) {
      console.error('RAG API 响应数据格式不正确:', response.data);
      throw new Error('RAG 服务器返回的数据格式不正确');
    }
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      
      // 检查是否是结构化的错误响应
      if (isApiErrorResponse(errorData)) {
        console.error('RAG API Error:', errorData);
        throw new Error(`${errorData.error}: ${errorData.message}`);
      } else if (errorData?.detail) {
        // 处理 FastAPI 的错误格式
        console.error('RAG API Error:', errorData.detail);
        throw new Error(typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail));
      } else {
        console.error('RAG API Error:', error.message);
        throw new Error(error.message || 'RAG 服务发生意外错误');
      }
    }
    console.error('RAG Unexpected Error:', error);
    throw new Error('RAG 增强过程中发生意外错误');
  }
}

// 生成执行计划
export const fetchExecutionPlan = async (planRequest: PlanRequest): Promise<PlanResponse> => {
  try {
    const response = await apiClient.post<PlanResponse>('/api/v1/orchestrator/plan', planRequest);
    
    // 验证响应数据类型
    if (!isPlanResponse(response.data)) {
      console.error('Orchestrator API 响应数据格式不正确:', response.data);
      throw new Error('Orchestrator 服务器返回的数据格式不正确');
    }
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      
      // 检查是否是结构化的错误响应
      if (isApiErrorResponse(errorData)) {
        console.error('Orchestrator API Error:', errorData);
        throw new Error(`${errorData.error}: ${errorData.message}`);
      } else if (errorData?.detail) {
        // 处理 FastAPI 的错误格式
        console.error('Orchestrator API Error:', errorData.detail);
        throw new Error(typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail));
      } else {
        console.error('Orchestrator API Error:', error.message);
        throw new Error(error.message || 'Orchestrator 服务发生意外错误');
      }
    }
    console.error('Orchestrator Unexpected Error:', error);
    throw new Error('执行计划生成过程中发生意外错误');
  }
}

export default apiClient