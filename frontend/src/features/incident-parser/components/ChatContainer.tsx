import React, { useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  useColorModeValue,
  Text,
  Center,
} from '@chakra-ui/react'
import { LoadingMessage, ErrorMessage } from './MessageBubble'
import { ChatMessage } from '../../../types/chat'
import { ChatState } from '../../../types/chat'

interface ChatContainerProps {
  chatState: ChatState
  onRetry?: () => void
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  chatState,
  onRetry
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages, chatState.isLoading])

  // 空状态
  if (chatState.messages.length === 0 && !chatState.isLoading) {
    return (
      <Box
        flex={1}
        bg={bgColor}
        p={8}
        overflowY="auto"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Center>
          <VStack spacing={4} textAlign="center">
            <Text fontSize="2xl" color="gray.500">
              🤖
            </Text>
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="medium" color="gray.700">
                欢迎使用 PortSentinel AI 事件解析器
              </Text>
              <Text fontSize="sm" color="gray.500" maxW="md">
                请在下方输入事件报告内容，AI 将智能解析并提取关键信息。
                支持邮件、短信、电话等多种来源类型。
              </Text>
            </VStack>
            <VStack spacing={1} fontSize="xs" color="gray.400">
              <Text>💡 提示：可以输入包含容器号、错误代码等信息的文本</Text>
              <Text>📋 支持多行文本输入，按 Enter 发送</Text>
            </VStack>
          </VStack>
        </Center>
      </Box>
    )
  }

  return (
    <Box
      flex={1}
      bg={bgColor}
      p={4}
      overflowY="auto"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={0} align="stretch" pb={4}>
        {/* 消息列表 */}
        {chatState.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* 加载状态 */}
        {chatState.isLoading && <LoadingMessage />}

        {/* 错误状态 */}
        {chatState.error && (
          <ErrorMessage error={chatState.error} />
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  )
}
