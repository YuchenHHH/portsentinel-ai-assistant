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
export interface ParseRequest {
  source_type: string
  raw_text: string
}

// 事件解析响应接口
export interface ParseResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

// 解析事件报告
export const parseIncident = async (request: ParseRequest): Promise<ParseResponse> => {
  try {
    const response = await apiClient.post<ParseResponse>('/api/v1/incidents/parse', request)
    return response.data
  } catch (error: any) {
    console.error('解析事件报告失败:', error)
    return {
      success: false,
      error: error.response?.data?.detail || error.message || '解析失败',
    }
  }
}

export default apiClient
