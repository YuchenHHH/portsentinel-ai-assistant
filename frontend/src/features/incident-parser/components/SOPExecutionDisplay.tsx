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
  onContinue?: (stateToken: string) => Promise<void>;
}

const MotionBox = motion(Box);

const SOPExecutionDisplay: React.FC<SOPExecutionDisplayProps> = ({ executionData, incidentId, onContinue }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string>('');

  // Generate Summary
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
        return 'in_progress';
      case 'needs_approval':
        return 'needs_approval';
      case 'failed':
        return 'failed';
      case 'completed':
        return 'completed';
      default:
        return 'unknown';
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
        {/* Header */}
        <Box bg={headerBg} p={3} borderRadius="md">
          <HStack justify="space-between" align="center">
            <HStack spacing={2}>
              <Text fontSize="lg">{getStatusIcon(executionData.status)}</Text>
              <Text fontSize="md" fontWeight="semibold">
                SOP Execute State
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
              Step {executionData.step + 1}
            </Text>
          </HStack>
        </Box>

        {/* Step Description */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
            Current State:
          </Text>
          <Text fontSize="md" color="gray.800">
            {executionData.step_description}
          </Text>
        </Box>

        {/* Agent Thoughts */}
        {executionData.agent_thoughts && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="blue.600" mb={2}>
              🤔 Agent Thinking:
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

        {/* Agent Tool Calls */}
        {executionData.tool_calls && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="green.600" mb={2}>
              🔧 Agent Execute:
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

        {/* Progress (only during in_progress) */}
        {executionData.status === 'in_progress' && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600"></Text>
              <Text fontSize="sm" color="gray.600"></Text>
            </HStack>
            <Progress
              value={undefined}
              colorScheme="blue"
              size="sm"
              isIndeterminate
            />
          </Box>
        )}

        {/* Status Message */}
        {executionData.message && (
          <Alert status={
            executionData.status === 'needs_approval' ? 'warning' :
            executionData.status === 'completed' ? 'success' :
            executionData.status === 'failed' ? 'error' : 'info'
          }>
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">
                {executionData.status === 'needs_approval' ? 'Needs Approval' : 
                 executionData.status === 'completed' ? 'Completed' :
                 executionData.status === 'failed' ? 'Failed' : 'Executing'}
              </AlertTitle>
              <AlertDescription fontSize="sm">
                {executionData.message}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Finished Steps */}
        {executionData.completed_steps && executionData.completed_steps.length > 0 && (
          <>
            <Divider />
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                Finished Steps:
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
                        Step {completedStep.step + 1}
                      </Text>
                      <Badge colorScheme="green" size="sm">
                        ✓ Completed
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

        {/* Current Step Tool Output */}
        {executionData.tool_output && (
          <>
            <Divider />
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                Current Output:
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

        {/* State Token (dev only) */}
        {executionData.state_token && process.env.NODE_ENV === 'development' && (
          <>
            <Divider />
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
              </Text>
              <Code fontSize="xs" colorScheme="gray">
                {executionData.state_token}
              </Code>
            </Box>
          </>
        )}

        {/* Generate Summary button removed */}

        {/* Execution Summary */}
        {showSummary && summaryData && (
          <>
            <Divider />
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="purple.700">
                📋 Execution Summary
              </Text>
              <Box p={4} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.200">
                <VStack align="stretch" spacing={3}>
                  {/* Basic Info */}
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Outcome:
                    </Text>
                    <Badge colorScheme={summaryData.resolution_outcome === 'SUCCESS' ? 'green' : 'orange'}>
                      {summaryData.resolution_outcome}
                    </Badge>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      Escalation:
                    </Text>
                    <Badge colorScheme={summaryData.escalation_required ? 'orange' : 'green'}>
                      {summaryData.escalation_required ? 'Required' : 'Not Required'}
                    </Badge>
                  </HStack>

                  {/* Error Details */}
                  {summaryData.error_identified && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        Identified Error:
                      </Text>
                      <Text fontSize="sm" color="gray.700" p={2} bg="white" borderRadius="md">
                        {summaryData.error_identified}
                      </Text>
                    </Box>
                  )}

                  {summaryData.root_cause && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        Root Cause:
                      </Text>
                      <Text fontSize="sm" color="gray.700" p={2} bg="white" borderRadius="md">
                        {summaryData.root_cause}
                      </Text>
                    </Box>
                  )}

                  {/* L2 Team Notes */}
                  {summaryData.l2_team_notes && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        L2 Team Notes:
                      </Text>
                      <Text fontSize="sm" color="gray.700" p={2} bg="white" borderRadius="md">
                        {summaryData.l2_team_notes}
                      </Text>
                    </Box>
                  )}

                  {/* Summary File */}
                  {summaryData.summary_path && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                        Summary File:
                      </Text>
                      <Code fontSize="xs" colorScheme="gray" p={2} display="block">
                        {summaryData.summary_path.split('/').pop()}
                      </Code>
                    </Box>
                  )}

                  {/* Markdown Content */}
                  {markdownContent && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                        📄 Detailed Summary:
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
