import React, { useState } from 'react'
import { Box, Container, Heading, VStack, HStack, Button, Badge } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import DatabaseConnectionModal from './components/DatabaseConnectionModal'
import { parseIncidentReport, enrichIncident, fetchExecutionPlan, executeSOPPlan, approveSOPExecution, getDatabaseStatus } from '../../services/api'
import { IncidentReportResponse, EnrichmentRequest, PlanRequest, ParsedIncident, SOPResponse } from '../../types/api'
import { 
  createUserMessage, 
  createAssistantMessage, 
  createEnrichmentMessage, 
  createLoadingMessage,
  createSOPExecutionMessage,
  createApprovalRequestMessage,
  createPlanConfirmationMessage,
  ChatMessage 
} from '../../types/chat'

const MotionBox = motion(Box)

export const IncidentParserPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingApproval, setIsProcessingApproval] = useState(false)
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<any>({ success: false, message: '检查连接状态...' })

  const handleSubmit = async (text: string, sourceType: 'Email' | 'SMS' | 'Call') => {
    setIsLoading(true)

    // 创建用户消息
    const userMessage = createUserMessage(text, sourceType)

    // 创建解析加载消息
    const parsingLoadingMessage = createLoadingMessage('正在解析事件报告...')

    // 添加消息到状态
    setMessages((prev) => [...prev, userMessage, parsingLoadingMessage])

    try {
      // 第一步：调用API解析事件
      const parsedResult: IncidentReportResponse = await parseIncidentReport({
        source_type: sourceType,
        raw_text: text,
      })

      // 更新解析加载消息为解析结果
      const assistantMessage = createAssistantMessage(
        '事件解析完成，以下是解析结果：',
        parsedResult
      )

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parsingLoadingMessage.id ? assistantMessage : msg
        )
      )

      // 第二步：调用RAG增强
      const ragLoadingMessage = createLoadingMessage('正在检索知识库...')
      setMessages((prev) => [...prev, ragLoadingMessage])

      try {
        // 构建RAG请求
        const enrichmentRequest: EnrichmentRequest = {
          incident_id: parsedResult.incident_id,
          source_type: parsedResult.source_type,
          problem_summary: parsedResult.problem_summary,
          affected_module: parsedResult.affected_module,
          error_code: parsedResult.error_code,
          urgency: parsedResult.urgency,
          entities: parsedResult.entities,
          raw_text: parsedResult.raw_text,
        }

        // 调用RAG增强API
        const enrichmentResult = await enrichIncident(enrichmentRequest)

        // 创建RAG增强消息
        const enrichmentMessage = createEnrichmentMessage(
          '知识库检索完成，以下是相关SOP建议：',
          enrichmentResult
        )

        // 更新RAG加载消息为增强结果
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === ragLoadingMessage.id ? enrichmentMessage : msg
          )
        )

        // 第三步：生成执行计划
        const planLoadingMessage = createLoadingMessage('正在生成执行计划...')
        setMessages((prev) => [...prev, planLoadingMessage])

        try {
          // 构建执行计划请求
          const planRequest: PlanRequest = {
            incident_context: {
              incident_id: parsedResult.incident_id,
              problem_summary: parsedResult.problem_summary,
              affected_module: parsedResult.affected_module || '',
              error_code: parsedResult.error_code,
              urgency: parsedResult.urgency,
              entities: parsedResult.entities,
              raw_text: parsedResult.raw_text,
            },
            sop_response: {
              incident_id: enrichmentResult.incident_id,
              problem_summary: enrichmentResult.problem_summary,
              affected_module: enrichmentResult.affected_module,
              error_code: enrichmentResult.error_code,
              urgency: enrichmentResult.urgency,
              retrieved_sops: enrichmentResult.retrieved_sops,
            }
          }

          // 调用执行计划生成API
          const planResult = await fetchExecutionPlan(planRequest)

          if (planResult.success && planResult.plan.length > 0) {
            // 创建计划确认消息
            const planConfirmationMessage = createPlanConfirmationMessage(
              `📋 执行计划生成完成，共 ${planResult.plan.length} 个步骤，请确认后开始执行：`,
              {
                plan: planResult.plan,
                incident_context: {
                  incident_id: parsedResult.incident_id,
                  problem_summary: parsedResult.problem_summary,
                  affected_module: parsedResult.affected_module,
                  urgency: parsedResult.urgency,
                  entities: parsedResult.entities,
                  error_code: parsedResult.error_code,
                  raw_text: parsedResult.raw_text
                }
              }
            )

            // 移除加载消息并添加计划确认消息
            setMessages((prev) => [
              ...prev.filter((msg) => msg.id !== planLoadingMessage.id),
              planConfirmationMessage
            ])
          } else {
            // 计划生成失败
            const planErrorMessage = createAssistantMessage(
              `执行计划生成失败: ${planResult.message || '无法生成执行计划'}`,
              {} as IncidentReportResponse
            )
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === planLoadingMessage.id ? planErrorMessage : msg
              )
            )
          }

        } catch (planError: any) {
          console.error('执行计划生成失败:', planError)
          const planErrorMessage = createAssistantMessage(
            `执行计划生成失败: ${planError.message || 'Orchestrator 服务暂时不可用'}`,
            {} as IncidentReportResponse
          )

          // 更新计划加载消息为错误信息
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === planLoadingMessage.id ? planErrorMessage : msg
            )
          )
        }

      } catch (ragError: any) {
        console.error('RAG 增强失败:', ragError)
        const ragErrorMessage = createAssistantMessage(
          `知识库检索失败: ${ragError.message || 'RAG 服务暂时不可用'}`,
          parsedResult
        )

        // 更新RAG加载消息为错误信息
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === ragLoadingMessage.id ? ragErrorMessage : msg
          )
        )
      }

    } catch (parseError: any) {
      console.error('事件解析失败:', parseError)
      const errorMessage = createAssistantMessage(
        `解析失败: ${parseError.message || 'AI 解析服务暂时不可用，请稍后重试。'}`,
        {} as IncidentReportResponse // 空的结果对象
      )

      // 更新解析加载消息为错误信息
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parsingLoadingMessage.id ? errorMessage : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  // 处理批准请求
  const handleApprovalApprove = async (stateToken: string, approvedQuery: string) => {
    setIsProcessingApproval(true)
    try {
      const result = await approveSOPExecution({
        state_token: stateToken,
        approved_query: approvedQuery,
        approved: true
      })

      if (result.success && result.execution_result) {
        // 添加执行结果消息
        console.log('批准执行结果:', result.execution_result)
        console.log('completed_steps数量:', result.execution_result.completed_steps?.length)
        const executionMessage = createSOPExecutionMessage(
          `✅ 操作已批准并执行完成`,
          result.execution_result
        )
        setMessages(prev => [...prev, executionMessage])

        // 如果执行完成，可以继续下一步
        if (result.execution_result.status === 'completed') {
          const completionMessage = createAssistantMessage(
            '🎉 SOP 执行计划已全部完成！',
            {} as IncidentReportResponse
          )
          setMessages(prev => [...prev, completionMessage])
        }
      }
    } catch (error: any) {
      console.error('批准执行失败:', error)
      const errorMessage = createAssistantMessage(
        `❌ 批准执行失败: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsProcessingApproval(false)
  }

  const handleApprovalReject = async (stateToken: string) => {
    setIsProcessingApproval(true)
    try {
      const result = await approveSOPExecution({
        state_token: stateToken,
        approved_query: '',
        approved: false
      })

      const rejectionMessage = createAssistantMessage(
        '❌ 操作已被拒绝，SOP 执行已停止',
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, rejectionMessage])
    } catch (error: any) {
      console.error('拒绝执行失败:', error)
      const errorMessage = createAssistantMessage(
        `❌ 拒绝执行失败: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsProcessingApproval(false)
  }

  // 处理计划确认
  const handlePlanConfirm = async (plan: string[], incidentContext: Record<string, any>) => {
    setIsLoading(true)
    try {
      // 开始执行 SOP 计划
      const executionRequest = {
        plan: plan,
        incident_context: incidentContext
      }

      const result = await executeSOPPlan(executionRequest)
      
      // 添加执行结果消息
      const executionMessage = createSOPExecutionMessage(
        `🚀 开始执行 SOP 计划，共 ${plan.length} 个步骤`,
        result
      )
      setMessages(prev => [...prev, executionMessage])

      // 如果执行状态是 needs_approval，显示批准请求
      if (result.status === 'needs_approval' && result.state_token) {
        // 解析 tool_output 中的 SQL 查询
        let sqlQuery = '';
        try {
          if (result.tool_output) {
            const toolOutput = JSON.parse(result.tool_output);
            if (toolOutput && toolOutput.query) {
              sqlQuery = toolOutput.query;
            } else {
              sqlQuery = result.tool_output; // 如果不是JSON格式，直接使用
            }
          }
        } catch (e) {
          // 如果解析失败，直接使用原始输出
          sqlQuery = result.tool_output || '';
        }

        const approvalMessage = createApprovalRequestMessage(
          `⚠️ 检测到高危操作，需要人工批准`,
          {
            state_token: result.state_token,
            query: sqlQuery,
            step_description: result.step_description
          }
        )
        setMessages(prev => [...prev, approvalMessage])
      }
    } catch (error: any) {
      console.error('执行 SOP 计划失败:', error)
      const errorMessage = createAssistantMessage(
        `❌ 执行 SOP 计划失败: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsLoading(false)
  }

  // 检查数据库状态
  const checkDatabaseStatus = async () => {
    try {
      const status = await getDatabaseStatus()
      setDatabaseStatus(status)
    } catch (error) {
      setDatabaseStatus({ success: false, message: '数据库未连接' })
    }
  }

  // 处理数据库连接成功
  const handleDatabaseConnectionSuccess = () => {
    checkDatabaseStatus()
    // 不显示成功消息，静默更新状态
  }

  // 组件挂载时检查数据库状态
  React.useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <Container maxW="container.xl" py={4} height="100vh" display="flex" flexDirection="column">
      <VStack spacing={4} align="stretch" flex={1}>
        {/* 页面标题 */}
        <MotionBox
          textAlign="center"
          pt={4}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VStack spacing={3} mb={4}>
            <Heading as="h1" size="xl" color="gray.700">
              PortSentinel AI 智能助手
            </Heading>
            <HStack spacing={2}>
              <Badge 
                colorScheme={databaseStatus?.success ? 'green' : 'red'} 
                variant="solid"
                fontSize="xs"
              >
                {databaseStatus?.success ? '数据库已连接' : '数据库未连接'}
              </Badge>
              <Button
                size="sm"
                colorScheme={databaseStatus?.success ? 'green' : 'orange'}
                variant="outline"
                onClick={() => setIsDatabaseModalOpen(true)}
              >
                🗄️ 数据库设置
              </Button>
            </HStack>
          </VStack>
        </MotionBox>

        {/* 聊天窗口 */}
        <ChatWindow 
          messages={messages} 
          onApprovalApprove={handleApprovalApprove}
          onApprovalReject={handleApprovalReject}
          onPlanConfirm={handlePlanConfirm}
        />
      </VStack>

      {/* 聊天输入栏 */}
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} disabled={isLoading} />

      {/* 数据库连接模态框 */}
      <DatabaseConnectionModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onConnectionSuccess={handleDatabaseConnectionSuccess}
      />
    </Container>
  )
}