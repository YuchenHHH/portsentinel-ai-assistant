/**
 * 聊天消息类型定义
 */

import { IncidentReportResponse, EnrichmentResponse, HistoryMatchResponse } from './api';

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

// RAG 增强消息
export interface EnrichmentMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  enrichmentData: EnrichmentResponse;
  isEnrichment: true;
}

// 历史案例匹配消息
export interface HistoryMatchMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  historyData: HistoryMatchResponse;
  isHistoryMatch: true;
}

// 加载消息
export interface LoadingMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  isLoading: true;
}

// SOP 执行消息
export interface SOPExecutionMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  executionData: {
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
  };
  isSOPExecution: true;
}

// 批准请求消息
export interface ApprovalRequestMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  approvalData: {
    state_token: string;
    query: string;
    step_description: string;
  };
  isApprovalRequest: true;
}

// 继续执行消息
export interface ContinueExecutionMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  continueData: {
    state_token: string;
    step_description: string;
    tool_output: string;
  };
  isContinueExecution: true;
}

// 下一步确认消息
export interface NextStepConfirmMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  nextStepData: {
    step_name: string;
    step_description: string;
    parsed_result: any;
  };
  isNextStepConfirm: true;
}

// 摘要生成消息
export interface SummaryGenerationMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  summaryData: {
    incident_id: string;
    completed_steps_count: number;
    execution_status: string;
  };
  isSummaryGeneration: true;
}

// 执行计划确认消息
export interface PlanConfirmationMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  planData: {
    plan: string[];
    incident_context: Record<string, any>;
  };
  isPlanConfirmation: true;
}

// 系统消息
export interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;
}

// 联合消息类型
export type ChatMessage = UserMessage | AssistantMessage | EnrichmentMessage | HistoryMatchMessage | LoadingMessage | SOPExecutionMessage | ApprovalRequestMessage | ContinueExecutionMessage | NextStepConfirmMessage | SummaryGenerationMessage | PlanConfirmationMessage | SystemMessage;

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

export const createEnrichmentMessage = (
  content: string,
  enrichmentData: EnrichmentResponse
): EnrichmentMessage => ({
  id: `enrichment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  enrichmentData,
  isEnrichment: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createHistoryMatchMessage = (
  content: string,
  historyData: HistoryMatchResponse
): HistoryMatchMessage => ({
  id: `history_match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  historyData,
  isHistoryMatch: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createLoadingMessage = (content: string): LoadingMessage => ({
  id: `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  isLoading: true,
  timestamp: new Date(),
  status: 'sending'
});

export const createSOPExecutionMessage = (
  content: string,
  executionData: SOPExecutionMessage['executionData']
): SOPExecutionMessage => ({
  id: `sop_execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  executionData,
  isSOPExecution: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createApprovalRequestMessage = (
  content: string,
  approvalData: ApprovalRequestMessage['approvalData']
): ApprovalRequestMessage => ({
  id: `approval_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  approvalData,
  isApprovalRequest: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createContinueExecutionMessage = (
  content: string,
  continueData: ContinueExecutionMessage['continueData']
): ContinueExecutionMessage => ({
  id: `continue_execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  continueData,
  isContinueExecution: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createNextStepConfirmMessage = (
  content: string,
  nextStepData: NextStepConfirmMessage['nextStepData']
): NextStepConfirmMessage => ({
  id: `next_step_confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  nextStepData,
  isNextStepConfirm: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createSummaryGenerationMessage = (
  content: string,
  summaryData: SummaryGenerationMessage['summaryData']
): SummaryGenerationMessage => ({
  id: `summary_generation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  summaryData,
  isSummaryGeneration: true,
  timestamp: new Date(),
  status: 'sent'
});

export const createPlanConfirmationMessage = (
  content: string,
  planData: PlanConfirmationMessage['planData']
): PlanConfirmationMessage => ({
  id: `plan_confirmation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'assistant',
  content,
  planData,
  isPlanConfirmation: true,
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

export const isEnrichmentMessage = (message: ChatMessage): message is EnrichmentMessage => {
  return message.type === 'assistant' && 'isEnrichment' in message && message.isEnrichment === true;
};

export const isHistoryMatchMessage = (message: ChatMessage): message is HistoryMatchMessage => {
  return message.type === 'assistant' && 'isHistoryMatch' in message && message.isHistoryMatch === true;
};

export const isLoadingMessage = (message: ChatMessage): message is LoadingMessage => {
  return message.type === 'assistant' && 'isLoading' in message && message.isLoading === true;
};

export const isSOPExecutionMessage = (message: ChatMessage): message is SOPExecutionMessage => {
  return message.type === 'assistant' && 'isSOPExecution' in message && message.isSOPExecution === true;
};

export const isApprovalRequestMessage = (message: ChatMessage): message is ApprovalRequestMessage => {
  return message.type === 'assistant' && 'isApprovalRequest' in message && message.isApprovalRequest === true;
};

export const isContinueExecutionMessage = (message: ChatMessage): message is ContinueExecutionMessage => {
  return message.type === 'assistant' && 'isContinueExecution' in message && message.isContinueExecution === true;
};

export const isNextStepConfirmMessage = (message: ChatMessage): message is NextStepConfirmMessage => {
  return message.type === 'assistant' && 'isNextStepConfirm' in message && message.isNextStepConfirm === true;
};

export const isSummaryGenerationMessage = (message: ChatMessage): message is SummaryGenerationMessage => {
  return message.type === 'assistant' && 'isSummaryGeneration' in message && message.isSummaryGeneration === true;
};

export const isPlanConfirmationMessage = (message: ChatMessage): message is PlanConfirmationMessage => {
  return message.type === 'assistant' && 'isPlanConfirmation' in message && message.isPlanConfirmation === true;
};

export const isSystemMessage = (message: ChatMessage): message is SystemMessage => {
  return message.type === 'system';
};
