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
import { HistoryMatchDisplay } from './HistoryMatchDisplay'
import SOPExecutionDisplay from './SOPExecutionDisplay'
import ApprovalRequest from './ApprovalRequest'
import ContinueExecution from './ContinueExecution'
import NextStepConfirm from './NextStepConfirm'
import SummaryGeneration from './SummaryGeneration'
import PlanConfirmation from './PlanConfirmation'
import { 
  ChatMessage, 
  isUserMessage, 
  isAssistantMessage, 
  isEnrichmentMessage, 
  isHistoryMatchMessage,
  isLoadingMessage,
  isSOPExecutionMessage,
  isApprovalRequestMessage,
  isContinueExecutionMessage,
  isNextStepConfirmMessage,
  isSummaryGenerationMessage,
  isPlanConfirmationMessage,
  isSystemMessage 
} from '../../../types/chat'

const MotionBox = motion(Box)

interface MessageBubbleProps {
  message: ChatMessage;
  onApprovalApprove?: (stateToken: string, approvedQuery: string) => Promise<void>;
  onApprovalReject?: (stateToken: string) => Promise<void>;
  onPlanConfirm?: (plan: string[], incidentContext: Record<string, any>) => Promise<void>;
  onContinueExecution?: (stateToken: string) => Promise<void>;
  onNextStepConfirm?: (parsedResult: any) => Promise<void>;
  onGenerateSummary?: () => Promise<void>;
  incidentId?: string;
}

/**
 * Message bubble component - displays single message with animation effects
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onApprovalApprove, 
  onApprovalReject,
  onPlanConfirm,
  onContinueExecution,
  onNextStepConfirm,
  onGenerateSummary,
  incidentId
}) => {
  const userBgColor = useColorModeValue('blue.50', 'blue.900')
  const assistantBgColor = useColorModeValue('gray.50', 'gray.700')
  const systemBgColor = useColorModeValue('yellow.50', 'yellow.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const systemBorderColor = useColorModeValue('yellow.200', 'yellow.700')

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
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
              System Message:
            </Text>
            <Text fontSize="xs" color="yellow.600">
              {message.content}
            </Text>
          </HStack>
        </MotionBox>
      </Flex>
    )
  }

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
            <HStack>
              <Avatar size="sm" name="AI Assistant" bg="blue.500" />
              <Text fontWeight="medium" color="blue.600">
                AI Assistant
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatTime(message.timestamp)}
              </Text>
            </HStack>
            <Box
              bg={assistantBgColor}
              p={4}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              {isLoadingMessage(message) ? (
                <HStack spacing={3}>
                  <Text fontSize="sm" color="gray.600">
                    {message.content}
                  </Text>
                  <TypingIndicator />
                </HStack>
              ) : isEnrichmentMessage(message) ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <EnrichmentDisplay enrichmentData={message.enrichmentData} />
                </VStack>
              ) : isHistoryMatchMessage(message) ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <HistoryMatchDisplay historyData={message.historyData} />
                </VStack>
              ) : isSOPExecutionMessage(message) ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <SOPExecutionDisplay 
                    executionData={message.executionData} 
                    incidentId={incidentId}
                    onContinue={onContinueExecution}
                  />
                </VStack>
              ) : isApprovalRequestMessage(message) ? (
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
              ) : isContinueExecutionMessage(message) ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <ContinueExecution
                    stateToken={message.continueData.state_token}
                    stepDescription={message.continueData.step_description}
                    toolOutput={message.continueData.tool_output}
                    onContinue={onContinueExecution || (async () => {})}
                  />
                </VStack>
              ) : isNextStepConfirmMessage(message) ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <NextStepConfirm
                    stepName={message.nextStepData.step_name}
                    stepDescription={message.nextStepData.step_description}
                    parsedResult={message.nextStepData.parsed_result}
                    onConfirm={() => onNextStepConfirm?.(message.nextStepData.parsed_result) || Promise.resolve()}
                  />
                </VStack>
              ) : isSummaryGenerationMessage(message) ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
                  <SummaryGeneration
                    incidentId={message.summaryData.incident_id}
                    completedStepsCount={message.summaryData.completed_steps_count}
                    executionStatus={message.summaryData.execution_status}
                    onGenerateSummary={onGenerateSummary || (async () => {})}
                  />
                </VStack>
              ) : isPlanConfirmationMessage(message) ? (
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
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {message.content}
                  </Text>
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
                    message.incidentReport && (
                      <ResultDisplay result={message.incidentReport} />
                    )
                  )}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.600">
                  Unknown message type
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