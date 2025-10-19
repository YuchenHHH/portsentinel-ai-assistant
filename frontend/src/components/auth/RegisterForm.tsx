/**
 * 注册表单组件
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
import { RegisterRequest } from '../../types/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证密码匹配
    if (formData.password !== confirmPassword) {
      setError('两次输入的密码不匹配');
      return;
    }

    // 验证密码长度
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
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
          注册 PortSentinel AI
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
              <FormLabel>姓名</FormLabel>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入您的姓名"
                size="lg"
                borderRadius="lg"
              />
            </FormControl>

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
                  placeholder="请输入密码（至少6位）"
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

            <FormControl isRequired>
              <FormLabel>确认密码</FormLabel>
              <InputGroup size="lg">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleInputChange}
                  placeholder="请再次输入密码"
                  borderRadius="lg"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                    icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              loadingText="注册中..."
              borderRadius="lg"
            >
              注册
            </Button>
          </VStack>
        </form>

        <Divider />

        <Text fontSize="sm" color="gray.600" textAlign="center">
          已有账户？{' '}
          <Button
            variant="link"
            colorScheme="blue"
            onClick={onSwitchToLogin}
            size="sm"
          >
            立即登录
          </Button>
        </Text>
      </VStack>
    </Box>
  );
};
