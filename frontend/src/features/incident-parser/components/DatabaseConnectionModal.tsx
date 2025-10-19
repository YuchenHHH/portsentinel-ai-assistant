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
  Badge,
  useColorModeValue,
  Spinner,
  Box,
  Divider
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
  const [formData, setFormData] = useState<DatabaseConfigRequest>({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appdb',
    port: 3306
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleInputChange = (field: keyof DatabaseConfigRequest, value: string | number) => {
    setFormData((prev: DatabaseConfigRequest) => ({
      ...prev,
      [field]: value
    }));
    // 清除之前的测试结果
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
            <Text fontSize="lg" fontWeight="bold">🗄️ 数据库连接配置</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* 连接表单 */}
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">主机地址</FormLabel>
                <Input
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="localhost"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">端口</FormLabel>
                <Input
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 3306)}
                  placeholder="3306"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">用户名</FormLabel>
                <Input
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  placeholder="root"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">密码</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="请输入数据库密码"
                  size="sm"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">数据库名称</FormLabel>
                <Input
                  value={formData.database}
                  onChange={(e) => handleInputChange('database', e.target.value)}
                  placeholder="appdb"
                  size="sm"
                />
              </FormControl>
            </VStack>

            {/* 测试连接按钮 */}
            <HStack justify="center" pt={2}>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={handleTestConnection}
                isLoading={isTesting}
                loadingText="测试中..."
                leftIcon={isTesting ? undefined : <Text>🔍</Text>}
                size="sm"
              >
                测试连接
              </Button>
            </HStack>

            {/* 测试结果 */}
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
                      <AlertTitle fontSize="sm">连接测试成功！</AlertTitle>
                      <AlertDescription fontSize="xs">
                        <VStack align="start" spacing={1} mt={1}>
                          <Text>数据库: {testResult.database_info?.current_database}</Text>
                          <Text>用户: {testResult.database_info?.current_user}</Text>
                          <Text>版本: {testResult.database_info?.mysql_version}</Text>
                          {testResult.database_info?.tables && (
                            <Text>表数量: {testResult.database_info.tables.length}</Text>
                          )}
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : (
                  <Alert status="error">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">连接测试失败</AlertTitle>
                      <AlertDescription fontSize="xs">
                        {testResult.message}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </MotionBox>
            )}

            {/* 错误信息 */}
            {error && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">错误</AlertTitle>
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
              取消
            </Button>
            <Button
              colorScheme="green"
              onClick={handleConnect}
              isLoading={isConnecting}
              loadingText="连接中..."
              isDisabled={!testResult?.success}
              size="sm"
            >
              确认连接
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DatabaseConnectionModal;
