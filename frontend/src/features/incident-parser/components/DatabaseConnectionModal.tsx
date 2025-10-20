import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { testDatabaseConnection, configureDatabase } from '../../../services/api';
import { DatabaseConfigRequest } from '../../../types/api';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
}

const MotionBox = motion(Box);

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess
}) => {
  const [formData, setFormData] = React.useState<DatabaseConfigRequest>({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appdb',
    port: 3306
  });
  
  const [isTesting, setIsTesting] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');

  const handleInputChange = (field: keyof DatabaseConfigRequest, value: string | number) => {
    setFormData((prev: DatabaseConfigRequest) => ({
      ...prev,
      [field]: value
    }));
    // Clear previous test results
    setTestResult(null);
    setError(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setError(null);
    
    try {
      const result = await testDatabaseConnection(formData);
      setTestResult(result);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const result = await configureDatabase(formData);
      
      if (result.success) {
        onConnectionSuccess?.();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'appdb',
      port: 3306
    });
    setTestResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <HStack>
            <Text fontSize="lg" fontWeight="bold">🗄️ Database Connection Configuration</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Connection Form */}
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Host Address</FormLabel>
                <Input
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="localhost"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Port</FormLabel>
                <Input
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 3306)}
                  placeholder="3306"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Username</FormLabel>
                <Input
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  placeholder="root"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Password</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter database password"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Database Name</FormLabel>
                <Input
                  value={formData.database}
                  onChange={(e) => handleInputChange('database', e.target.value)}
                  placeholder="appdb"
                  size="sm"
                />
              </FormControl>
            </VStack>

            {/* Test Connection Button */}
            <HStack justify="center" pt={2}>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={handleTestConnection}
                isLoading={isTesting}
                loadingText="Testing..."
                leftIcon={isTesting ? undefined : <Text>🔍</Text>}
                size="sm"
              >
                Test Connection
              </Button>
            </HStack>

            {/* Test Result */}
            {testResult && (
              <MotionBox
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {testResult.success ? (
                  <Alert status="success">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Connection Test Successful!</AlertTitle>
                      <AlertDescription fontSize="xs">
                        <VStack align="start" spacing={1} mt={1}>
                          <Text>Database: {testResult.database_info?.current_database}</Text>
                          <Text>User: {testResult.database_info?.current_user}</Text>
                          <Text>Version: {testResult.database_info?.mysql_version}</Text>
                          {testResult.database_info?.tables && (
                            <Text>Table Count: {testResult.database_info.tables.length}</Text>
                          )}
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : (
                  <Alert status="error">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Connection Test Failed</AlertTitle>
                      <AlertDescription fontSize="xs">
                        {testResult.message}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </MotionBox>
            )}

            {/* Error Message */}
            {error && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Error</AlertTitle>
                  <AlertDescription fontSize="xs">
                    {error}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleConnect}
              isLoading={isConnecting}
              loadingText="Connecting..."
              isDisabled={!testResult?.success}
              size="sm"
            >
              Confirm Connection
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DatabaseConnectionModal;
