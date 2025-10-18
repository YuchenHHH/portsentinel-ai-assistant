/**
 * 聊天消息类型定义
 */

import { IncidentReportResponse } from './api';

// 消息类型
export type MessageType = 'user' | 'assistant' | 'system';

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'error';

// 基础消息接口
export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: Date;
  status: MessageStatus;
}

// 用户消息
export interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
  sourceType: 'Email' | 'SMS' | 'Call';
}

// 助手消息（包含解析结果）
export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  incidentReport: IncidentReportResponse;
}

// 系统消息
export interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;
}

// 联合消息类型
export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

// 聊天状态
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// 聊天输入状态
export interface ChatInputState {
  text: string;
  sourceType: 'Email' | 'SMS' | 'Call';
  isSubmitting: boolean;
}

// 消息创建工具函数
export const createUserMessage = (
  content: string,
  sourceType: 'Email' | 'SMS' | 'Call'
): UserMessage => ({
  id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'user',
  content,
  sourceType,
  timestamp: new Date(),
  status: 'sent'
});

export const createAssistantMessage = (
  content: string,
  incidentReport: IncidentReportResponse
): AssistantMessage => ({
  id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  incidentReport,
  timestamp: new Date(),
  status: 'sent'
});

export const createSystemMessage = (content: string): SystemMessage => ({
  id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'system',
  content,
  timestamp: new Date(),
  status: 'sent'
});

// 类型守卫函数
export const isUserMessage = (message: ChatMessage): message is UserMessage => {
  return message.type === 'user';
};

export const isAssistantMessage = (message: ChatMessage): message is AssistantMessage => {
  return message.type === 'assistant';
};

export const isSystemMessage = (message: ChatMessage): message is SystemMessage => {
  return message.type === 'system';
};
