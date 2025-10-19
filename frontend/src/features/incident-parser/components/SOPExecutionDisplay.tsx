import React from 'react';
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
  useColorModeValue
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

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
}

const MotionBox = motion(Box);

const SOPExecutionDisplay: React.FC<SOPExecutionDisplayProps> = ({ executionData }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const headerBg = useColorModeValue('blue.50', 'blue.900');


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
      </VStack>
    </MotionBox>
  );
};

export default SOPExecutionDisplay;
