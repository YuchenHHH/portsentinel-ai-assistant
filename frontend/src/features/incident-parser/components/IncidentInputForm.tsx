import React, { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { parseIncidentReport } from '../../../services/api'
import { ParseRequestData, IncidentReportResponse } from '../../../types/api'

interface IncidentInputFormProps {
  onResult: (result: IncidentReportResponse | null) => void
  onLoading: (loading: boolean) => void
}

export const IncidentInputForm: React.FC<IncidentInputFormProps> = ({
  onResult,
  onLoading,
}) => {
  const [rawText, setRawText] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rawText.trim() || !sourceType) {
      toast({
        title: '请填写完整信息',
        description: '请确保已输入事件文本并选择来源类型',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    onLoading(true)

    try {
      const requestData: ParseRequestData = {
        source_type: sourceType as 'Email' | 'SMS' | 'Call',
        raw_text: rawText.trim(),
      }

      const response = await parseIncidentReport(requestData)
      
      onResult(response)
      toast({
        title: '解析成功',
        description: '事件报告已成功解析',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('解析失败:', error)
      toast({
        title: '解析失败',
        description: error.message || '请检查网络连接或稍后重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      onResult(null)
    } finally {
      setIsSubmitting(false)
      onLoading(false)
    }
  }

  const handleReset = () => {
    setRawText('')
    setSourceType('')
    onResult(null)
  }

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <FormControl isRequired>
            <FormLabel htmlFor="sourceType">来源类型</FormLabel>
            <Select
              id="sourceType"
              placeholder="请选择事件来源类型"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              bg="white"
            >
              <option value="Email">邮件</option>
              <option value="SMS">短信</option>
              <option value="Call">电话</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="rawText">事件报告内容</FormLabel>
            <Textarea
              id="rawText"
              placeholder="请粘贴或输入需要解析的事件报告内容..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              resize="vertical"
              bg="white"
            />
          </FormControl>

          <Box display="flex" gap={3} justifyContent="flex-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              isDisabled={isSubmitting}
            >
              重置
            </Button>
            <Button
              type="submit"
              colorScheme="brand"
              isLoading={isSubmitting}
              loadingText="解析中..."
            >
              开始解析
            </Button>
          </Box>
        </VStack>
      </form>
    </Box>
  )
}