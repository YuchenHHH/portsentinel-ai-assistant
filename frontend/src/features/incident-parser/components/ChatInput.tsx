import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Flex,
  Input,
  Select,
  Button,
  IconButton,
  useToast,
  useColorModeValue,
  Text,
  HStack,
  VStack,
} from '@chakra-ui/react'
import { AddIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import { ChatInputState } from '../../../types/chat'

interface ChatInputProps {
  onSubmit: (text: string, sourceType: 'Email' | 'SMS' | 'Call') => void
  isLoading: boolean
  disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isLoading,
  disabled = false
}) => {
  const [state, setState] = useState<ChatInputState>({
    text: '',
    sourceType: 'Email',
    isSubmitting: false
  })

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()

  // 颜色主题
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300')

  // 自动聚焦
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!state.text.trim()) {
      toast({
        title: '请输入内容',
        description: '请先输入事件报告内容',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (state.isSubmitting || isLoading) {
      return
    }

    setState(prev => ({ ...prev, isSubmitting: true }))

    try {
      await onSubmit(state.text.trim(), state.sourceType)
      setState(prev => ({ ...prev, text: '', isSubmitting: false }))
    } catch (error) {
      setState(prev => ({ ...prev, isSubmitting: false }))
      toast({
        title: '发送失败',
        description: '消息发送失败，请重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isDisabled = disabled || isLoading || state.isSubmitting || !state.text.trim()

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      p={4}
      zIndex={10}
      boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
    >
      <Box maxW="4xl" mx="auto">
        <form onSubmit={handleSubmit}>
          <VStack spacing={3} align="stretch">
            {/* 来源类型选择 */}
            <HStack spacing={3} justify="space-between">
              <Text fontSize="sm" color="gray.600" minW="fit-content">
                来源类型:
              </Text>
              <Select
                value={state.sourceType}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  sourceType: e.target.value as 'Email' | 'SMS' | 'Call' 
                }))}
                size="sm"
                maxW="120px"
                disabled={isDisabled}
              >
                <option value="Email">邮件</option>
                <option value="SMS">短信</option>
                <option value="Call">电话</option>
              </Select>
            </HStack>

            {/* 输入区域 */}
            <Flex gap={3} align="end">
              <Box flex={1}>
                <Input
                  ref={inputRef}
                  as="textarea"
                  value={state.text}
                  onChange={(e) => setState(prev => ({ ...prev, text: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder="请输入事件报告内容... (按 Enter 发送，Shift+Enter 换行)"
                  rows={2}
                  resize="none"
                  disabled={isDisabled}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: focusBorderColor,
                    boxShadow: `0 0 0 1px ${focusBorderColor}`,
                  }}
                  _disabled={{
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                />
              </Box>
              
              <IconButton
                type="submit"
                aria-label="发送消息"
                icon={<ArrowForwardIcon />}
                colorScheme="blue"
                size="md"
                isLoading={state.isSubmitting || isLoading}
                loadingText="发送中"
                isDisabled={isDisabled}
                _disabled={{
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
              />
            </Flex>

            {/* 提示文本 */}
            <Text fontSize="xs" color="gray.500" textAlign="center">
              支持多行文本输入，AI 将智能解析事件报告并提取关键信息
            </Text>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}
