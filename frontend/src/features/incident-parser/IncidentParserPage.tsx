import React, { useState } from 'react'
import { Box, Container, Heading, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import { Message } from './components/MessageBubble'
import { parseIncidentReport } from '../../services/api'
import { IncidentReportResponse } from '../../types/api'

const MotionBox = motion(Box)

export const IncidentParserPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (text: string, sourceType: 'Email' | 'SMS' | 'Call') => {
    setIsLoading(true)

    // 创建用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      sourceType,
    }

    // 创建加载中的助手消息
    const loadingMessage: Message = {
      id: `assistant-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    }

    // 添加消息到状态
    setMessages((prev) => [...prev, userMessage, loadingMessage])

    try {
      // 调用API解析
      const parsedResult: IncidentReportResponse = await parseIncidentReport({
        source_type: sourceType,
        raw_text: text,
      })

      // 更新加载中的消息为真实结果
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: parsedResult,
                isLoading: false,
              }
            : msg
        )
      )
    } catch (err: any) {
      console.error('API 调用失败:', err)
      const errorMessage = err.message || 'AI 解析服务暂时不可用，请稍后重试。'
      
      // 更新加载中的消息为错误信息
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: errorMessage,
                isLoading: false,
              }
            : msg
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
            PortSentinel AI 事件解析器
          </Heading>
          <Box
            as="p"
            color="gray.600"
            fontSize="lg"
            maxW="2xl"
            mx="auto"
          >
            使用 AI 技术智能解析事件报告，自动提取关键信息并生成结构化数据
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