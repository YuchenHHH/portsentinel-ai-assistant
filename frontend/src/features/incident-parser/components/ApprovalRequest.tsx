import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Badge,
  Divider,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, WarningIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

interface ApprovalRequestProps {
  stateToken: string;
  query: string;
  stepDescription: string;
  onApprove: (stateToken: string, approvedQuery: string) => Promise<void>;
  onReject: (stateToken: string) => Promise<void>;
  isProcessing?: boolean;
}

const MotionBox = motion(Box);

const ApprovalRequest: React.FC<ApprovalRequestProps> = ({
  stateToken,
  query,
  stepDescription,
  onApprove,
  onReject,
  isProcessing = false
}) => {
  const [approvedQuery, setApprovedQuery] = useState(query);
  const [approvalComment, setApprovalComment] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('red.200', 'red.700');
  const headerBg = useColorModeValue('red.50', 'red.900');

  const handleApprove = async () => {
    await onApprove(stateToken, approvedQuery);
    onClose();
  };

  const handleReject = async () => {
    await onReject(stateToken);
    onClose();
  };

  return (
    <>
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
          bg: 'red.400',
          borderRadius: 'lg 0 0 0'
        }}
      >
        {/* 头部警告 */}
        <Box bg={headerBg} p={4} borderRadius="md" mb={4}>
          <Alert status="warning" variant="subtle">
            <WarningIcon boxSize="20px" />
            <Box ml={3}>
              <AlertTitle>高危操作需要人工批准</AlertTitle>
              <AlertDescription>
                以下操作将修改数据库，请仔细审查后决定是否批准执行。
              </AlertDescription>
            </Box>
          </Alert>
        </Box>

        <VStack align="stretch" spacing={4}>
          {/* 步骤描述 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              执行步骤:
            </Text>
            <Text fontSize="md" fontWeight="semibold" color="gray.800">
              {stepDescription}
            </Text>
          </Box>

          <Divider />

          {/* SQL 查询 */}
          <Box>
            <HStack mb={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                SQL 查询语句:
              </Text>
              <Badge colorScheme="red" fontSize="xs">
                高危操作
              </Badge>
            </HStack>
            <Code
              display="block"
              whiteSpace="pre-wrap"
              p={3}
              borderRadius="md"
              bg="gray.50"
              color="gray.800"
              fontSize="sm"
              maxH="200px"
              overflowY="auto"
            >
              {query}
            </Code>
          </Box>

          {/* 操作按钮 */}
          <HStack justify="center" spacing={4} pt={2}>
            <Button
              leftIcon={<CheckIcon />}
              colorScheme="green"
              size="lg"
              onClick={onOpen}
              isLoading={isProcessing}
              loadingText="处理中..."
              minW="120px"
            >
              批准执行
            </Button>
            <Button
              leftIcon={<CloseIcon />}
              colorScheme="red"
              variant="outline"
              size="lg"
              onClick={handleReject}
              isLoading={isProcessing}
              loadingText="拒绝中..."
              minW="120px"
            >
              拒绝执行
            </Button>
          </HStack>
        </VStack>
      </MotionBox>

      {/* 批准确认模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>确认批准高危操作</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  您即将批准一个高危数据库操作。请确认您已仔细审查了以下内容：
                </AlertDescription>
              </Alert>

              <Box>
                <Text fontWeight="medium" mb={2}>执行步骤:</Text>
                <Text fontSize="sm" color="gray.600">{stepDescription}</Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>SQL 查询:</Text>
                <Code
                  display="block"
                  whiteSpace="pre-wrap"
                  p={3}
                  borderRadius="md"
                  bg="gray.50"
                  color="gray.800"
                  fontSize="sm"
                  maxH="150px"
                  overflowY="auto"
                >
                  {query}
                </Code>
              </Box>

              <FormControl>
                <FormLabel>批准说明 (可选)</FormLabel>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="请输入批准此操作的原因或说明..."
                  rows={3}
                />
                <FormHelperText>
                  此说明将记录在操作日志中，用于审计追踪。
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button
                colorScheme="green"
                leftIcon={<CheckIcon />}
                onClick={handleApprove}
                isLoading={isProcessing}
                loadingText="批准中..."
              >
                确认批准
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ApprovalRequest;



