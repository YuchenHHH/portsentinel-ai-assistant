import React from 'react'
import {
  Box,
  Flex,
  Text,
  Badge,
  VStack,
  HStack,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { TypingIndicator } from './TypingIndicator'
import { ResultDisplay } from './ResultDisplay'
import { IncidentReportResponse } from '../../../types/api'

const MotionBox = motion(Box)

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string | IncidentReportResponse
  timestamp: string
  isLoading?: boolean
  sourceType?: 'Email' | 'SMS' | 'Call'
}

interface MessageBubbleProps {
  message: Message
}

/**
 * 消息气泡组件 - 显示单条消息，支持动画效果
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const userBgColor = useColorModeValue('blue.50', 'blue.900')
  const assistantBgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 动画配置
  const animationVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  if (message.role === 'user') {
    return (
      <Flex justify="flex-end" mb={4}>
        <MotionBox
          maxW="70%"
          bg={userBgColor}
          p={4}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          variants={animationVariants}
          initial="initial"
          animate="animate"
        >
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between" align="start">
              <Badge colorScheme="blue" variant="subtle">
                {message.sourceType}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {formatTime(message.timestamp)}
              </Text>
            </HStack>
            <Text whiteSpace="pre-wrap">{message.content as string}</Text>
          </VStack>
        </MotionBox>
      </Flex>
    )
  }

  if (message.role === 'assistant') {
    return (
      <Flex justify="flex-start" mb={4}>
        <MotionBox
          maxW="90%"
          w="full"
          variants={animationVariants}
          initial="initial"
          animate="animate"
        >
          <VStack align="stretch" spacing={3}>
            {/* 助手消息头部 */}
            <HStack>
              <Avatar size="sm" name="AI Assistant" bg="blue.500" />
              <Text fontWeight="medium" color="blue.600">
                AI 助手
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatTime(message.timestamp)}
              </Text>
            </HStack>

            {/* 消息内容 */}
            <Box
              bg={assistantBgColor}
              p={4}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              {message.isLoading ? (
                <HStack spacing={3}>
                  <Text fontSize="sm" color="gray.600">
                    正在解析中
                  </Text>
                  <TypingIndicator />
                </HStack>
              ) : typeof message.content === 'string' ? (
                // 错误消息显示
                <Box>
                  <Text fontSize="sm" color="red.600" fontWeight="medium">
                    ❌ 解析失败
                  </Text>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    {message.content}
                  </Text>
                </Box>
              ) : (
                // 正常解析结果显示
                <ResultDisplay result={message.content as IncidentReportResponse} />
              )}
            </Box>
          </VStack>
        </MotionBox>
      </Flex>
    )
  }

  return null
}