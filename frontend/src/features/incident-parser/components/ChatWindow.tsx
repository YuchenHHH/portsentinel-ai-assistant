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
  onContinueExecution?: (stateToken: string) => Promise<void>;
  onNextStepConfirm?: (parsedResult: any) => Promise<void>;
  onGenerateSummary?: () => Promise<void>;
  incidentId?: string;
}

/**
 * Chat window component - fixed height, scrollable, auto-scroll to bottom
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onApprovalApprove, 
  onApprovalReject,
  onPlanConfirm,
  onContinueExecution,
  onNextStepConfirm,
  onGenerateSummary,
  incidentId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const previousMessageCount = useRef(0)
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (messages.length > previousMessageCount.current && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      
      previousMessageCount.current = messages.length
      
      return () => clearTimeout(timer)
    } else {
      previousMessageCount.current = messages.length
    }
  }, [messages])

  return (
    <Box
      ref={scrollContainerRef}
      flex={1}
      w="100%"
      bg={bgColor}
      overflowY="auto"
      overflowX="hidden"
      p={4}
      sx={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'gray.300',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'gray.400',
        },
      }}
    >
      <VStack spacing={4} align="stretch" pb={4}>
        {messages.length === 0 && (
          <Center minH="200px">
            <MotionBox
              textAlign="center"
              color="gray.500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  Welcome to PortSentinel AI Assistant
                </Text>
                <Text fontSize="sm" maxW="md">
                  Enter incident report content in the input box below, and AI will intelligently parse and retrieve relevant recommendations.
                </Text>
              </VStack>
            </MotionBox>
          </Center>
        )}
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
              onContinueExecution={onContinueExecution}
              onNextStepConfirm={onNextStepConfirm}
              onGenerateSummary={onGenerateSummary}
              incidentId={incidentId}
            />
          </MotionBox>
        ))}

        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  )
}