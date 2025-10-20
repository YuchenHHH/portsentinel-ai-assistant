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

interface ContinueExecutionProps {
  stateToken: string;
  stepDescription: string;
  toolOutput: string;
  onContinue: (stateToken: string) => Promise<void>;
}

/**
 * Continue Execution component - displays step completion and continue button
 */
const ContinueExecution: React.FC<ContinueExecutionProps> = ({
  stateToken,
  stepDescription,
  toolOutput,
  onContinue,
}) => {
  const bgColor = useColorModeValue('green.50', 'green.900');
  const borderColor = useColorModeValue('green.200', 'green.700');
  const textColor = useColorModeValue('green.800', 'green.100');
  const whiteBg = useColorModeValue('white', 'gray.800');
  const grayBorder = useColorModeValue('gray.200', 'gray.600');
  const grayText = useColorModeValue('gray.700', 'gray.300');

  const handleContinue = async () => {
    try {
      await onContinue(stateToken);
    } catch (error) {
      console.error('Continue execution failed:', error);
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
          <Badge colorScheme="green" mb={2}>
            Step Completed
          </Badge>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {stepDescription}
          </Text>
        </Box>

        <Divider />

        {/* Tool Output */}
        {toolOutput && (
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={1}>
              Execution Result:
            </Text>
            <Box
              p={2}
              bg={whiteBg}
              borderRadius="sm"
              borderWidth="1px"
              borderColor={grayBorder}
            >
              <Text fontSize="xs" fontFamily="mono" color={grayText}>
                {toolOutput}
              </Text>
            </Box>
          </Box>
        )}

        {/* Continue Button */}
        <Button
          colorScheme="green"
          size="sm"
          rightIcon={<ChevronRightIcon />}
          onClick={handleContinue}
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          }}
          transition="all 0.2s"
        >
          Continue Next Step
        </Button>
      </VStack>
    </Box>
  );
};

export default ContinueExecution;
