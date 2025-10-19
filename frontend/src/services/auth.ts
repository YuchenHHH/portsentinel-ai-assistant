/**
 * 认证API服务
 */

import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

// 在开发模式下使用代理,所以使用空字符串
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Attempting login with:', credentials.email);
      
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        throw new Error(errorData.detail || '登录失败');
      }

      const data = await response.json();
      console.log('Login successful:', data.user.email);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Attempting registration with:', userData.email);
      
      const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        throw new Error(errorData.detail || '注册失败');
      }

      const data = await response.json();
      console.log('Registration successful:', data.user.email);
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * 验证token
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      console.log('Verifying token...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Token verification status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
