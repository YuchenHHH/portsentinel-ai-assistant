/**
 * 登录表单组件
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  IconButton,
  Divider,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequest } from '../../types/auth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(formData);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box
      bg={bgColor}
      p={8}
      borderRadius="xl"
      boxShadow="xl"
      border="1px"
      borderColor={borderColor}
      w="100%"
      maxW="400px"
    >
      <VStack spacing={6}>
        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
          登录到 PortSentinel AI
        </Text>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>邮箱地址</FormLabel>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="请输入您的邮箱"
                size="lg"
                borderRadius="lg"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>密码</FormLabel>
              <InputGroup size="lg">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入您的密码"
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="100%"
              isLoading={isLoading}
              loadingText="登录中..."
              borderRadius="lg"
            >
              登录
            </Button>
          </VStack>
        </form>

        <Divider />

        <Text fontSize="sm" color="gray.600" textAlign="center">
          还没有账户？{' '}
          <Button
            variant="link"
            colorScheme="blue"
            onClick={onSwitchToRegister}
            size="sm"
          >
            立即注册
          </Button>
        </Text>
      </VStack>
    </Box>
  );
};
