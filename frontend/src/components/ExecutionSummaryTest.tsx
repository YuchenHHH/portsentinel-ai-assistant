import React, { useState } from 'react';
import {
  Box,
  Button,
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
  Spinner
} from '@chakra-ui/react';
import { generateExecutionSummary, getSummaryServiceStatus } from '../services/executionSummaryApi';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const ExecutionSummaryTest: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<TestResult | null>(null);
  const [successSummary, setSuccessSummary] = useState<TestResult | null>(null);
  const [failureSummary, setFailureSummary] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');

  const handleTestServiceStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getSummaryServiceStatus();
      setServiceStatus({ success: true, data: status });
    } catch (error: any) {
      setServiceStatus({ success: false, error: error.message });
    }
    setIsLoading(false);
  };

  const handleTestSuccessSummary = async () => {
    setIsLoading(true);
    try {
      const result = await generateExecutionSummary('FRONTEND-TEST-SUCCESS-001', {
        execution_status: 'completed',
        execution_notes: 'SOP execution completed successfully via frontend test',
        total_execution_time_hours: 2.5,
        completed_steps: [
          {
            step: 0,
            step_description: 'Query container records for CMAU0000020',
            tool_output: 'Successfully retrieved 1 record',
            status: 'completed'
          },
          {
            step: 1,
            step_description: 'Update container status to resolved',
            tool_output: 'Status updated successfully',
            status: 'completed'
          },
          {
            step: 2,
            step_description: 'Verify resolution by re-querying',
            tool_output: 'Verification successful',
            status: 'completed'
          }
        ]
      });
      setSuccessSummary({ success: true, data: result });
    } catch (error: any) {
      setSuccessSummary({ success: false, error: error.message });
    }
    setIsLoading(false);
  };

  const handleTestFailureSummary = async () => {
    setIsLoading(true);
    try {
      const result = await generateExecutionSummary('FRONTEND-TEST-FAILED-001', {
        execution_status: 'failed',
        execution_notes: 'SOP execution failed due to database permission error',
        total_execution_time_hours: 1.5,
        completed_steps: [
          {
            step: 0,
            step_description: 'Query container records for CMAU0000020',
            tool_output: 'Successfully retrieved 1 record',
            status: 'completed'
          },
          {
            step: 1,
            step_description: 'Update container status',
            tool_output: 'Failed: Permission denied',
            status: 'failed'
          }
        ]
      });
      setFailureSummary({ success: true, data: result });
    } catch (error: any) {
      setFailureSummary({ success: false, error: error.message });
    }
    setIsLoading(false);
  };

  return (
    <Box p={6} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Agent 4 执行摘要集成测试
          </Text>
          <Text fontSize="sm" color="gray.600">
            测试 Agent 4 集成到前后端系统的功能
          </Text>
        </Box>

        <Divider />

        {/* 测试按钮 */}
        <VStack align="stretch" spacing={3}>
          <HStack spacing={3}>
            <Button
              colorScheme="blue"
              onClick={handleTestServiceStatus}
              isLoading={isLoading}
              loadingText="测试中..."
            >
              1. 测试服务状态
            </Button>
            <Button
              colorScheme="green"
              onClick={handleTestSuccessSummary}
              isLoading={isLoading}
              loadingText="测试中..."
            >
              2. 测试成功场景
            </Button>
            <Button
              colorScheme="red"
              onClick={handleTestFailureSummary}
              isLoading={isLoading}
              loadingText="测试中..."
            >
              3. 测试失败场景
            </Button>
          </HStack>
        </VStack>

        {/* 服务状态测试结果 */}
        {serviceStatus && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              服务状态测试结果
            </Text>
            {serviceStatus.success ? (
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>✅ 服务状态正常</AlertTitle>
                  <AlertDescription>
                    状态: {serviceStatus.data?.status} | 
                    服务: {serviceStatus.data?.service} | 
                    Agent 4 集成: {serviceStatus.data?.agent_4_integration}
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>❌ 服务状态异常</AlertTitle>
                  <AlertDescription>{serviceStatus.error}</AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>
        )}

        {/* 成功场景测试结果 */}
        {successSummary && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              成功场景测试结果
            </Text>
            {successSummary.success ? (
              <VStack align="stretch" spacing={3}>
                <Alert status="success">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>✅ 成功场景摘要生成成功</AlertTitle>
                    <AlertDescription>
                      事件ID: {successSummary.data?.incident_id} | 
                      执行状态: {successSummary.data?.summary?.execution_status} | 
                      需要升级: {successSummary.data?.summary?.escalation_required ? '是' : '否'}
                    </AlertDescription>
                  </Box>
                </Alert>
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>摘要详情:</Text>
                  <Code display="block" whiteSpace="pre-wrap" p={2} fontSize="xs">
                    {JSON.stringify(successSummary.data?.summary?.resolution_summary, null, 2)}
                  </Code>
                </Box>
              </VStack>
            ) : (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>❌ 成功场景测试失败</AlertTitle>
                  <AlertDescription>{successSummary.error}</AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>
        )}

        {/* 失败场景测试结果 */}
        {failureSummary && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              失败场景测试结果
            </Text>
            {failureSummary.success ? (
              <VStack align="stretch" spacing={3}>
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>⚠️ 失败场景摘要生成成功</AlertTitle>
                    <AlertDescription>
                      事件ID: {failureSummary.data?.incident_id} | 
                      执行状态: {failureSummary.data?.summary?.execution_status} | 
                      需要升级: {failureSummary.data?.summary?.escalation_required ? '是' : '否'}
                    </AlertDescription>
                  </Box>
                </Alert>
                {failureSummary.data?.summary?.escalation_contact && (
                  <Box p={3} bg="orange.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>升级联系人:</Text>
                    <Text fontSize="sm">
                      姓名: {failureSummary.data.summary.escalation_contact.contact_name}<br/>
                      角色: {failureSummary.data.summary.escalation_contact.role}<br/>
                      邮箱: {failureSummary.data.summary.escalation_contact.email}<br/>
                      模块: {failureSummary.data.summary.escalation_contact.module}
                    </Text>
                  </Box>
                )}
                {failureSummary.data?.summary?.escalation_email && (
                  <Box p={3} bg="red.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>升级邮件:</Text>
                    <Text fontSize="sm">
                      收件人: {failureSummary.data.summary.escalation_email.to_email}<br/>
                      主题: {failureSummary.data.summary.escalation_email.subject}<br/>
                      优先级: {failureSummary.data.summary.escalation_email.priority}
                    </Text>
                  </Box>
                )}
              </VStack>
            ) : (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>❌ 失败场景测试失败</AlertTitle>
                  <AlertDescription>{failureSummary.error}</AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>
        )}

        {/* 测试总结 */}
        {(serviceStatus || successSummary || failureSummary) && (
          <Box>
            <Divider mb={3} />
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              测试总结
            </Text>
            <HStack spacing={3}>
              <Badge colorScheme={serviceStatus?.success ? "green" : serviceStatus?.success === false ? "red" : "gray"}>
                服务状态: {serviceStatus ? (serviceStatus.success ? "通过" : "失败") : "未测试"}
              </Badge>
              <Badge colorScheme={successSummary?.success ? "green" : successSummary?.success === false ? "red" : "gray"}>
                成功场景: {successSummary ? (successSummary.success ? "通过" : "失败") : "未测试"}
              </Badge>
              <Badge colorScheme={failureSummary?.success ? "green" : failureSummary?.success === false ? "red" : "gray"}>
                失败场景: {failureSummary ? (failureSummary.success ? "通过" : "失败") : "未测试"}
              </Badge>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
