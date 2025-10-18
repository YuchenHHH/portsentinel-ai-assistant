import axios from 'axios'
import {
  ParseRequestData,
  IncidentReportResponse,
  isIncidentReportResponse,
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

export default apiClient