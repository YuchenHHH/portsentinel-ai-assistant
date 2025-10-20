/**
 * KnowledgeBase - 知识库管理界面
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Badge,
  Progress,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react';
import {
  AttachmentIcon,
  CheckCircleIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import api from '../../services/api';

interface KnowledgeUploadResult {
  success: boolean;
  message: string;
  data?: {
    totalSOPs: number;
    modules: string[];
    processingTime: number;
    vectorized: boolean;
  };
}

export const KnowledgeBase: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<KnowledgeUploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      if (validateFile(uploadedFile)) {
        setFile(uploadedFile);
        setUploadResult(null);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      if (validateFile(uploadedFile)) {
        setFile(uploadedFile);
        setUploadResult(null);
      }
    }
  };

  const validateFile = (uploadedFile: File): boolean => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(uploadedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only .docx and .doc files are allowed.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (uploadedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'File size cannot exceed 10MB.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a Word document to upload.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<KnowledgeUploadResult>('/api/v1/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
      setUploadResult(response.data);
      toast({
        title: 'Upload successful',
        description: response.data.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || 'An error occurred during upload.',
      });
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'An error occurred during upload.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
    }
  };

  return (
    <Box p={4} h="100%" overflowY="auto">
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={1}>
            Knowledge Base Management
          </Text>
          <Text fontSize="sm" color={textColor}>
            Upload Word documents to automatically convert and vectorize SOP knowledge
          </Text>
        </Box>

        {/* Upload Area */}
        <Card bg={cardBg}>
          <CardBody>
            <VStack spacing={2}>
              <Box
                w="100%"
                h="80px"
                border="2px dashed"
                borderColor={dragActive ? 'blue.400' : borderColor}
                borderRadius="lg"
                bg={dragActive ? 'blue.50' : 'transparent'}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'blue.400',
                  bg: 'blue.50',
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon as={AttachmentIcon} w={5} h={5} color="blue.500" mb={1} />
                <Text fontSize="sm" fontWeight="semibold">
                  Drop Word document here or click to browse
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Supports .docx and .doc files (max 10MB)
                </Text>
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />

              <Button
                colorScheme="blue"
                leftIcon={<AttachmentIcon />}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isDisabled={isUploading}
              >
                Select Word Document
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* File Info and Upload Button */}
        {file && !isUploading && (
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" align="center">
                  <HStack>
                    <Icon as={CheckCircleIcon} color="green.500" />
                    <Text fontWeight="semibold">{file.name}</Text>
                    <Text fontSize="sm" color={textColor}>({(file.size / 1024 / 1024).toFixed(2)} MB)</Text>
                  </HStack>
                  <Button colorScheme="green" onClick={handleUpload} isLoading={isUploading}>
                    Process & Vectorize
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={3}>
                <Text fontWeight="semibold">Processing: {file?.name}</Text>
                <Progress value={uploadProgress} size="lg" colorScheme="blue" w="full" hasStripe isAnimated />
                <Text fontSize="sm" color={textColor}>{uploadProgress}% Complete</Text>
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Processing in progress!</AlertTitle>
                    <AlertDescription>
                      Converting Word document to JSON format and vectorizing for RAG system...
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Icon as={uploadResult.success ? CheckCircleIcon : WarningIcon} 
                        color={uploadResult.success ? 'green.500' : 'red.500'} />
                  <Text fontSize="lg" fontWeight="bold" 
                        color={uploadResult.success ? 'green.600' : 'red.600'}>
                    {uploadResult.success ? 'Processing Successful!' : 'Processing Failed!'}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={textColor}>{uploadResult.message}</Text>
                
                {uploadResult.success && uploadResult.data && (
                  <VStack spacing={3} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xs">Total SOPs</StatLabel>
                        <StatNumber fontSize="lg" color="blue.500">
                          {uploadResult.data.totalSOPs}
                        </StatNumber>
                        <StatHelpText fontSize="xs">SOPs processed</StatHelpText>
                      </Stat>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xs">Modules</StatLabel>
                        <StatNumber fontSize="lg" color="green.500">
                          {uploadResult.data.modules.length}
                        </StatNumber>
                        <StatHelpText fontSize="xs">Different modules</StatHelpText>
                      </Stat>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xs">Vectorized</StatLabel>
                        <StatNumber fontSize="lg" color={uploadResult.data.vectorized ? "green.500" : "red.500"}>
                          {uploadResult.data.vectorized ? "Yes" : "No"}
                        </StatNumber>
                        <StatHelpText fontSize="xs">Ready for RAG</StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    <Divider />

                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>Modules Found:</Text>
                      <HStack spacing={1} flexWrap="wrap">
                        {uploadResult.data.modules.map((module, index) => (
                          <Badge key={index} colorScheme="blue" variant="subtle" size="sm">
                            {module}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>

                    <Alert status={uploadResult.data.vectorized ? "success" : "warning"}>
                      <AlertIcon />
                      <Box>
                        <AlertTitle>
                          {uploadResult.data.vectorized ? "Knowledge Base Ready!" : "Vectorization Pending"}
                        </AlertTitle>
                        <AlertDescription>
                          {uploadResult.data.vectorized 
                            ? "Your knowledge base has been successfully vectorized and is ready for RAG queries."
                            : "The document has been converted to JSON format. Vectorization may take additional time."
                          }
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Instructions */}
        <Card bg={cardBg}>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="md" fontWeight="bold" color="blue.600">
                📋 How it works
              </Text>
              <VStack spacing={2} align="start">
                <Text fontSize="sm" color={textColor}>
                  • Upload a Word document containing SOP procedures
                </Text>
                <Text fontSize="sm" color={textColor}>
                  • The system automatically converts it to structured JSON format
                </Text>
                <Text fontSize="sm" color={textColor}>
                  • Knowledge is vectorized and integrated into the RAG system
                </Text>
                <Text fontSize="sm" color={textColor}>
                  • SOPs become available for AI-powered incident response
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};
