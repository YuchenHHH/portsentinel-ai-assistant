/**
 * Data Upload Component - 历史数据上传组件
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  useToast,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  AttachmentIcon,
  CheckIcon,
  WarningIcon,
  DownloadIcon,
  ViewIcon,
} from '@chakra-ui/icons';

interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    totalCases: number;
    moduleStats: Record<string, number>;
    ediStats: Record<string, number>;
    sampleCases: Array<{
      id: string;
      module: string;
      problem: string;
      solution: string;
    }>;
  };
}

export const DataUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid File Format',
        description: 'Please select an Excel file (.xlsx or .xls)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch('/api/v1/data/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);

      toast({
        title: 'Upload Successful',
        description: `Successfully processed ${result.data?.totalCases || 0} cases`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <Box p={4} h="100%" overflowY="auto">
      <VStack spacing={3} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="md" fontWeight="bold" mb={0}>
            Historical Data Upload
          </Text>
          <Text fontSize="xs" color={textColor}>
            Upload Excel files containing historical case data for AI analysis and matching
          </Text>
        </Box>

        {/* Upload Area */}
        <Card bg={cardBg}>
          <CardBody>
            <VStack spacing={1}>
              <Box
                w="100%"
                h="60px"
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
                <Icon as={AttachmentIcon} w={4} h={4} color="blue.500" mb={0} />
                <Text fontSize="xs" fontWeight="semibold">
                  Drop Excel file here or click to browse
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Supports .xlsx and .xls files (max 10MB)
                </Text>
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
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
                Select File
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Upload Progress */}
        {isUploading && (
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={3}>
                <HStack w="100%" justify="space-between">
                  <Text fontWeight="semibold">Processing file...</Text>
                  <Text fontSize="sm" color={textColor}>
                    {Math.round(uploadProgress)}%
                  </Text>
                </HStack>
                <Progress
                  value={uploadProgress}
                  w="100%"
                  colorScheme="blue"
                  size="sm"
                  borderRadius="md"
                />
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <VStack spacing={4} align="stretch">
            {/* Success/Error Alert */}
            <Alert
              status={uploadResult.success ? 'success' : 'error'}
              borderRadius="md"
            >
              <AlertIcon />
              <Box>
                <AlertTitle>
                  {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                </AlertTitle>
                <AlertDescription>
                  {uploadResult.message}
                </AlertDescription>
              </Box>
            </Alert>

            {/* Statistics */}
            {uploadResult.success && uploadResult.data && (
              <Card bg={cardBg}>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="semibold">
                    Upload Statistics
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Summary Stats */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xs">Total Cases</StatLabel>
                        <StatNumber fontSize="lg" color="blue.500">
                          {uploadResult.data.totalCases}
                        </StatNumber>
                        <StatHelpText fontSize="xs">Historical cases processed</StatHelpText>
                      </Stat>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xs">Modules</StatLabel>
                        <StatNumber fontSize="lg" color="green.500">
                          {Object.keys(uploadResult.data.moduleStats).length}
                        </StatNumber>
                        <StatHelpText fontSize="xs">Different modules</StatHelpText>
                      </Stat>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xs">EDI Cases</StatLabel>
                        <StatNumber fontSize="lg" color="purple.500">
                          {uploadResult.data.ediStats.Yes || 0}
                        </StatNumber>
                        <StatHelpText fontSize="xs">EDI-related cases</StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    <Divider />

                    {/* Module Distribution */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>Module Distribution</Text>
                      <HStack spacing={1} flexWrap="wrap">
                        {Object.entries(uploadResult.data.moduleStats).map(([module, count]) => (
                          <Badge key={module} colorScheme="blue" variant="subtle" size="sm" p={1}>
                            {module}: {count}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>

                    {/* Sample Cases */}
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>Sample Cases</Text>
                      <Table size="xs" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>ID</Th>
                            <Th>Module</Th>
                            <Th>Problem</Th>
                            <Th>Solution</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {uploadResult.data.sampleCases.slice(0, 5).map((case_) => (
                            <Tr key={case_.id}>
                              <Td>{case_.id}</Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">
                                  {case_.module}
                                </Badge>
                              </Td>
                              <Td maxW="200px" isTruncated>
                                {case_.problem}
                              </Td>
                              <Td maxW="200px" isTruncated>
                                {case_.solution}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        )}

        {/* Instructions */}
        <Card bg={cardBg}>
          <CardHeader pb={2}>
            <VStack spacing={0} align="start">
              <Text fontSize="md" fontWeight="bold" color="blue.600">
                📋 File Format Requirements
              </Text>
              <Text fontSize="xs" color={textColor}>
                Your Excel file should contain a sheet named <strong>"Cases"</strong> with the following columns:
              </Text>
            </VStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={2} align="stretch">
              <Table size="sm" variant="striped" colorScheme="blue">
                <Thead>
                  <Tr>
                    <Th fontSize="sm" fontWeight="bold">Column Name</Th>
                    <Th fontSize="sm" fontWeight="bold">Description</Th>
                    <Th fontSize="sm" fontWeight="bold" textAlign="center">Required</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td fontWeight="semibold">Module</Td>
                    <Td>Module type (Container, Vessel, EDI/API)</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="red" variant="solid" size="sm">Yes</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Problem Statements</Td>
                    <Td>Problem description</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="red" variant="solid" size="sm">Yes</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Solution</Td>
                    <Td>Solution description</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="red" variant="solid" size="sm">Yes</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Mode</Td>
                    <Td>Operation mode</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="gray" variant="outline" size="sm">Optional</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">EDI?</Td>
                    <Td>Whether EDI related (Yes/No)</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="gray" variant="outline" size="sm">Optional</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">TIMESTAMP</Td>
                    <Td>Case timestamp</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="gray" variant="outline" size="sm">Optional</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Alert / Email</Td>
                    <Td>Alert or email content</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="gray" variant="outline" size="sm">Optional</Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">SOP</Td>
                    <Td>SOP reference</Td>
                    <Td textAlign="center">
                      <Badge colorScheme="gray" variant="outline" size="sm">Optional</Badge>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
              
              <Box bg="blue.50" p={2} borderRadius="md" borderLeft="4px" borderColor="blue.400">
                <VStack spacing={0} align="start">
                  <Text fontSize="xs" fontWeight="semibold" color="blue.700">
                    💡 Important Notes:
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    • The Excel file must have a sheet named exactly <strong>"Cases"</strong>
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    • Column names are case-sensitive and must match exactly
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    • Required columns cannot be empty
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    • File size limit: 10MB maximum
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};
