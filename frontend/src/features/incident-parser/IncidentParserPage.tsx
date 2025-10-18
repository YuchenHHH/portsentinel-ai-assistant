import React, { useState } from 'react'
import { Box, Container, Heading, VStack } from '@chakra-ui/react'
import { IncidentInputForm } from './components/IncidentInputForm'
import { ResultDisplay } from './components/ResultDisplay'
import { IncidentReportResponse } from '../../types/api'

export const IncidentParserPage: React.FC = () => {
  const [result, setResult] = useState<IncidentReportResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleResult = (newResult: IncidentReportResponse | null) => {
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
          <Heading as="h1" size="xl" color="gray.700" mb={2}>
            PortSentinel AI 事件解析器
          </Heading>
          <Box
            as="p"
            color="gray.600"
            fontSize="lg"
            maxW="2xl"
            mx="auto"
          >
            使用 AI 技术智能解析事件报告，自动提取关键信息并生成结构化数据
          </Box>
        </Box>

        {/* 输入表单 */}
        <IncidentInputForm
          onResult={handleResult}
          onLoading={handleLoading}
        />

        {/* 结果显示 */}
        <ResultDisplay
          result={result}
          isLoading={isLoading}
        />
      </VStack>
    </Container>
  )
}