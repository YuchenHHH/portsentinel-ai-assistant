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
        {/* Header Information */}
        <Box bg={headerBg} p={4} borderRadius="md">
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="lg" fontWeight="bold" color="blue.800">
              📋 Execution Plan Confirmation
            </Text>
            <Badge colorScheme="blue" fontSize="sm">
              {plan.length} Steps
            </Badge>
          </HStack>
          <Text fontSize="sm" color="blue.700">
            Please carefully review the following execution plan and click "Start Execution" when ready
          </Text>
        </Box>

        {/* Incident Information Summary */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
            Incident Information:
          </Text>
          <VStack align="stretch" spacing={2} fontSize="sm">
            <HStack>
              <Text fontWeight="medium" minW="80px">Incident ID:</Text>
              <Text color="gray.700">{incidentContext.incident_id || 'N/A'}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" minW="80px">Problem Summary:</Text>
              <Text color="gray.700" fontSize="xs" flex={1}>
                {incidentContext.problem_summary || 'N/A'}
              </Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" minW="80px">Affected Module:</Text>
              <Text color="gray.700">{incidentContext.affected_module || 'N/A'}</Text>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* Execution Plan Steps */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
            Execution Plan Steps:
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

        {/* Important Notice */}
        <Alert status="info" variant="subtle">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Important Notice</AlertTitle>
            <AlertDescription fontSize="xs">
              During execution, if high-risk operations (such as deletion or data updates) are encountered, the system will pause and wait for your approval.
              Please ensure you have sufficient permissions to execute these operations.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Confirmation Button */}
        <HStack justify="center" pt={2}>
          <Button
            leftIcon={<TriangleUpIcon />}
            colorScheme="green"
            size="lg"
            onClick={handleConfirm}
            isLoading={isProcessing}
            loadingText="Starting..."
            minW="140px"
            fontSize="md"
          >
            Start Execution Plan
          </Button>
        </HStack>
      </VStack>
    </MotionBox>
  );
};

export default PlanConfirmation;
