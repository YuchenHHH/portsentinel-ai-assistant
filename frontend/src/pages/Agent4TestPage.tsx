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
  useColorModeValue,
  Container,
  Heading
} from '@chakra-ui/react';
import { generateExecutionSummary, getSummaryServiceStatus } from '../services/executionSummaryApi';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const Agent4TestPage: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<TestResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<TestResult | null>(null);
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

  const handleTestSummaryGeneration = async () => {
    setIsLoading(true);
    try {
      const result = await generateExecutionSummary('FRONTEND-TEST-001', {
        execution_status: 'completed',
        execution_notes: 'Frontend integration test successful',
        total_execution_time_hours: 2.0,
        completed_steps: [
          {
            step: 0,
            step_description: 'Query container data',
            tool_output: 'Successfully retrieved data',
            status: 'completed'
          },
          {
            step: 1,
            step_description: 'Update container status',
            tool_output: 'Status updated successfully',
            status: 'completed'
          }
        ]
      });
      setSummaryResult({ success: true, data: result });
    } catch (error: any) {
      setSummaryResult({ success: false, error: error.message });
    }
    setIsLoading(false);
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Agent 4 集成测试页面
          </Heading>
          <Text color="gray.600">
            测试 Agent 4 执行摘要生成功能
          </Text>
        </Box>

        <Box p={6} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="lg" fontWeight="semibold">
              测试控制面板
            </Text>
            
            <HStack spacing={3}>
              <Button
                colorScheme="blue"
                onClick={handleTestServiceStatus}
                isLoading={isLoading}
                loadingText="测试中..."
                size="md"
              >
                测试服务状态
              </Button>
              <Button
                colorScheme="green"
                onClick={handleTestSummaryGeneration}
                isLoading={isLoading}
                loadingText="测试中..."
                size="md"
              >
                测试摘要生成
              </Button>
            </HStack>

            {/* 服务状态测试结果 */}
            {serviceStatus && (
              <Box>
                <Text fontSize="md" fontWeight="medium" mb={2}>
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

            {/* 摘要生成测试结果 */}
            {summaryResult && (
              <Box>
                <Text fontSize="md" fontWeight="medium" mb={2}>
                  摘要生成测试结果
                </Text>
                {summaryResult.success ? (
                  <Alert status="success">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>✅ 摘要生成成功</AlertTitle>
                      <AlertDescription>
                        事件ID: {summaryResult.data?.incident_id} | 
                        执行状态: {summaryResult.data?.summary?.execution_status} | 
                        需要升级: {summaryResult.data?.summary?.escalation_required ? '是' : '否'} |
                        摘要文件: {summaryResult.data?.summary?.summary_path}
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : (
                  <Alert status="error">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>❌ 摘要生成失败</AlertTitle>
                      <AlertDescription>{summaryResult.error}</AlertDescription>
                    </Box>
                  </Alert>
                )}
              </Box>
            )}

            {/* 测试总结 */}
            {(serviceStatus || summaryResult) && (
              <Box>
                <Text fontSize="md" fontWeight="medium" mb={2}>
                  测试总结
                </Text>
                <HStack spacing={3}>
                  <Badge 
                    colorScheme={serviceStatus?.success ? "green" : serviceStatus?.success === false ? "red" : "gray"}
                    size="lg"
                  >
                    服务状态: {serviceStatus ? (serviceStatus.success ? "通过" : "失败") : "未测试"}
                  </Badge>
                  <Badge 
                    colorScheme={summaryResult?.success ? "green" : summaryResult?.success === false ? "red" : "gray"}
                    size="lg"
                  >
                    摘要生成: {summaryResult ? (summaryResult.success ? "通过" : "失败") : "未测试"}
                  </Badge>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>

        <Box p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" color="gray.600">
            💡 提示: 这个页面用于测试 Agent 4 集成功能。点击按钮测试服务状态和摘要生成功能。
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default Agent4TestPage;
