import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  useColorModeValue,
  Button,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface ExecutionSummaryData {
  incident_id: string;
  resolution_outcome: string;
  error_identified: string;
  root_cause: string;
  actions_taken: string[];
  resolution_timestamp: string;
  l2_team_notes: string;
  escalation_required: boolean;
}

interface ExecutionSummaryDisplayProps {
  summaryData: ExecutionSummaryData;
  escalationContact?: {
    contact_name: string;
    role: string;
    email: string;
    module: string;
  };
  escalationEmail?: {
    to_email: string;
    subject: string;
    body: string;
    priority: string;
  };
}

const MotionBox = motion(Box);

export const ExecutionSummaryDisplay: React.FC<ExecutionSummaryDisplayProps> = ({
  summaryData,
  escalationContact,
  escalationEmail
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const { isOpen: isActionsOpen, onToggle: toggleActions } = useDisclosure();
  const { isOpen: isEscalationOpen, onToggle: toggleEscalation } = useDisclosure();

  const getStatusColor = (outcome: string) => {
    switch (outcome) {
      case 'SUCCESS':
        return 'green';
      case 'ESCALATION_REQUIRED':
        return 'orange';
      case 'FAILED':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getStatusIcon = (outcome: string) => {
    switch (outcome) {
      case 'SUCCESS':
        return '✅';
      case 'ESCALATION_REQUIRED':
        return '⚠️';
      case 'FAILED':
        return '❌';
      default:
        return '📋';
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      bg={cardBg}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      overflow="hidden"
      boxShadow="lg"
    >
      {/* 标题栏 */}
      <Box bg={headerBg} p={4} borderBottom="1px" borderColor={borderColor}>
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Text fontSize="lg" fontWeight="bold" color="blue.700">
              {getStatusIcon(summaryData.resolution_outcome)} 执行摘要
            </Text>
            <Badge colorScheme={getStatusColor(summaryData.resolution_outcome)} size="lg">
              {summaryData.resolution_outcome}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            事件ID: {summaryData.incident_id}
          </Text>
        </HStack>
      </Box>

      <VStack align="stretch" spacing={4} p={4}>
        {/* 基本信息 */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.700">
            基本信息
          </Text>
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="120px">
                解析结果:
              </Text>
              <Badge colorScheme={getStatusColor(summaryData.resolution_outcome)}>
                {summaryData.resolution_outcome}
              </Badge>
            </HStack>
            <HStack>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="120px">
                完成时间:
              </Text>
              <Text fontSize="sm" color="gray.700">
                {new Date(summaryData.resolution_timestamp).toLocaleString('zh-CN')}
              </Text>
            </HStack>
            <HStack>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="120px">
                升级状态:
              </Text>
              <Badge colorScheme={summaryData.escalation_required ? "orange" : "green"}>
                {summaryData.escalation_required ? "需要升级" : "无需升级"}
              </Badge>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* 错误详情 */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.700">
            错误详情
          </Text>
          <VStack align="stretch" spacing={2}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                识别的错误:
              </Text>
              <Text fontSize="sm" color="gray.700" p={2} bg="gray.50" borderRadius="md">
                {summaryData.error_identified}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                根本原因:
              </Text>
              <Text fontSize="sm" color="gray.700" p={2} bg="gray.50" borderRadius="md">
                {summaryData.root_cause}
              </Text>
            </Box>
          </VStack>
        </Box>

        <Divider />

        {/* 执行的操作 */}
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              执行的操作
            </Text>
            <Button size="sm" variant="ghost" onClick={toggleActions}>
              {isActionsOpen ? '收起' : '展开'} ({summaryData.actions_taken.length} 个步骤)
            </Button>
          </HStack>
          
          <Collapse in={isActionsOpen} animateOpacity>
            <VStack align="stretch" spacing={2}>
              {summaryData.actions_taken.map((action, index) => (
                <Box key={index} p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                  <HStack align="start" spacing={3}>
                    <Badge colorScheme="blue" size="sm">
                      步骤 {index + 1}
                    </Badge>
                    <Text fontSize="sm" color="gray.700" flex={1}>
                      {action}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Collapse>
        </Box>

        <Divider />

        {/* L2 团队备注 */}
        {summaryData.l2_team_notes && (
          <>
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.700">
                L2 团队备注
              </Text>
              <Box p={3} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
                <Text fontSize="sm" color="gray.700">
                  {summaryData.l2_team_notes}
                </Text>
              </Box>
            </Box>
            <Divider />
          </>
        )}

        {/* 升级信息 */}
        {summaryData.escalation_required && (escalationContact || escalationEmail) && (
          <Box>
            <HStack justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                升级信息
              </Text>
              <Button size="sm" variant="ghost" onClick={toggleEscalation}>
                {isEscalationOpen ? '收起' : '展开'}
              </Button>
            </HStack>
            
            <Collapse in={isEscalationOpen} animateOpacity>
              <VStack align="stretch" spacing={3}>
                {escalationContact && (
                  <Box p={3} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
                    <Text fontSize="sm" fontWeight="medium" color="orange.700" mb={2}>
                      升级联系人
                    </Text>
                    <VStack align="stretch" spacing={1}>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          姓名:
                        </Text>
                        <Text fontSize="sm" color="gray.700">{escalationContact.contact_name}</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          角色:
                        </Text>
                        <Text fontSize="sm" color="gray.700">{escalationContact.role}</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          邮箱:
                        </Text>
                        <Text fontSize="sm" color="gray.700">{escalationContact.email}</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          模块:
                        </Text>
                        <Text fontSize="sm" color="gray.700">{escalationContact.module}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                {escalationEmail && (
                  <Box p={3} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                    <Text fontSize="sm" fontWeight="medium" color="red.700" mb={2}>
                      升级邮件
                    </Text>
                    <VStack align="stretch" spacing={1}>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          收件人:
                        </Text>
                        <Text fontSize="sm" color="gray.700">{escalationEmail.to_email}</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          主题:
                        </Text>
                        <Text fontSize="sm" color="gray.700">{escalationEmail.subject}</Text>
                      </HStack>
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" minW="60px">
                          优先级:
                        </Text>
                        <Badge colorScheme="red" size="sm">{escalationEmail.priority}</Badge>
                      </HStack>
                      <Box mt={2}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                          邮件内容:
                        </Text>
                        <Code
                          display="block"
                          whiteSpace="pre-wrap"
                          p={2}
                          borderRadius="sm"
                          bg="white"
                          color="gray.800"
                          fontSize="xs"
                          maxH="150px"
                          overflowY="auto"
                        >
                          {escalationEmail.body}
                        </Code>
                      </Box>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Collapse>
          </Box>
        )}

        {/* 成功状态提示 */}
        {summaryData.resolution_outcome === 'SUCCESS' && !summaryData.escalation_required && (
          <Alert status="success">
            <AlertIcon />
            <Box>
              <AlertTitle>执行成功！</AlertTitle>
              <AlertDescription>
                SOP 执行已完成，所有步骤都成功执行，无需进一步升级。
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* 升级状态提示 */}
        {summaryData.escalation_required && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>需要升级</AlertTitle>
              <AlertDescription>
                执行过程中遇到问题，已自动升级到 L3 团队处理。
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </MotionBox>
  );
};
