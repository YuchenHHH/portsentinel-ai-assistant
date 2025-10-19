import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Tag,
  TagLabel,
  TagLeftIcon,
  Icon,
  Code,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { 
  TimeIcon, 
  CheckCircleIcon, 
  WarningIcon,
  InfoIcon,
  ExternalLinkIcon 
} from '@chakra-ui/icons'
import { HistoryMatchResponse, MatchedCase } from '../../../types/api'

interface HistoryMatchDisplayProps {
  historyData: HistoryMatchResponse
}

/**
 * 历史案例匹配结果显示组件
 */
export const HistoryMatchDisplay: React.FC<HistoryMatchDisplayProps> = ({ historyData }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgColor = useColorModeValue('gray.50', 'gray.700')

  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'container': return 'blue'
      case 'vessel': return 'purple'
      case 'edi/api': return 'orange'
      default: return 'gray'
    }
  }

  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'green' : 'red'
  }

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? CheckCircleIcon : WarningIcon
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%'
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('zh-CN')
    } catch {
      return timestamp
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* 检索摘要 */}
      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>历史案例匹配完成</AlertTitle>
          <AlertDescription>
            找到 {historyData.matched_cases.length} 个相似的历史案例
          </AlertDescription>
        </Box>
      </Alert>

      {/* 统计信息 */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Stat>
          <StatLabel>总候选案例</StatLabel>
          <StatNumber>{historyData.total_candidates}</StatNumber>
          <StatHelpText>初始候选</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>模块过滤</StatLabel>
          <StatNumber>{historyData.module_filtered_count}</StatNumber>
          <StatHelpText>模块匹配</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>相似度过滤</StatLabel>
          <StatNumber>{historyData.similarity_filtered_count}</StatNumber>
          <StatHelpText>相似度匹配</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>GPT验证</StatLabel>
          <StatNumber>{historyData.gpt_validated_count}</StatNumber>
          <StatHelpText>AI验证通过</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* 处理时间 */}
      <Box textAlign="center">
        <Text fontSize="sm" color="gray.600">
          处理时间: {historyData.processing_time_ms.toFixed(0)}ms
        </Text>
      </Box>

      {/* 匹配的历史案例 */}
      {historyData.matched_cases.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            相似的历史案例
          </Text>
          
          {historyData.matched_cases.map((matchedCase, index) => (
            <HistoryCaseCard 
              key={matchedCase.case.id} 
              matchedCase={matchedCase} 
              index={index + 1}
            />
          ))}
        </VStack>
      ) : (
        <Card>
          <CardBody>
            <HStack>
              <Icon as={InfoIcon} color="gray.500" />
              <Text color="gray.600">
                未找到相似的历史案例
              </Text>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}

/**
 * 单个历史案例卡片组件
 */
const HistoryCaseCard: React.FC<{ 
  matchedCase: MatchedCase
  index: number 
}> = ({ matchedCase, index }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  
  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'container': return 'blue'
      case 'vessel': return 'purple'
      case 'edi/api': return 'orange'
      default: return 'gray'
    }
  }

  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'green' : 'red'
  }

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? CheckCircleIcon : WarningIcon
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%'
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('zh-CN')
    } catch {
      return timestamp
    }
  }

  const { case: historyCase, similarity_score, gpt_validation, gpt_reasoning } = matchedCase

  return (
    <Card shadow="md" border="1px" borderColor={borderColor}>
      <CardHeader pb={3}>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <HStack>
              <Text fontSize="lg" fontWeight="bold" color="gray.700">
                案例 #{index}: {historyCase.id}
              </Text>
              <Badge colorScheme={getModuleColor(historyCase.module)}>
                {historyCase.module}
              </Badge>
            </HStack>
            
            <HStack spacing={2}>
              <Tag colorScheme={getValidationColor(gpt_validation)} size="sm">
                <TagLeftIcon as={getValidationIcon(gpt_validation)} />
                <TagLabel>
                  {gpt_validation ? 'GPT验证通过' : 'GPT验证未通过'}
                </TagLabel>
              </Tag>
            </HStack>
          </HStack>

          {/* 相似度分数 */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600">综合相似度</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                {formatScore(similarity_score.final_score)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">文本相似度</Text>
              <Text fontSize="md" color="gray.700">
                {formatScore(similarity_score.similarity_score)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">实体重合度</Text>
              <Text fontSize="md" color="gray.700">
                {formatScore(similarity_score.entity_overlap_score)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">模块匹配度</Text>
              <Text fontSize="md" color="gray.700">
                {formatScore(similarity_score.module_match_score)}
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* 基本信息 */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">报告方式</Text>
              <Text>{historyCase.mode}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">EDI相关</Text>
              <Text>{historyCase.is_edi}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">时间戳</Text>
              <Text fontSize="sm">{formatTimestamp(historyCase.timestamp)}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">案例ID</Text>
              <Text fontSize="sm" fontFamily="mono">{historyCase.id}</Text>
            </Box>
          </SimpleGrid>

          <Divider />

          {/* 问题描述 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              问题描述
            </Text>
            <Box
              bg={bgColor}
              p={3}
              borderRadius="md"
              border="1px"
              borderColor={borderColor}
            >
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {historyCase.problem_statement}
              </Text>
            </Box>
          </Box>

          {/* 解决方案 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              解决方案
            </Text>
            <Box
              bg={bgColor}
              p={3}
              borderRadius="md"
              border="1px"
              borderColor={borderColor}
            >
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {historyCase.solution}
              </Text>
            </Box>
          </Box>

          {/* GPT验证推理 */}
          {gpt_reasoning && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                GPT验证推理
              </Text>
              <Box
                bg={getValidationColor(gpt_validation) === 'green' ? 'green.50' : 'red.50'}
                p={3}
                borderRadius="md"
                border="1px"
                borderColor={getValidationColor(gpt_validation) === 'green' ? 'green.200' : 'red.200'}
              >
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {gpt_reasoning}
                </Text>
              </Box>
            </Box>
          )}

          {/* 完整文本（可折叠） */}
          <Box>
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
                          查看完整案例文本
                        </Text>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={0}>
                  <Box
                    bg={bgColor}
                    p={4}
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                    maxH="300px"
                    overflowY="auto"
                    mt={3}
                  >
                    <Text fontSize="xs" whiteSpace="pre-wrap" color="gray.600">
                      {historyCase.full_text}
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
