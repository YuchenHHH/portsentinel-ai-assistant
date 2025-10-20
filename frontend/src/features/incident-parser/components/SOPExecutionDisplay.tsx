import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  useColorModeValue,
  Button
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { generateExecutionSummary, getLatestSummaryMarkdown } from '../../../services/executionSummaryApi';
import MarkdownRenderer from '../../../components/MarkdownRenderer';

interface SOPExecutionDisplayProps {
  executionData: {
    status: 'in_progress' | 'needs_approval' | 'failed' | 'completed';
    step: number;
    step_description: string;
    tool_output?: string;
    state_token?: string;
    message?: string;
    agent_thoughts?: string;
    tool_calls?: string;
    completed_steps?: Array<{
      step: number;
      step_description: string;
      tool_output: string;
      agent_thoughts?: string;
      tool_calls?: string;
      status: string;
    }>;
  };
  incidentId?: string;
}

const MotionBox = motion(Box);

const SOPExecutionDisplay: React.FC<SOPExecutionDisplayProps> = ({ executionData, incidentId }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string>('');

  // 生成执行摘要
  const handleGenerateSummary = async () => {
    if (!incidentId || !executionData.completed_steps) return;
    
    setIsLoadingSummary(true);
    try {
      const result = await generateExecutionSummary(incidentId, {
        execution_status: executionData.status === 'completed' ? 'completed' : 'failed',
        execution_notes: executionData.message || 'SOP execution completed',
        total_execution_time_hours: executionData.completed_steps.length * 0.5, // 估算时间
        completed_steps: executionData.completed_steps
      });
      
      setSummaryData(result.summary);
      setShowSummary(true);
      
      // 获取最新的 Markdown 内容 - 添加延迟确保 Agent 4 完成摘要生成
      try {
        // 等待 1 秒确保文件写入完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        const markdownResult = await getLatestSummaryMarkdown();
        setMarkdownContent(markdownResult.markdown_content);
      } catch (markdownError: any) {
        console.error('获取最新 Markdown 内容失败:', markdownError);
      }
    } catch (error: any) {
      console.error('生成摘要失败:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '执行中';
      case 'needs_approval':
        return '等待批准';
      case 'failed':
        return '执行失败';
      case 'completed':
        return '执行完成';
      default:
        return '未知状态';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '⏳';
      case 'needs_approval':
        return '⚠️';
      case 'failed':
        return '❌';
      case 'completed':
        return '✅';
      default:
        return '❓';
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      boxShadow="sm"
    >
      <VStack align="stretch" spacing={4}>
        {/* 状态头部 */}
        <Box bg={headerBg} p={3} borderRadius="md">
          <HStack justify="space-between" align="center">
            <HStack spacing={2}>
              <Text fontSize="lg">{getStatusIcon(executionData.status)}</Text>
              <Text fontSize="md" fontWeight="semibold">
                SOP 执行状态
              </Text>
              <Badge colorScheme={
                executionData.status === 'needs_approval' ? 'orange' :
                executionData.status === 'completed' ? 'green' :
                executionData.status === 'failed' ? 'red' : 'blue'
              }>
                {getStatusText(executionData.status)}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              步骤 {executionData.step + 1}
            </Text>
          </HStack>
        </Box>

        {/* 步骤描述 */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
            当前步骤:
          </Text>
          <Text fontSize="md" color="gray.800">
            {executionData.step_description}
          </Text>
        </Box>

        {/* Agent思考过程 */}
        {executionData.agent_thoughts && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="blue.600" mb={2}>
              🤔 Agent思考过程:
            </Text>
            <Box 
              fontSize="xs" 
              p={3} 
              bg="blue.50" 
              color="blue.800" 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderLeftColor="blue.400"
              whiteSpace="pre-wrap"
              fontFamily="mono"
            >
              {executionData.agent_thoughts}
            </Box>
          </Box>
        )}

        {/* Agent工具调用 */}
        {executionData.tool_calls && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="green.600" mb={2}>
              🔧 Agent执行指令:
            </Text>
            <Box 
              fontSize="xs" 
              p={3} 
              bg="green.50" 
              color="green.800" 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderLeftColor="green.400"
              whiteSpace="pre-wrap"
              fontFamily="mono"
            >
              {executionData.tool_calls}
            </Box>
          </Box>
        )}

        {/* 进度条 (仅在执行中时显示) */}
        {executionData.status === 'in_progress' && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">执行进度</Text>
              <Text fontSize="sm" color="gray.600">进行中...</Text>
            </HStack>
            <Progress
              value={undefined}
              colorScheme="blue"
              size="sm"
              isIndeterminate
            />
          </Box>
        )}

        {/* 状态消息 */}
        {executionData.message && (
          <Alert status={
            executionData.status === 'needs_approval' ? 'warning' :
            executionData.status === 'completed' ? 'success' :
            executionData.status === 'failed' ? 'error' : 'info'
          }>
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">
                {executionData.status === 'needs_approval' ? '需要人工批准' : 
                 executionData.status === 'completed' ? '执行完成' :
                 executionData.status === 'failed' ? '执行失败' : '执行中'}
              </AlertTitle>
              <AlertDescription fontSize="sm">
                {executionData.message}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* 已完成的步骤历史 */}
        {executionData.completed_steps && executionData.completed_steps.length > 0 && (
          <>
            <Divider />
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                已完成步骤:
              </Text>
              <VStack align="stretch" spacing={3}>
                {executionData.completed_steps.map((completedStep, index) => (
                  <Box
                    key={index}
                    p={3}
                    bg="green.50"
                    borderRadius="md"
                    border="1px"
                    borderColor="green.200"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="green.700">
                        步骤 {completedStep.step + 1}
                      </Text>
                      <Badge colorScheme="green" size="sm">
                        ✓ 已完成
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.700" mb={2}>
                      {completedStep.step_description}
                    </Text>
                    {completedStep.tool_output && (
                      <Code
                        display="block"
                        whiteSpace="pre-wrap"
                        p={2}
                        borderRadius="sm"
                        bg="white"
                        color="gray.800"
                        fontSize="xs"
                        maxH="100px"
                        overflowY="auto"
                      >
                        {completedStep.tool_output}
                      </Code>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          </>
        )}

        {/* 当前步骤的工具输出 */}
        {executionData.tool_output && (
          <>
            <Divider />
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                当前步骤执行结果:
              </Text>
              <Code
                display="block"
                whiteSpace="pre-wrap"
                p={3}
                borderRadius="md"
                bg="gray.50"
                color="gray.800"
                fontSize="xs"
                maxH="200px"
                overflowY="auto"
              >
                {executionData.tool_output}
              </Code>
            </Box>
          </>
        )}

        {/* 状态令牌 (调试用) */}
        {executionData.state_token && process.env.NODE_ENV === 'development' && (
          <>
            <Divider />
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                状态令牌 (调试):
              </Text>
              <Code fontSize="xs" colorScheme="gray">
                {executionData.state_token}
              </Code>
            </Box>
          </>
        )}

        {/* 执行摘要生成按钮 (仅在完成时显示) */}
        {executionData.status === 'completed' && incidentId && !showSummary && (
          <>
            <Divider />
            <Box textAlign="center">
              <Button
                colorScheme="purple"
                size="md"
                onClick={handleGenerateSummary}
                isLoading={isLoadingSummary}
                loadingText="生成摘要中..."
                leftIcon={<span>📋</span>}
              >
                生成执行摘要
              </Button>
            </Box>
          </>
        )}

        {/* 执行摘要显示 */}
        {showSummary && summaryData && (
          <>
            <Divider />
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="purple.700">
                📋 执行摘要
              </Text>
              <Box p={4} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.200">
                <VStack align="stretch" spacing={3}>
                  {/* 基本信息 */}
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      解析结果:
                    </Text>
                    <Badge colorScheme={summaryData.resolution_outcome === 'SUCCESS' ? 'green' : 'orange'}>
                      {summaryData.resolution_outcome}
                    </Badge>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      升级状态:
                    </Text>
                    <Badge colorScheme={summaryData.escalation_required ? 'orange' : 'green'}>
                      {summaryData.escalation_required ? '需要升级' : '无需升级'}
                    </Badge>
                  </HStack>

                  {/* 错误详情 */}
                  {summaryData.error_identified && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        识别的错误:
                      </Text>
                      <Text fontSize="sm" color="gray.700" p={2} bg="white" borderRadius="md">
                        {summaryData.error_identified}
                      </Text>
                    </Box>
                  )}

                  {summaryData.root_cause && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        根本原因:
                      </Text>
                      <Text fontSize="sm" color="gray.700" p={2} bg="white" borderRadius="md">
                        {summaryData.root_cause}
                      </Text>
                    </Box>
                  )}

                  {/* L2 团队备注 */}
                  {summaryData.l2_team_notes && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        L2 团队备注:
                      </Text>
                      <Text fontSize="sm" color="gray.700" p={2} bg="white" borderRadius="md">
                        {summaryData.l2_team_notes}
                      </Text>
                    </Box>
                  )}

                  {/* 摘要文件路径 */}
                  {summaryData.summary_path && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        摘要文件:
                      </Text>
                      <Code fontSize="xs" colorScheme="gray" p={2} display="block">
                        {summaryData.summary_path.split('/').pop()}
                      </Code>
                    </Box>
                  )}

                  {/* Markdown 内容显示 */}
                  {markdownContent && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                        📄 详细摘要内容:
                      </Text>
                      <MarkdownRenderer 
                        content={markdownContent}
                        maxHeight="600px"
                      />
                    </Box>
                  )}
                </VStack>
              </Box>
            </Box>
          </>
        )}
      </VStack>
    </MotionBox>
  );
};

export default SOPExecutionDisplay;
