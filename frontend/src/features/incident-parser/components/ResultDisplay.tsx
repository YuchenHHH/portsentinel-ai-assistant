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
 * Result display component - beautiful information cards
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
            Parsing Results
          </Text>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={6} align="stretch">
          {/* Key Information Grid */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Stat textAlign="center" p={3} bg="gray.50" borderRadius="md">
              <StatLabel fontSize="xs" color="gray.600">Incident ID</StatLabel>
              <StatNumber fontSize="sm" color="blue.600">
                {result.incident_id || 'Not Identified'}
              </StatNumber>
              <StatHelpText fontSize="xs" m={0}>
                <Icon as={InfoIcon} mr={1} />
                Auto Generated
              </StatHelpText>
            </Stat>
            
            <Stat textAlign="center" p={3} bg="gray.50" borderRadius="md">
              <StatLabel fontSize="xs" color="gray.600">Urgency Level</StatLabel>
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
                Priority Assessment
              </StatHelpText>
            </Stat>
            
            <Stat textAlign="center" p={3} bg="gray.50" borderRadius="md">
              <StatLabel fontSize="xs" color="gray.600">Affected Module</StatLabel>
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
                  <Text fontSize="sm" color="gray.500">Not Identified</Text>
                )}
              </StatNumber>
              <StatHelpText fontSize="xs" m={0}>
                <Icon as={ExternalLinkIcon} mr={1} />
                System Module
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Error Code */}
          {result.error_code && (
            <Box>
              <Divider mb={3} />
              <HStack mb={2}>
                <Icon as={WarningIcon} color="red.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  Error Code
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

          {/* Problem Summary */}
          <Box>
            <Divider mb={3} />
            <HStack mb={3}>
              <Icon as={InfoIcon} color="blue.500" />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Problem Summary
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

          {/* Potential Cause */}
          {result.potential_cause_hint && (
            <Box>
              <Divider mb={3} />
              <HStack mb={3}>
                <Icon as={WarningIcon} color="orange.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  Potential Cause Analysis
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


          {/* Raw Text (Collapsible) */}
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
                          View Raw Text
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