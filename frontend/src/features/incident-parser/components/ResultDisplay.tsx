import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
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
} from '@chakra-ui/react'
import { IncidentReportResponse } from '../../../types/api'

interface ResultDisplayProps {
  result: IncidentReportResponse | null
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
        textAlign="center"
      >
        <Text color="gray.500">正在解析中，请稍候...</Text>
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
        textAlign="center"
      >
        <Text color="gray.500">请输入事件报告内容并点击解析</Text>
      </Box>
    )
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

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
    >
      <VStack spacing={6} align="stretch">
        {/* 基本信息 */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700">
            解析结果
          </Text>
          
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="medium">事件ID:</Text>
              <Text>{result.incident_id || '未识别'}</Text>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontWeight="medium">来源类型:</Text>
              <Badge colorScheme="blue">{result.source_type}</Badge>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontWeight="medium">紧急程度:</Text>
              <Badge colorScheme={getUrgencyColor(result.urgency)}>
                {result.urgency}
              </Badge>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontWeight="medium">受影响模块:</Text>
              <Badge colorScheme={getModuleColor(result.affected_module)}>
                {result.affected_module || '未识别'}
              </Badge>
            </HStack>
            
            {result.error_code && (
              <HStack justify="space-between">
                <Text fontWeight="medium">错误代码:</Text>
                <Code colorScheme="red">{result.error_code}</Code>
              </HStack>
            )}
          </VStack>
        </Box>

        <Divider />

        {/* 时间信息 */}
        <Box>
          <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
            时间信息
          </Text>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="medium">接收时间:</Text>
              <Text fontSize="sm" color="gray.600">
                {new Date(result.received_timestamp_utc).toLocaleString('zh-CN')}
              </Text>
            </HStack>
            {result.reported_timestamp_hint && (
              <HStack justify="space-between">
                <Text fontWeight="medium">报告时间提示:</Text>
                <Text fontSize="sm" color="gray.600">
                  {result.reported_timestamp_hint}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>

        <Divider />

        {/* 问题摘要 */}
        <Box>
          <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
            问题摘要
          </Text>
          <Text bg="gray.50" p={3} borderRadius="md" fontSize="sm">
            {result.problem_summary}
          </Text>
        </Box>

        {/* 潜在原因 */}
        {result.potential_cause_hint && (
          <>
            <Divider />
            <Box>
              <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                潜在原因分析
              </Text>
              <Text bg="blue.50" p={3} borderRadius="md" fontSize="sm">
                {result.potential_cause_hint}
              </Text>
            </Box>
          </>
        )}

        {/* 提取的实体 */}
        {result.entities && result.entities.length > 0 && (
          <>
            <Divider />
            <Box>
              <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                提取的实体 ({result.entities.length})
              </Text>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>类型</Th>
                      <Th>值</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {result.entities.map((entity, index) => (
                      <Tr key={index}>
                        <Td>
                          <Badge colorScheme="purple" variant="subtle">
                            {entity.type}
                          </Badge>
                        </Td>
                        <Td>
                          <Code>{entity.value}</Code>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}

        {/* 原始文本 */}
        <Accordion allowToggle>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                  原始文本
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Box
                bg="gray.50"
                p={3}
                borderRadius="md"
                maxH="200px"
                overflowY="auto"
              >
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {result.raw_text}
                </Text>
              </Box>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  )
}