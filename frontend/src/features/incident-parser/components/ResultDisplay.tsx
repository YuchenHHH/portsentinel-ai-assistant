import React from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'

interface ResultDisplayProps {
  result: any
  isLoading: boolean
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <Box
        bg="white"
        p={6}
        borderRadius="lg"
        boxShadow="sm"
        border="1px"
        borderColor="gray.200"
        minH="200px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500" fontSize="lg">
          正在解析事件报告，请稍候...
        </Text>
      </Box>
    )
  }

  if (!result) {
    return (
      <Box
        bg="white"
        p={6}
        borderRadius="lg"
        boxShadow="sm"
        border="1px"
        borderColor="gray.200"
        minH="200px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Text color="gray.500" fontSize="lg" textAlign="center">
            解析结果将在此处显示
          </Text>
          <Text color="gray.400" fontSize="sm" textAlign="center">
            请在上方输入事件报告内容并点击"开始解析"
          </Text>
        </VStack>
      </Box>
    )
  }

  // 如果 result 是错误信息
  if (result.error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>解析失败!</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Box>
      </Alert>
    )
  }

  // 显示解析结果
  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            解析结果
          </Text>
          <Badge colorScheme="green" fontSize="sm">
            解析成功
          </Badge>
        </HStack>

        <Divider />

        {/* 基础信息 */}
        {result.incident_id && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
              事件ID
            </Text>
            <Code p={2} borderRadius="md" bg="gray.50">
              {result.incident_id}
            </Code>
          </Box>
        )}

        {result.severity && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
              严重程度
            </Text>
            <Badge
              colorScheme={
                result.severity === 'high' ? 'red' :
                result.severity === 'medium' ? 'orange' :
                result.severity === 'low' ? 'green' : 'gray'
              }
              fontSize="sm"
            >
              {result.severity.toUpperCase()}
            </Badge>
          </Box>
        )}

        {result.summary && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
              事件摘要
            </Text>
            <Text color="gray.800">{result.summary}</Text>
          </Box>
        )}

        {result.description && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
              详细描述
            </Text>
            <Text color="gray.800" whiteSpace="pre-wrap">
              {result.description}
            </Text>
          </Box>
        )}

        {/* 显示完整的 JSON 结果（用于调试） */}
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
            完整结果
          </Text>
          <Code
            p={4}
            borderRadius="md"
            bg="gray.50"
            fontSize="xs"
            whiteSpace="pre-wrap"
            display="block"
            overflow="auto"
            maxH="300px"
          >
            {JSON.stringify(result, null, 2)}
          </Code>
        </Box>
      </VStack>
    </Box>
  )
}
