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
 * Historical Case Matching Results Display Component
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
      return new Date(timestamp).toLocaleString('en-US')
    } catch {
      return timestamp
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Retrieval Summary */}
      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>Historical Case Matching Completed</AlertTitle>
          <AlertDescription>
            Found {historyData.matched_cases.length} similar historical cases
          </AlertDescription>
        </Box>
      </Alert>

      {/* Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Stat>
          <StatLabel>Total Candidates</StatLabel>
          <StatNumber>{historyData.total_candidates}</StatNumber>
          <StatHelpText>Initial Candidates</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Module Filtered</StatLabel>
          <StatNumber>{historyData.module_filtered_count}</StatNumber>
          <StatHelpText>Module Matched</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Similarity Filtered</StatLabel>
          <StatNumber>{historyData.similarity_filtered_count}</StatNumber>
          <StatHelpText>Similarity Matched</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>GPT Validated</StatLabel>
          <StatNumber>{historyData.gpt_validated_count}</StatNumber>
          <StatHelpText>AI Validation Passed</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Processing Time */}
      <Box textAlign="center">
        <Text fontSize="sm" color="gray.600">
          Processing Time: {historyData.processing_time_ms.toFixed(0)}ms
        </Text>
      </Box>

      {/* Matched Historical Cases */}
      {historyData.matched_cases.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            Similar Historical Cases
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
                No similar historical cases found
              </Text>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}

/**
 * Individual Historical Case Card Component
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
      return new Date(timestamp).toLocaleString('en-US')
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
                Case #{index}: {historyCase.id}
              </Text>
              <Badge colorScheme={getModuleColor(historyCase.module)}>
                {historyCase.module}
              </Badge>
            </HStack>
            
            <HStack spacing={2}>
              <Tag colorScheme={getValidationColor(gpt_validation)} size="sm">
                <TagLeftIcon as={getValidationIcon(gpt_validation)} />
                <TagLabel>
                  {gpt_validation ? 'GPT Validated' : 'GPT Validation Failed'}
                </TagLabel>
              </Tag>
            </HStack>
          </HStack>

          {/* Similarity Scores */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600">Overall Similarity</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                {formatScore(similarity_score.final_score)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Text Similarity</Text>
              <Text fontSize="md" color="gray.700">
                {formatScore(similarity_score.similarity_score)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Entity Overlap</Text>
              <Text fontSize="md" color="gray.700">
                {formatScore(similarity_score.entity_overlap_score)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Module Match</Text>
              <Text fontSize="md" color="gray.700">
                {formatScore(similarity_score.module_match_score)}
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Basic Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">Report Method</Text>
              <Text>{historyCase.mode}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">EDI Related</Text>
              <Text>{historyCase.is_edi}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">Timestamp</Text>
              <Text fontSize="sm">{formatTimestamp(historyCase.timestamp)}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">Case ID</Text>
              <Text fontSize="sm" fontFamily="mono">{historyCase.id}</Text>
            </Box>
          </SimpleGrid>

          <Divider />

          {/* Problem Description */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Problem Description
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

          {/* Solution */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Solution
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

          {/* GPT Validation Reasoning */}
          {gpt_reasoning && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                GPT Validation Reasoning
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

          {/* Full Text (Collapsible) */}
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
                          View Full Case Text
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
