import React from 'react';
import { Box, Button, Text, VStack, useColorModeValue } from '@chakra-ui/react';

interface SummaryGenerationProps {
  incidentId: string;
  completedStepsCount: number;
  executionStatus: string;
  onGenerateSummary: () => Promise<void>;
}

/**
 * Summary Generation component - displays summary generation button after SOP completion
 */
const SummaryGeneration: React.FC<SummaryGenerationProps> = ({
  incidentId,
  completedStepsCount,
  executionStatus,
  onGenerateSummary,
}) => {
  const bgColor = useColorModeValue('green.50', 'green.900');
  const borderColor = useColorModeValue('green.200', 'green.700');
  const textColor = useColorModeValue('green.800', 'green.100');
  const whiteBg = useColorModeValue('white', 'gray.800');
  const grayBorder = useColorModeValue('gray.200', 'gray.600');
  const grayText = useColorModeValue('gray.700', 'gray.300');

  const handleGenerateSummary = async () => {
    try {
      await onGenerateSummary();
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // Optionally, display an error message to the user
    }
  };

  return (
    <VStack
      align="stretch"
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      spacing={3}
    >
      <Text fontSize="md" fontWeight="bold" color={textColor}>
        🎉 SOP Execution Completed Successfully!
      </Text>

      <Box>
        <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={1}>
          Execution Summary:
        </Text>
        <Box
          p={2}
          bg={whiteBg}
          borderRadius="sm"
          borderWidth="1px"
          borderColor={grayBorder}
        >
          <Text fontSize="xs" color={grayText}>
            <strong>Incident ID:</strong> {incidentId || 'N/A'}
          </Text>
          <Text fontSize="xs" color={grayText}>
            <strong>Completed Steps:</strong> {completedStepsCount}
          </Text>
          <Text fontSize="xs" color={grayText}>
            <strong>Status:</strong> {executionStatus}
          </Text>
        </Box>
      </Box>

      <Text fontSize="sm" color={textColor}>
        Ready to generate execution summary and resolution report.
      </Text>

      {/* Generate Summary Button */}
      <Button
        colorScheme="green"
        onClick={handleGenerateSummary}
        size="md"
        alignSelf="flex-end"
      >
        Generate Execution Summary
      </Button>
    </VStack>
  );
};

export default SummaryGeneration;
