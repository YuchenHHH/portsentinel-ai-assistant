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
import { EnrichmentDisplay } from './EnrichmentDisplay'
import { 
  ChatMessage, 
  isUserMessage, 
  isAssistantMessage, 
  isEnrichmentMessage, 
  isLoadingMessage,
  isSystemMessage 
} from '../../../types/chat'

const MotionBox = motion(Box)

interface MessageBubbleProps {
  message: ChatMessage
}

/**
 * 消息气泡组件 - 显示单条消息，支持动画效果
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const userBgColor = useColorModeValue('blue.50', 'blue.900')
  const assistantBgColor = useColorModeValue('gray.50', 'gray.700')
  const systemBgColor = useColorModeValue('yellow.50', 'yellow.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const systemBorderColor = useColorModeValue('yellow.200', 'yellow.700')

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('zh-CN', {
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

  // 用户消息
  if (isUserMessage(message)) {
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
            <Text whiteSpace="pre-wrap">{message.content}</Text>
          </VStack>
        </MotionBox>
      </Flex>
    )
  }

  // 系统消息
  if (isSystemMessage(message)) {
    return (
      <Flex justify="center" mb={4}>
        <MotionBox
          bg={systemBgColor}
          p={3}
          borderRadius="lg"
          border="1px"
          borderColor={systemBorderColor}
          variants={animationVariants}
          initial="initial"
          animate="animate"
        >
          <HStack>
            <Text fontSize="sm" color="yellow.700">
              系统消息:
            </Text>
            <Text fontSize="xs" color="yellow.600">
              {message.content}
            </Text>
          </HStack>
        </MotionBox>
      </Flex>
    )
  }

  // 助手消息（包括解析结果、RAG增强、加载状态）
  if (message.type === 'assistant') {
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
              {/* 加载状态 */}
              {isLoadingMessage(message) ? (
                <HStack spacing={3}>
                  <Text fontSize="sm" color="gray.600">
                    {message.content}
                  </Text>
                  <TypingIndicator />
                </HStack>
              ) : isEnrichmentMessage(message) ? (
                // RAG 增强结果显示
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <EnrichmentDisplay enrichmentData={message.enrichmentData} />
                </VStack>
              ) : isAssistantMessage(message) ? (
                // 普通助手消息（解析结果、错误或执行计划步骤）
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  {message.incidentReport && (
                    <ResultDisplay result={message.incidentReport} />
                  )}
                  {/* 执行计划步骤显示 */}
                  {message.incidentReport && (message.incidentReport as any).plan_step && (
                    <Box
                      bg="blue.50"
                      p={3}
                      borderRadius="md"
                      borderLeft="4px"
                      borderLeftColor="blue.400"
                    >
                      <Text fontSize="sm" color="blue.800" fontWeight="medium">
                        {(message.incidentReport as any).plan_step}
                      </Text>
                    </Box>
                  )}
                </VStack>
              ) : (
                // 默认文本消息
                <Text fontSize="sm" color="gray.600">
                  未知消息类型
                </Text>
              )}
            </Box>
          </VStack>
        </MotionBox>
      </Flex>
    )
  }

  return null
}