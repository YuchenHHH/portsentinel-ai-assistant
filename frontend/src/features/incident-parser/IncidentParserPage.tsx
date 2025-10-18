import React, { useState, useCallback } from 'react'
import {
  Box,
  Container,
  Heading,
  Flex,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { ChatContainer } from './components/ChatContainer'
import { ChatInput } from './components/ChatInput'
import { parseIncidentReport } from '../../services/api'
import { 
  ChatState, 
  ChatMessage, 
  createUserMessage, 
  createAssistantMessage, 
  createSystemMessage 
} from '../../types/chat'

export const IncidentParserPage: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  })

  const toast = useToast()
  const headerBgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // 添加消息到聊天历史
  const addMessage = useCallback((message: ChatMessage) => {
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      error: null
    }))
  }, [])

  // 处理用户输入
  const handleUserInput = useCallback(async (text: string, sourceType: 'Email' | 'SMS' | 'Call') => {
    // 创建用户消息
    const userMessage = createUserMessage(text, sourceType)
    addMessage(userMessage)

    // 设置加载状态
    setChatState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      // 调用 API 解析
      const incidentReport = await parseIncidentReport({
        source_type: sourceType,
        raw_text: text
      })

      // 生成助手回复内容
      const assistantContent = generateAssistantResponse(incidentReport)

      // 创建助手消息
      const assistantMessage = createAssistantMessage(assistantContent, incidentReport)
      addMessage(assistantMessage)

    } catch (error: any) {
      console.error('解析失败:', error)
      
      // 创建错误消息
      const errorMessage = createSystemMessage(
        `解析失败: ${error.message || '请检查网络连接或稍后重试'}`
      )
      addMessage(errorMessage)

      toast({
        title: '解析失败',
        description: error.message || '请检查网络连接或稍后重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      // 清除加载状态
      setChatState(prev => ({
        ...prev,
        isLoading: false
      }))
    }
  }, [addMessage, toast])

  // 生成助手回复内容
  const generateAssistantResponse = (report: any): string => {
    const urgency = report.urgency
    const module = report.affected_module
    const entities = report.entities
    const errorCode = report.error_code

    let response = `我已经分析了您的事件报告。`

    if (urgency === 'High') {
      response += `\n\n🚨 这是一个高优先级事件，需要立即处理。`
    } else if (urgency === 'Medium') {
      response += `\n\n⚠️ 这是一个中等优先级事件。`
    } else {
      response += `\n\nℹ️ 这是一个低优先级事件。`
    }

    if (module) {
      response += `\n\n📋 受影响模块: ${module}`
    }

    if (entities && entities.length > 0) {
      response += `\n\n🔍 我提取到了以下关键信息:`
      entities.forEach((entity: any) => {
        response += `\n• ${entity.type}: ${entity.value}`
      })
    }

    if (errorCode) {
      response += `\n\n❌ 错误代码: ${errorCode}`
    }

    response += `\n\n📝 问题摘要: ${report.problem_summary}`

    if (report.potential_cause_hint) {
      response += `\n\n💡 潜在原因: ${report.potential_cause_hint}`
    }

    response += `\n\n请查看下方的详细解析结果。`

    return response
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      {/* 页面头部 */}
      <Box
        bg={headerBgColor}
        borderBottom="1px"
        borderColor={borderColor}
        py={4}
        px={6}
        flexShrink={0}
      >
        <Container maxW="4xl">
          <Flex align="center" justify="space-between">
            <Box>
              <Heading as="h1" size="lg" color="gray.700" mb={1}>
                PortSentinel AI 事件解析器
              </Heading>
              <Box
                as="p"
                color="gray.600"
                fontSize="sm"
              >
                智能对话式事件报告解析，自动提取关键信息
              </Box>
            </Box>
            <Box textAlign="right">
              <Box
                as="p"
                color="gray.500"
                fontSize="xs"
              >
                消息数量: {chatState.messages.length}
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* 聊天容器 */}
      <Box flex={1} display="flex" flexDirection="column" minH={0}>
        <ChatContainer chatState={chatState} />
      </Box>

      {/* 聊天输入栏 */}
      <ChatInput
        onSubmit={handleUserInput}
        isLoading={chatState.isLoading}
        disabled={false}
      />
    </Box>
  )
}