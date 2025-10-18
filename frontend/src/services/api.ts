import axios from 'axios'

// API 基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

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

// 事件解析请求接口
export interface ParseRequestData {
  source_type: 'Email' | 'SMS' | 'Call';
  raw_text: string;
}

// 实体接口
export interface Entity {
  type: string;
  value: string;
}

// 事件解析响应接口 - 使用真实的 IncidentReport 结构
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

// 解析事件报告
export const parseIncidentReport = async (data: ParseRequestData): Promise<IncidentReportResponse> => {
  try {
    const response = await apiClient.post<IncidentReportResponse>('/api/v1/incidents/parse', data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data?.detail || error.message);
      throw new Error(error.response?.data?.detail || 'An unexpected API error occurred.');
    }
    console.error('Unexpected Error:', error);
    throw new Error('An unexpected error occurred.');
  }
}

export default apiClient