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
  incidentId?: string;
}

/**
 * 聊天窗口组件 - 固定高度，可滚动，自动滚动到底部
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onApprovalApprove, 
  onApprovalReject,
  onPlanConfirm,
  incidentId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const previousMessageCount = useRef(0)
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 当有新消息时自动滚动到底部
  useEffect(() => {
    // 只有在消息数量增加时才滚动（新消息）
    if (messages.length > previousMessageCount.current && messages.length > 0) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      
      // 更新消息计数
      previousMessageCount.current = messages.length
      
      return () => clearTimeout(timer)
    } else {
      // 更新消息计数（即使不滚动）
      previousMessageCount.current = messages.length
    }
  }, [messages])

  return (
    <Box
      ref={scrollContainerRef}
      flex={1}
      bg={bgColor}
      display="flex"
      flexDirection="column"
      minH={0}
      p={4}
    >
      <VStack spacing={4} align="stretch" pb={4}>
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
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  欢迎使用 PortSentinel AI 智能助手
                </Text>
                <Text fontSize="sm" maxW="md">
                  请在下方输入框中输入事件报告内容，AI 将为您智能解析并检索相关建议。
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
              incidentId={incidentId}
            />
          </MotionBox>
        ))}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  )
}
