import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { CheckIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

interface PlanConfirmationProps {
  plan: string[];
  incidentContext: Record<string, any>;
  onConfirm: (plan: string[], incidentContext: Record<string, any>) => Promise<void>;
  isProcessing?: boolean;
}

const MotionBox = motion(Box);

const PlanConfirmation: React.FC<PlanConfirmationProps> = ({
  plan,
  incidentContext,
  onConfirm,
  isProcessing = false
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const headerBg = useColorModeValue('blue.50', 'blue.900');

  const handleConfirm = async () => {
    await onConfirm(plan, incidentContext);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      bg={cardBg}
      border="2px"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      boxShadow="lg"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bg: 'blue.400',
        borderRadius: 'lg 0 0 0'
      }}
    >
      <VStack align="stretch" spacing={4}>
        {/* 头部信息 */}
        <Box bg={headerBg} p={4} borderRadius="md">
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="lg" fontWeight="bold" color="blue.800">
              📋 执行计划确认
            </Text>
            <Badge colorScheme="blue" fontSize="sm">
              {plan.length} 个步骤
            </Badge>
          </HStack>
          <Text fontSize="sm" color="blue.700">
            请仔细审查以下执行计划，确认无误后点击"开始执行"按钮
          </Text>
        </Box>

        {/* 事件信息摘要 */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
            事件信息:
          </Text>
          <VStack align="stretch" spacing={2} fontSize="sm">
            <HStack>
              <Text fontWeight="medium" minW="80px">事件ID:</Text>
              <Text color="gray.700">{incidentContext.incident_id || 'N/A'}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" minW="80px">问题摘要:</Text>
              <Text color="gray.700" fontSize="xs" flex={1}>
                {incidentContext.problem_summary || 'N/A'}
              </Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" minW="80px">影响模块:</Text>
              <Text color="gray.700">{incidentContext.affected_module || 'N/A'}</Text>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* 执行计划步骤 */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
            执行计划步骤:
          </Text>
          <VStack align="stretch" spacing={3} maxH="300px" overflowY="auto">
            {plan.map((step, index) => (
              <Box
                key={index}
                bg="gray.50"
                p={3}
                borderRadius="md"
                border="1px"
                borderColor="gray.200"
                boxShadow="xs"
              >
                <HStack align="start" spacing={3}>
                  <Box
                    bg="blue.400"
                    color="white"
                    borderRadius="full"
                    w={6}
                    h={6}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                    flexShrink={0}
                    mt={0.5}
                  >
                    {index + 1}
                  </Box>
                  <Text fontSize="sm" color="gray.800" lineHeight="1.5" flex={1}>
                    {step}
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* 重要提示 */}
        <Alert status="info" variant="subtle">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">重要提示</AlertTitle>
            <AlertDescription fontSize="xs">
              执行过程中，如果遇到高危操作（如删除、更新数据），系统将暂停并等待您的批准。
              请确保您有足够的权限执行这些操作。
            </AlertDescription>
          </Box>
        </Alert>

        {/* 确认按钮 */}
        <HStack justify="center" pt={2}>
          <Button
            leftIcon={<TriangleUpIcon />}
            colorScheme="green"
            size="lg"
            onClick={handleConfirm}
            isLoading={isProcessing}
            loadingText="开始执行..."
            minW="140px"
            fontSize="md"
          >
            开始执行计划
          </Button>
        </HStack>
      </VStack>
    </MotionBox>
  );
};

export default PlanConfirmation;
