import React, { useState } from 'react'
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
  useColorModeValue,
  Tag,
  TagLabel,
  TagLeftIcon,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
import {
  InfoIcon,
  CheckCircleIcon,
  WarningIcon,
} from '@chakra-ui/icons'
import { EnrichmentResponse, SopSnippet } from '../../../types/api'

interface EnrichmentDisplayProps {
  enrichmentData: EnrichmentResponse
}

// 可点击的 SOP 卡片组件
const ClickableSopCard: React.FC<{ sop: SopSnippet; index: number; getModuleColor: (module: string | null) => string; formatScore: (score: number | null) => string }> = ({ 
  sop, 
  index, 
  getModuleColor, 
  formatScore 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('blue.50', 'blue.900')
  const hoverBg = useColorModeValue('blue.100', 'blue.800')

  return (
    <Card
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader pb={2}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="md" fontWeight="bold" color="gray.700">
              {sop.metadata.sop_title || `SOP #${index + 1}`}
            </Text>
            <HStack spacing={2}>
              {sop.metadata.module && (
                <Badge colorScheme={getModuleColor(sop.metadata.module)} variant="subtle">
                  {sop.metadata.module}
                </Badge>
              )}
              {sop.metadata.chunk_type && (
                <Badge colorScheme="gray" variant="outline">
                  {sop.metadata.chunk_type}
                </Badge>
              )}
              {sop.score !== null && (
                <Badge colorScheme="green" variant="solid">
                  相似度: {formatScore(sop.score)}
                </Badge>
              )}
              {sop.metadata._llm_validation !== undefined && (
                <Badge 
                  colorScheme={sop.metadata._llm_validation ? "green" : "red"} 
                  variant="solid"
                >
                  {sop.metadata._llm_validation ? "✓ LLM验证通过" : "✗ LLM验证未通过"}
                </Badge>
              )}
            </HStack>
          </VStack>
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.500">
              {isExpanded ? '点击折叠' : '点击展开'}
            </Text>
            <Icon 
              as={CheckCircleIcon} 
              color="gray.500" 
              transform={isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}
              transition="transform 0.2s"
            />
          </HStack>
        </HStack>
      </CardHeader>

      {isExpanded && (
        <CardBody pt={0}>
          <CompleteSopDisplay sop={sop} />
        </CardBody>
      )}
    </Card>
  )
}

// 完整 SOP 显示组件
const CompleteSopDisplay: React.FC<{ sop: SopSnippet }> = ({ sop }) => {
  const { metadata } = sop
  const completeSop = metadata.complete_sop

  // 定义所有需要的颜色值
  const contentBg = useColorModeValue('white', 'gray.800')
  const contentBorderColor = useColorModeValue('gray.200', 'gray.600')
  const overviewBg = useColorModeValue('blue.50', 'blue.900')
  const overviewBorderColor = useColorModeValue('blue.200', 'blue.700')
  const preconditionsBg = useColorModeValue('orange.50', 'orange.900')
  const preconditionsBorderColor = useColorModeValue('orange.200', 'orange.700')
  const resolutionBg = useColorModeValue('green.50', 'green.900')
  const resolutionBorderColor = useColorModeValue('green.200', 'green.700')
  const verificationBg = useColorModeValue('purple.50', 'purple.900')
  const verificationBorderColor = useColorModeValue('purple.200', 'purple.700')

  if (!completeSop) {
    // 如果没有完整数据，显示原始内容
    return (
      <Box
        bg={contentBg}
        p={4}
        borderRadius="md"
        border="1px"
        borderColor={contentBorderColor}
      >
        <Text
          fontSize="sm"
          color="gray.700"
          lineHeight="1.6"
          whiteSpace="pre-wrap"
        >
          {sop.content}
        </Text>
      </Box>
    )
  }

  // 检查是否有任何内容需要显示
  const hasOverview = completeSop.Overview && completeSop.Overview.trim() !== ''
  const hasPreconditions = completeSop.Preconditions && completeSop.Preconditions.trim() !== ''
  const hasResolution = completeSop.Resolution && completeSop.Resolution.trim() !== ''
  const hasVerification = completeSop.Verification && completeSop.Verification.trim() !== ''

  return (
    <VStack align="stretch" spacing={4}>
      {/* 模块信息 - 始终显示 */}
      <Box>
        <Tag size="sm" colorScheme="teal" borderRadius="full">
          <TagLabel>{completeSop.Module}</TagLabel>
        </Tag>
      </Box>

      {/* 直接显示所有详细内容 */}
      <VStack align="stretch" spacing={4}>
        {/* Overview */}
        {hasOverview && (
          <Box>
            <HStack mb={2}>
              <Icon as={InfoIcon} color="blue.500" />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                概述 (Overview)
              </Text>
            </HStack>
            <Box
              bg={overviewBg}
              p={3}
              borderRadius="md"
              border="1px"
              borderColor={overviewBorderColor}
            >
              <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                {completeSop.Overview}
              </Text>
            </Box>
          </Box>
        )}

        {/* Preconditions */}
        {hasPreconditions && (
          <Box>
            <HStack mb={2}>
              <Icon as={WarningIcon} color="orange.500" />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                前置条件 (Preconditions)
              </Text>
            </HStack>
            <Box
              bg={preconditionsBg}
              p={3}
              borderRadius="md"
              border="1px"
              borderColor={preconditionsBorderColor}
            >
              <Text fontSize="sm" color="gray.700" lineHeight="1.6" whiteSpace="pre-wrap">
                {completeSop.Preconditions}
              </Text>
            </Box>
          </Box>
        )}

        {/* Resolution */}
        {hasResolution && (
          <Box>
            <HStack mb={2}>
              <Icon as={CheckCircleIcon} color="green.500" />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                解决步骤 (Resolution)
              </Text>
            </HStack>
            <Box
              bg={resolutionBg}
              p={3}
              borderRadius="md"
              border="1px"
              borderColor={resolutionBorderColor}
            >
              <Text fontSize="sm" color="gray.700" lineHeight="1.6" whiteSpace="pre-wrap">
                {completeSop.Resolution}
              </Text>
            </Box>
          </Box>
        )}

        {/* Verification */}
        {hasVerification && (
          <Box>
            <HStack mb={2}>
              <Icon as={CheckCircleIcon} color="purple.500" />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                验证步骤 (Verification)
              </Text>
            </HStack>
            <Box
              bg={verificationBg}
              p={3}
              borderRadius="md"
              border="1px"
              borderColor={verificationBorderColor}
            >
              <Text fontSize="sm" color="gray.700" lineHeight="1.6" whiteSpace="pre-wrap">
                {completeSop.Verification}
              </Text>
            </Box>
          </Box>
        )}

        {/* 元数据信息 */}
        {sop.metadata.sop_id && (
          <Box>
            <HStack mb={2}>
              <Icon as={InfoIcon} color="gray.500" />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                元数据信息
              </Text>
            </HStack>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">SOP ID:</Text>
                <Code fontSize="xs">{sop.metadata.sop_id}</Code>
              </HStack>
              {sop.metadata.source && (
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.500">来源:</Text>
                  <Text fontSize="xs" color="gray.600">{sop.metadata.source}</Text>
                </HStack>
              )}
              {sop.metadata.sop_index && (
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.500">索引:</Text>
                  <Text fontSize="xs" color="gray.600">{sop.metadata.sop_index}</Text>
                </HStack>
              )}
              {sop.metadata._validation_reason && (
                <Box>
                  <HStack mb={2}>
                    <Icon as={InfoIcon} color="blue.500" />
                    <Text fontSize="xs" fontWeight="bold" color="gray.700">
                      LLM验证推理
                    </Text>
                  </HStack>
                  <Box
                    bg={sop.metadata._llm_validation ? "green.50" : "red.50"}
                    p={2}
                    borderRadius="md"
                    border="1px"
                    borderColor={sop.metadata._llm_validation ? "green.200" : "red.200"}
                  >
                    <Text fontSize="xs" color="gray.700" lineHeight="1.4" whiteSpace="pre-wrap">
                      {sop.metadata._validation_reason}
                    </Text>
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </VStack>
  )
}

export const EnrichmentDisplay: React.FC<EnrichmentDisplayProps> = ({ enrichmentData }) => {

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
      case 'EDI/API': return 'teal'
      default: return 'gray'
    }
  }

  const formatScore = (score: number | null) => {
    if (score === null) return 'N/A'
    return (score * 100).toFixed(1) + '%'
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* 检索摘要 */}
      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>知识库检索完成</AlertTitle>
          <AlertDescription>
            {enrichmentData.retrieval_summary}
          </AlertDescription>
        </Box>
      </Alert>

      {/* 统计信息 */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat>
          <StatLabel fontSize="sm" color="gray.500">找到的 SOP 数量</StatLabel>
          <StatNumber fontSize="lg" color="blue.600">
            {enrichmentData.total_sops_found}
          </StatNumber>
          <StatHelpText fontSize="xs">相关标准操作程序</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel fontSize="sm" color="gray.500">紧急程度</StatLabel>
          <StatNumber>
            <Tag size="sm" colorScheme={getUrgencyColor(enrichmentData.urgency)} borderRadius="full">
              <TagLeftIcon as={WarningIcon} />
              <TagLabel>{enrichmentData.urgency}</TagLabel>
            </Tag>
          </StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel fontSize="sm" color="gray.500">受影响模块</StatLabel>
          <StatNumber>
            <Tag size="sm" colorScheme={getModuleColor(enrichmentData.affected_module)} borderRadius="full">
              <TagLabel>{enrichmentData.affected_module || '未识别'}</TagLabel>
            </Tag>
          </StatNumber>
        </Stat>
      </SimpleGrid>

      {/* SOP 建议列表 */}
      {enrichmentData.retrieved_sops && enrichmentData.retrieved_sops.length > 0 ? (
        <Box>
          <HStack mb={4}>
            <Icon as={CheckCircleIcon} color="green.500" />
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              相关 SOP 建议 ({enrichmentData.retrieved_sops.length})
            </Text>
          </HStack>

          <VStack spacing={4} align="stretch">
            {enrichmentData.retrieved_sops.map((sop, index) => (
              <ClickableSopCard
                key={index}
                sop={sop}
                index={index}
                getModuleColor={getModuleColor}
                formatScore={formatScore}
              />
            ))}
          </VStack>
        </Box>
      ) : (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>未找到相关 SOP</AlertTitle>
            <AlertDescription>
              知识库中暂时没有找到与此次事件相关的标准操作程序。建议手动查阅相关文档或联系技术支持。
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* 错误代码信息 */}
      {enrichmentData.error_code && (
        <Box>
          <Divider mb={3} />
          <HStack mb={3}>
            <Icon as={WarningIcon} color="red.500" />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              错误代码信息
            </Text>
          </HStack>
          <Code
            colorScheme="red"
            p={3}
            borderRadius="md"
            w="full"
            display="block"
            fontSize="sm"
          >
            {enrichmentData.error_code}
          </Code>
        </Box>
      )}

      {/* 检索指标 */}
      {enrichmentData.retrieval_metrics && (
        <Box>
          <HStack mb={3}>
            <Icon as={InfoIcon} color="blue.500" />
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              检索指标
            </Text>
          </HStack>
          
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">查询变体</StatLabel>
              <StatNumber fontSize="md">{enrichmentData.retrieval_metrics.num_expanded_queries}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">BM25 候选</StatLabel>
              <StatNumber fontSize="md">{enrichmentData.retrieval_metrics.num_bm25_candidates}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">向量候选</StatLabel>
              <StatNumber fontSize="md">{enrichmentData.retrieval_metrics.num_vector_candidates}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">合并候选</StatLabel>
              <StatNumber fontSize="md">{enrichmentData.retrieval_metrics.num_merged_candidates}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">RRF 后</StatLabel>
              <StatNumber fontSize="md">{enrichmentData.retrieval_metrics.num_after_rrf}</StatNumber>
            </Stat>
            
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">最终结果</StatLabel>
              <StatNumber fontSize="md">{enrichmentData.retrieval_metrics.num_final_results}</StatNumber>
            </Stat>
          </SimpleGrid>
          
          <HStack mt={4} spacing={4}>
            <Badge colorScheme="blue" variant="subtle">
              BM25 权重: {enrichmentData.retrieval_metrics.bm25_weight}
            </Badge>
            <Badge colorScheme="green" variant="subtle">
              向量权重: {enrichmentData.retrieval_metrics.vector_weight}
            </Badge>
            <Badge colorScheme="purple" variant="subtle">
              RRF k: {enrichmentData.retrieval_metrics.rrf_k}
            </Badge>
          </HStack>
        </Box>
      )}
    </VStack>
  )
}
