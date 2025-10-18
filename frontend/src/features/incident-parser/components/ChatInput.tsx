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
 * 聊天输入组件 - 固定在页面底部的输入栏
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

  // 自动调整文本域高度
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
        title: '输入为空',
        description: '请输入事件报告内容',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      })
      return
    }

    onSubmit(text.trim(), sourceType)
    setText('') // 清空输入
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
        {/* 来源类型选择器 */}
        <HStack width="100%" justify="flex-end">
          <Text fontSize="sm" color="gray.500">
            来源类型:
          </Text>
          <Select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as 'Email' | 'SMS' | 'Call')}
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
        <Flex gap={3} align="end" width="100%">
          <Box flex={1}>
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入事件报告内容... (按 Enter 发送，Shift+Enter 换行)"
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
            aria-label="发送消息"
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

        {/* 提示文本 */}
        <Text fontSize="xs" color="gray.500" textAlign="center">
          支持多行文本输入，AI 将智能解析事件报告并提取关键信息
        </Text>
      </VStack>
    </MotionBox>
  )
}