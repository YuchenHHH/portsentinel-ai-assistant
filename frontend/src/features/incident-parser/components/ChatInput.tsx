import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Flex,
  Textarea,
  IconButton,
  Select,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { ArrowForwardIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

interface ChatInputProps {
  onSubmit: (text: string, sourceType: 'Email' | 'SMS' | 'Call') => void
  isLoading: boolean
  disabled?: boolean
}

/**
 * Chat Input Component - Fixed input bar at the bottom of the page
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isLoading,
  disabled = false,
}) => {
  const [text, setText] = useState('')
  const [sourceType, setSourceType] = useState<'Email' | 'SMS' | 'Call'>('Email')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300')

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      toast({
        title: 'Empty Input',
        description: 'Please enter incident report content',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      })
      return
    }

    onSubmit(text.trim(), sourceType)
    setText('') // Clear input
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isDisabled = disabled || isLoading

  return (
    <MotionBox
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      boxShadow="lg"
      zIndex={1000}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <VStack spacing={3} p={4} maxW="container.xl" mx="auto">
        {/* Source Type Selector */}
        <HStack width="100%" justify="flex-end">
          <Text fontSize="sm" color="gray.500">
            Source Type:
          </Text>
          <Select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as 'Email' | 'SMS' | 'Call')}
            size="sm"
            maxW="120px"
            disabled={isDisabled}
          >
            <option value="Email">Email</option>
            <option value="SMS">SMS</option>
            <option value="Call">Call</option>
          </Select>
        </HStack>

        {/* Input Area */}
        <Flex gap={3} align="end" width="100%">
          <Box flex={1}>
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter incident report content... (Press Enter to send, Shift+Enter for new line)"
              minH="40px"
              maxH="120px"
              resize="none"
              disabled={isDisabled}
              borderColor={borderColor}
              _focus={{
                borderColor: focusBorderColor,
                boxShadow: `0 0 0 1px ${focusBorderColor}`,
              }}
              _disabled={{
                opacity: 0.6,
                cursor: 'not-allowed',
              }}
            />
          </Box>

          <IconButton
            type="submit"
            aria-label="Send message"
            icon={<ArrowForwardIcon />}
            colorScheme="blue"
            size="md"
            isLoading={isLoading}
            isDisabled={isDisabled || !text.trim()}
            onClick={handleSubmit}
            _disabled={{
              opacity: 0.6,
              cursor: 'not-allowed',
            }}
          />
        </Flex>

        {/* Hint Text */}
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Supports multi-line text input, AI will intelligently parse incident reports and extract key information
        </Text>
      </VStack>
    </MotionBox>
  )
}