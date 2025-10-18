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
  Divider,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { ChatMessage, isUserMessage, isAssistantMessage, isSystemMessage } from '../../../types/chat'
import { IncidentReportResponse } from '../../../types/api'

interface MessageBubbleProps {
  message: ChatMessage
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const userBgColor = useColorModeValue('blue.50', 'blue.900')
  const assistantBgColor = useColorModeValue('gray.50', 'gray.700')
  const systemBgColor = useColorModeValue('yellow.50', 'yellow.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'red'
      case 'Medium': return 'yellow'
      case 'Low': return 'green'
      default: return 'gray'
    }
  }

  const getModuleColor = (module: string | null) => {
    switch (module) {
      case 'Container': return 'blue'
      case 'Vessel': return 'purple'
      case 'EDI/API': return 'orange'
      default: return 'gray'
    }
  }

  if (isUserMessage(message)) {
    return (
      <Flex justify="flex-end" mb={4}>
        <Box maxW="70%" bg={userBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
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
        </Box>
      </Flex>
    )
  }

  if (isAssistantMessage(message)) {
    const report = message.incidentReport
    
    return (
      <Flex justify="flex-start" mb={4}>
        <Box maxW="80%" bg={assistantBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
          <VStack align="stretch" spacing={4}>
            {/* 消息头部 */}
            <HStack justify="space-between" align="start">
              <HStack>
                <Avatar size="sm" name="AI Assistant" bg="blue.500" />
                <Text fontWeight="medium" color="blue.600">
                  AI 助手
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {formatTime(message.timestamp)}
              </Text>
            </HStack>

            {/* 助手回复内容 */}
            <Text whiteSpace="pre-wrap" color="gray.700">
              {message.content}
            </Text>

            <Divider />

            {/* 解析结果详情 */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                📊 解析结果
              </Text>
              
              {/* 基本信息 */}
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">事件ID:</Text>
                  <Text fontSize="sm">{report.incident_id || '未识别'}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">紧急程度:</Text>
                  <Badge colorScheme={getUrgencyColor(report.urgency)} size="sm">
                    {report.urgency}
                  </Badge>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">受影响模块:</Text>
                  <Badge colorScheme={getModuleColor(report.affected_module)} size="sm">
                    {report.affected_module || '未识别'}
                  </Badge>
                </HStack>
                
                {report.error_code && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">错误代码:</Text>
                    <Code fontSize="sm" colorScheme="red">{report.error_code}</Code>
                  </HStack>
                )}
              </VStack>

              {/* 问题摘要 */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>问题摘要:</Text>
                <Text fontSize="sm" bg="white" p={2} borderRadius="md" border="1px" borderColor="gray.200">
                  {report.problem_summary}
                </Text>
              </Box>

              {/* 潜在原因 */}
              {report.potential_cause_hint && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>潜在原因:</Text>
                  <Text fontSize="sm" bg="blue.50" p={2} borderRadius="md" border="1px" borderColor="blue.200">
                    {report.potential_cause_hint}
                  </Text>
                </Box>
              )}

              {/* 提取的实体 */}
              {report.entities && report.entities.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    提取的实体 ({report.entities.length}):
                  </Text>
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th fontSize="xs">类型</Th>
                          <Th fontSize="xs">值</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {report.entities.map((entity, index) => (
                          <Tr key={index}>
                            <Td>
                              <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                                {entity.type}
                              </Badge>
                            </Td>
                            <Td>
                              <Code fontSize="xs">{entity.value}</Code>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* 原始文本（可折叠） */}
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box as="span" flex="1" textAlign="left" fontSize="sm" fontWeight="medium">
                        原始文本
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Box
                      bg="gray.50"
                      p={2}
                      borderRadius="md"
                      maxH="150px"
                      overflowY="auto"
                    >
                      <Text fontSize="xs" whiteSpace="pre-wrap">
                        {report.raw_text}
                      </Text>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </VStack>
          </VStack>
        </Box>
      </Flex>
    )
  }

  if (isSystemMessage(message)) {
    return (
      <Flex justify="center" mb={4}>
        <Box bg={systemBgColor} p={3} borderRadius="lg" border="1px" borderColor="yellow.200">
          <HStack>
            <Text fontSize="sm" color="yellow.700">
              {message.content}
            </Text>
            <Text fontSize="xs" color="yellow.600">
              {formatTime(message.timestamp)}
            </Text>
          </HStack>
        </Box>
      </Flex>
    )
  }

  return null
}

// 加载消息组件
export const LoadingMessage: React.FC = () => {
  const assistantBgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Flex justify="flex-start" mb={4}>
      <Box maxW="80%" bg={assistantBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
        <HStack>
          <Avatar size="sm" name="AI Assistant" bg="blue.500" />
          <VStack align="start" spacing={2}>
            <Text fontWeight="medium" color="blue.600">
              AI 助手
            </Text>
            <HStack>
              <Spinner size="sm" color="blue.500" />
              <Text fontSize="sm" color="gray.600">
                正在解析中...
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </Flex>
  )
}

// 错误消息组件
export const ErrorMessage: React.FC<{ error: string }> = ({ error }) => {
  return (
    <Flex justify="flex-start" mb={4}>
      <Box maxW="80%">
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      </Box>
    </Flex>
  )
}
