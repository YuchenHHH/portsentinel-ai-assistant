import React, { useState } from 'react'
import { Box, Container, Heading, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import { parseIncidentReport, enrichIncident, fetchExecutionPlan } from '../../services/api'
import { IncidentReportResponse, EnrichmentRequest, PlanRequest, ParsedIncident, SOPResponse } from '../../types/api'
import { 
  createUserMessage, 
  createAssistantMessage, 
  createEnrichmentMessage, 
  createLoadingMessage,
  ChatMessage 
} from '../../types/chat'

const MotionBox = motion(Box)

export const IncidentParserPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
              incident_id: parsedResult.incident_id || '',
              problem_summary: parsedResult.problem_summary,
              affected_module: parsedResult.affected_module || '',
              error_code: parsedResult.error_code,
              urgency: parsedResult.urgency,
              entities: parsedResult.entities.reduce((acc, entity) => {
                acc[entity.type] = entity.value
                return acc
              }, {} as Record<string, any>),
              raw_text: parsedResult.raw_text,
            },
            sop_response: {
              title: enrichmentResult.retrieved_sops[0]?.metadata.sop_title || 'Unknown SOP',
              module: enrichmentResult.retrieved_sops[0]?.metadata.module || 'Unknown Module',
              resolution: enrichmentResult.retrieved_sops[0]?.metadata.complete_sop?.Resolution || 'No resolution available',
              overview: enrichmentResult.retrieved_sops[0]?.metadata.complete_sop?.Overview || null,
              preconditions: enrichmentResult.retrieved_sops[0]?.metadata.complete_sop?.Preconditions || null,
              verification: enrichmentResult.retrieved_sops[0]?.metadata.complete_sop?.Verification || null,
              sop_snippets: enrichmentResult.retrieved_sops,
            }
          }

          // 调用执行计划生成API
          const planResult = await fetchExecutionPlan(planRequest)

          if (planResult.success && planResult.plan.length > 0) {
            // 将执行计划步骤转换为聊天消息
            const planMessages: ChatMessage[] = planResult.plan.map((step, index) => 
              createAssistantMessage(
                `📋 执行步骤 ${index + 1}/${planResult.plan.length}`,
                { plan_step: step, step_number: index + 1, total_steps: planResult.plan.length } as any
              )
            )

            // 移除加载消息并添加执行计划消息
            setMessages((prev) => [
              ...prev.filter((msg) => msg.id !== planLoadingMessage.id),
              ...planMessages
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
          <Heading as="h1" size="xl" color="gray.700" mb={2}>
            PortSentinel AI 智能助手
          </Heading>
          <Box
            as="p"
            color="gray.600"
            fontSize="lg"
            maxW="2xl"
            mx="auto"
          >
            使用 AI 技术智能解析事件报告，自动提取关键信息并检索相关 SOP 建议
          </Box>
        </MotionBox>

        {/* 聊天窗口 */}
        <ChatWindow messages={messages} />
      </VStack>

      {/* 聊天输入栏 */}
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} disabled={isLoading} />
    </Container>
  )
}