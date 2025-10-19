/**
 * CaseDetail - 案例详情页面（集成现有聊天界面）
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Divider,
  Flex,
  Spacer,
  IconButton,
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  TimeIcon,
  WarningIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import { IncidentParserPage } from '../../features/incident-parser/IncidentParserPage';

interface CaseDetailProps {
  caseId: string | null;
  onBack: () => void;
}

// 模拟案例数据
const mockCaseData = {
  id: '1',
  title: 'Container Loading Issue',
  description: 'Container loading process failed due to equipment malfunction',
  priority: 'urgent',
  status: 'pending',
  assignedTo: 'John Doe',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  category: 'Equipment',
  details: {
    location: 'Terminal A, Berth 3',
    equipment: 'Crane #CT-001',
    affectedContainers: 12,
    estimatedDelay: '4 hours',
    impact: 'High - Delays vessel departure',
  },
};

export const CaseDetail: React.FC<CaseDetailProps> = ({ caseId, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red';
      case 'in-progress': return 'blue';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const handleProcessCase = () => {
    setIsProcessing(true);
    // 这里会触发AI处理流程
  };

  // 如果是新案例（caseId为null），直接显示聊天界面
  if (!caseId) {
    return (
      <VStack spacing={6} align="stretch">
        {/* 新案例头部 */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex align="center">
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                >
                  Back to Dashboard
                </Button>
                <Spacer />
              </Flex>

              <VStack spacing={3} align="stretch">
                <Text fontSize="2xl" fontWeight="bold">
                  New Case
                </Text>
                <Text color={textColor}>
                  Create a new case and use AI to analyze the incident
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 聊天界面 */}
        <Box>
          <IncidentParserPage />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Case Header */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Header Actions */}
            <Flex align="center">
              <Button
                leftIcon={<ArrowBackIcon />}
                variant="ghost"
                size="sm"
                onClick={onBack}
              >
                Back to Cases
              </Button>
              <Spacer />
              <HStack spacing={2}>
                <Button size="sm" variant="outline" leftIcon={<EditIcon />}>
                  Edit
                </Button>
                <Button size="sm" colorScheme="green" leftIcon={<CheckIcon />}>
                  Resolve
                </Button>
              </HStack>
            </Flex>

            {/* Case Info */}
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="2xl" fontWeight="bold">
                  {mockCaseData.title}
                </Text>
                <HStack spacing={2}>
                  <HStack spacing={1}>
                    <Icon as={WarningIcon} />
                    <Badge
                      colorScheme={getPriorityColor(mockCaseData.priority)}
                      variant="solid"
                    >
                      {mockCaseData.priority.toUpperCase()}
                    </Badge>
                  </HStack>
                  <Badge
                    colorScheme={getStatusColor(mockCaseData.status)}
                    variant="subtle"
                  >
                    {mockCaseData.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </HStack>
              </HStack>

              <Text color={textColor}>
                {mockCaseData.description}
              </Text>

              <HStack spacing={6} wrap="wrap">
                <HStack spacing={2}>
                  <Icon as={TimeIcon} color="gray.500" />
                  <Text fontSize="sm" color={textColor}>
                    Created: {new Date(mockCaseData.createdAt).toLocaleString()}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={InfoIcon} color="gray.500" />
                  <Text fontSize="sm" color={textColor}>
                    Assigned to: {mockCaseData.assignedTo}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={WarningIcon} color="gray.500" />
                  <Text fontSize="sm" color={textColor}>
                    Category: {mockCaseData.category}
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Case Details */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold">
              Case Details
            </Text>
            
            <HStack spacing={6} wrap="wrap">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Location
                </Text>
                <Text fontSize="sm">{mockCaseData.details.location}</Text>
              </VStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Equipment
                </Text>
                <Text fontSize="sm">{mockCaseData.details.equipment}</Text>
              </VStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Affected Containers
                </Text>
                <Text fontSize="sm">{mockCaseData.details.affectedContainers}</Text>
              </VStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Estimated Delay
                </Text>
                <Text fontSize="sm" color="red.500">
                  {mockCaseData.details.estimatedDelay}
                </Text>
              </VStack>
            </HStack>

            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                Impact
              </Text>
              <Text fontSize="sm">{mockCaseData.details.impact}</Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* AI Assistant Section */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold">
                AI Assistant
              </Text>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleProcessCase}
                isLoading={isProcessing}
                loadingText="Processing..."
              >
                Process with AI
              </Button>
            </HStack>
            
            <Text fontSize="sm" color={textColor}>
              Use AI to analyze this case and provide recommendations, historical matches, and SOP suggestions.
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Chat Interface */}
      <Box>
        <IncidentParserPage />
      </Box>
    </VStack>
  );
};
