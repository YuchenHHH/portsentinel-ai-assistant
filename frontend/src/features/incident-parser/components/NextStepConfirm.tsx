import React from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

interface NextStepConfirmProps {
  stepName: string;
  stepDescription: string;
  parsedResult: any;
  onConfirm: () => Promise<void>;
}

/**
 * Next Step Confirm component - displays step completion and next step confirmation button
 */
const NextStepConfirm: React.FC<NextStepConfirmProps> = ({
  stepName,
  stepDescription,
  parsedResult,
  onConfirm,
}) => {
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const textColor = useColorModeValue('blue.800', 'blue.100');
  const whiteBg = useColorModeValue('white', 'gray.800');
  const grayBorder = useColorModeValue('gray.200', 'gray.600');
  const grayText = useColorModeValue('gray.700', 'gray.300');

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Next step confirmation failed:', error);
    }
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      maxW="100%"
    >
      <VStack align="stretch" spacing={3}>
        {/* Header */}
        <Box>
          <Badge colorScheme="blue" mb={2}>
            {stepName} Completed
          </Badge>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {stepDescription}
          </Text>
        </Box>

        <Divider />

        {/* Parsed Result Summary */}
        {parsedResult && (
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={1}>
              Parsing Results:
            </Text>
            <Box
              p={2}
              bg={whiteBg}
              borderRadius="sm"
              borderWidth="1px"
              borderColor={grayBorder}
            >
              <Text fontSize="xs" color={grayText}>
                <strong>Incident ID:</strong> {parsedResult.incident_id || 'N/A'}
              </Text>
              <Text fontSize="xs" color={grayText}>
                <strong>Problem:</strong> {parsedResult.problem_summary || 'N/A'}
              </Text>
              <Text fontSize="xs" color={grayText}>
                <strong>Module:</strong> {parsedResult.affected_module || 'N/A'}
              </Text>
              <Text fontSize="xs" color={grayText}>
                <strong>Urgency:</strong> {parsedResult.urgency || 'N/A'}
              </Text>
            </Box>
          </Box>
        )}

        {/* Confirm Button */}
        <Button
          colorScheme="blue"
          size="sm"
          rightIcon={<ChevronRightIcon />}
          onClick={handleConfirm}
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          }}
          transition="all 0.2s"
        >
          Continue to Next Step
        </Button>
      </VStack>
    </Box>
  );
};

export default NextStepConfirm;
