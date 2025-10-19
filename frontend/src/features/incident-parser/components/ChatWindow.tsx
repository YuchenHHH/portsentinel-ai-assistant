import React, { useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  Text,
  Center,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { ChatMessage } from '../../../types/chat'

const MotionBox = motion(Box)

interface ChatWindowProps {
  messages: ChatMessage[];
  onApprovalApprove?: (stateToken: string, approvedQuery: string) => Promise<void>;
  onApprovalReject?: (stateToken: string) => Promise<void>;
  onPlanConfirm?: (plan: string[], incidentContext: Record<string, any>) => Promise<void>;
}

/**
 * 聊天窗口组件 - 可滚动的消息容器
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onApprovalApprove, 
  onApprovalReject,
  onPlanConfirm
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      flex={1}
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      overflowY="auto"
      display="flex"
      flexDirection="column"
      minH={0}
      p={4}
    >
      <VStack spacing={0} align="stretch" pb={40}>
        {/* 欢迎消息 */}
        {messages.length === 0 && (
          <Center flex={1} minH="200px">
            <MotionBox
              textAlign="center"
              color="gray.500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VStack spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">
                  欢迎使用 PortSentinel AI 智能助手
                </Text>
                <Text fontSize="md" maxW="md">
                  请在下方输入框中粘贴或输入事件报告内容，AI 将为您智能解析事件并检索相关的 SOP 建议。
                </Text>
              </VStack>
            </MotionBox>
          </Center>
        )}

        {/* 消息列表 */}
        {messages.map((message, index) => (
          <MotionBox
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
          >
            <MessageBubble 
              message={message}
              onApprovalApprove={onApprovalApprove}
              onApprovalReject={onApprovalReject}
              onPlanConfirm={onPlanConfirm}
            />
          </MotionBox>
        ))}

        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  )
}
