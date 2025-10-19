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
import SOPExecutionDisplay from './SOPExecutionDisplay'
import ApprovalRequest from './ApprovalRequest'
import PlanConfirmation from './PlanConfirmation'
import { 
  ChatMessage, 
  isUserMessage, 
  isAssistantMessage, 
  isEnrichmentMessage, 
  isLoadingMessage,
  isSOPExecutionMessage,
  isApprovalRequestMessage,
  isPlanConfirmationMessage,
  isSystemMessage 
} from '../../../types/chat'

const MotionBox = motion(Box)

interface MessageBubbleProps {
  message: ChatMessage;
  onApprovalApprove?: (stateToken: string, approvedQuery: string) => Promise<void>;
  onApprovalReject?: (stateToken: string) => Promise<void>;
  onPlanConfirm?: (plan: string[], incidentContext: Record<string, any>) => Promise<void>;
}

/**
 * 消息气泡组件 - 显示单条消息，支持动画效果
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onApprovalApprove, 
  onApprovalReject,
  onPlanConfirm
}) => {
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
              ) : isSOPExecutionMessage(message) ? (
                // SOP 执行结果显示
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <SOPExecutionDisplay executionData={message.executionData} />
                </VStack>
              ) : isApprovalRequestMessage(message) ? (
                // 批准请求显示
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <ApprovalRequest
                    stateToken={message.approvalData.state_token}
                    query={message.approvalData.query}
                    stepDescription={message.approvalData.step_description}
                    onApprove={onApprovalApprove || (async () => {})}
                    onReject={onApprovalReject || (async () => {})}
                  />
                </VStack>
              ) : isPlanConfirmationMessage(message) ? (
                // 计划确认显示
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <PlanConfirmation
                    plan={message.planData.plan}
                    incidentContext={message.planData.incident_context}
                    onConfirm={onPlanConfirm || (async () => {})}
                  />
                </VStack>
              ) : isAssistantMessage(message) ? (
                // 普通助手消息（解析结果、错误或执行计划步骤）
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  {/* 执行计划步骤显示 - 多个步骤在同一个对话框中 */}
                  {message.incidentReport && (message.incidentReport as any).plan_steps ? (
                    <Box
                      bg="blue.50"
                      p={4}
                      borderRadius="lg"
                      border="1px"
                      borderColor="blue.200"
                      boxShadow="sm"
                    >
                      <VStack align="stretch" spacing={4}>
                        
                        {/* 显示所有执行步骤 */}
                        <VStack align="stretch" spacing={3}>
                          {(message.incidentReport as any).plan_steps.map((step: string, index: number) => (
                            <Box
                              key={index}
                              bg="white"
                              p={3}
                              borderRadius="md"
                              border="1px"
                              borderColor="blue.100"
                              boxShadow="xs"
                            >
                              <HStack align="start" spacing={3}>
                                <Box
                                  bg="blue.400"
                                  color="white"
                                  borderRadius="full"
                                  w={5}
                                  h={5}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  flexShrink={0}
                                  mt={0.5}
                                >
                                  {index + 1}
                                </Box>
                                <Text fontSize="sm" color="blue.800" lineHeight="1.5">
                                  {step}
                                </Text>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </VStack>
                    </Box>
                  ) : (
                    // 普通解析结果显示
                    message.incidentReport && (
                      <ResultDisplay result={message.incidentReport} />
                    )
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