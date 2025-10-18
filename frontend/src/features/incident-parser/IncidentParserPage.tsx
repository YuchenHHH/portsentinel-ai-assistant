import React, { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Divider,
} from '@chakra-ui/react'
import { IncidentInputForm } from './components/IncidentInputForm'
import { ResultDisplay } from './components/ResultDisplay'

export const IncidentParserPage: React.FC = () => {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleResult = (newResult: any) => {
    setResult(newResult)
  }

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 页面标题 */}
        <Box textAlign="center">
          <Heading as="h1" size="xl" color="gray.800" mb={4}>
            PortSentinel AI Assistant
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
            智能事件报告解析系统 - 使用 AI 技术自动解析和结构化事件报告内容
          </Text>
        </Box>

        <Divider />

        {/* 输入表单 */}
        <Box>
          <Heading as="h2" size="lg" color="gray.700" mb={6}>
            事件报告输入
          </Heading>
          <IncidentInputForm
            onResult={handleResult}
            onLoading={handleLoading}
          />
        </Box>

        {/* 结果显示 */}
        <Box>
          <Heading as="h2" size="lg" color="gray.700" mb={6}>
            解析结果
          </Heading>
          <ResultDisplay result={result} isLoading={isLoading} />
        </Box>
      </VStack>
    </Container>
  )
}
