import React from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Divider,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Tag,
  TagLabel,
  TagLeftIcon,
  Icon,
  Wrap,
  WrapItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import { 
  WarningIcon, 
  InfoIcon, 
  TimeIcon, 
  CheckCircleIcon,
  ExternalLinkIcon 
} from '@chakra-ui/icons'
import { IncidentReportResponse } from '../../../types/api'

interface ResultDisplayProps {
  result: IncidentReportResponse
}

/**
 * 结果展示组件 - 美观的信息卡片
 */
export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'red'
      case 'Medium': return 'orange'
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
    <Card shadow="lg" border="1px" borderColor={borderColor}>
      <CardHeader pb={3}>
        <HStack>
          <Icon as={CheckCircleIcon} color="green.500" />
          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            解析结果
          </Text>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={6} align="stretch">
          {/* 关键信息网格 */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Stat textAlign="center" p={3} bg="gray.50" borderRadius="md">
              <StatLabel fontSize="xs" color="gray.600">事件ID</StatLabel>
              <StatNumber fontSize="sm" color="blue.600">
                {result.incident_id || '未识别'}
              </StatNumber>
              <StatHelpText fontSize="xs" m={0}>
                <Icon as={InfoIcon} mr={1} />
                自动生成
              </StatHelpText>
            </Stat>
            
            <Stat textAlign="center" p={3} bg="gray.50" borderRadius="md">
              <StatLabel fontSize="xs" color="gray.600">紧急程度</StatLabel>
              <StatNumber fontSize="sm">
                <Tag 
                  size="md" 
                  colorScheme={getUrgencyColor(result.urgency)}
                  variant="solid"
                >
                  <TagLeftIcon as={WarningIcon} />
                  <TagLabel>{result.urgency}</TagLabel>
                </Tag>
              </StatNumber>
              <StatHelpText fontSize="xs" m={0}>
                <Icon as={TimeIcon} mr={1} />
                优先级评估
              </StatHelpText>
            </Stat>
            
            <Stat textAlign="center" p={3} bg="gray.50" borderRadius="md">
              <StatLabel fontSize="xs" color="gray.600">受影响模块</StatLabel>
              <StatNumber fontSize="sm">
                {result.affected_module ? (
                  <Tag 
                    size="md" 
                    colorScheme={getModuleColor(result.affected_module)}
                    variant="solid"
                  >
                    <TagLabel>{result.affected_module}</TagLabel>
                  </Tag>
                ) : (
                  <Text fontSize="sm" color="gray.500">未识别</Text>
                )}
              </StatNumber>
              <StatHelpText fontSize="xs" m={0}>
                <Icon as={ExternalLinkIcon} mr={1} />
                系统模块
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* 错误代码 */}
          {result.error_code && (
            <Box>
              <Divider mb={3} />
              <HStack mb={2}>
                <Icon as={WarningIcon} color="red.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  错误代码
                </Text>
              </HStack>
              <Code 
                fontSize="sm" 
                colorScheme="red" 
                p={2} 
                borderRadius="md"
                display="block"
                textAlign="center"
              >
                {result.error_code}
              </Code>
            </Box>
          )}

          {/* 问题摘要 */}
          <Box>
            <Divider mb={3} />
            <HStack mb={3}>
              <Icon as={InfoIcon} color="blue.500" />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                问题摘要
              </Text>
            </HStack>
            <Box 
              bg="blue.50" 
              p={4} 
              borderRadius="md" 
              border="1px" 
              borderColor="blue.200"
            >
              <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                {result.problem_summary}
              </Text>
            </Box>
          </Box>

          {/* 潜在原因 */}
          {result.potential_cause_hint && (
            <Box>
              <Divider mb={3} />
              <HStack mb={3}>
                <Icon as={WarningIcon} color="orange.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  潜在原因分析
                </Text>
              </HStack>
              <Box 
                bg="orange.50" 
                p={4} 
                borderRadius="md" 
                border="1px" 
                borderColor="orange.200"
              >
                <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                  {result.potential_cause_hint}
                </Text>
              </Box>
            </Box>
          )}

          {/* 提取的实体 */}
          {result.entities && result.entities.length > 0 && (
            <Box>
              <Divider mb={3} />
              <HStack mb={3}>
                <Icon as={CheckCircleIcon} color="purple.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  提取的实体 ({result.entities.length})
                </Text>
              </HStack>
              <Wrap spacing={2}>
                {result.entities.map((entity, index) => (
                  <WrapItem key={index}>
                    <Tag 
                      size="md" 
                      colorScheme="purple" 
                      variant="subtle"
                      cursor="pointer"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      <TagLabel>
                        <Text as="span" fontWeight="medium" mr={1}>
                          {entity.type}:
                        </Text>
                        <Text as="span" fontFamily="mono">
                          {entity.value}
                        </Text>
                      </TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}

          {/* 原始文本（可折叠） */}
          <Box>
            <Divider mb={3} />
            <Accordion allowToggle>
              <AccordionItem border="none">
                <h2>
                  <AccordionButton 
                    p={0} 
                    _hover={{ bg: 'transparent' }}
                    _expanded={{ bg: 'transparent' }}
                  >
                    <Box as="span" flex="1" textAlign="left">
                      <HStack>
                        <Icon as={ExternalLinkIcon} color="gray.500" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                          查看原始文本
                        </Text>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={0}>
                  <Box
                    bg="gray.50"
                    p={4}
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.200"
                    maxH="200px"
                    overflowY="auto"
                    mt={3}
                  >
                    <Text fontSize="xs" whiteSpace="pre-wrap" color="gray.600">
                      {result.raw_text}
                    </Text>
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}