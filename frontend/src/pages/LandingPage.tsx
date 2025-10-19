/**
 * 封面页面 - 参考Claude AI agents页面设计
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Image,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Badge,
  Flex,
  Spacer,
  useBreakpointValue,
  Fade,
  ScaleFade,
} from '@chakra-ui/react';
import {
  ChevronRightIcon,
  StarIcon,
  CheckIcon,
  ArrowForwardIcon,
} from '@chakra-ui/icons';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export const LandingPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const textColor = useColorModeValue('gray.800', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const isMobile = useBreakpointValue({ base: true, md: false });

  const features = [
    {
      icon: '🤖',
      title: '智能事件解析',
      description: 'AI驱动的自然语言处理，自动提取关键信息',
    },
    {
      icon: '🔍',
      title: '历史案例匹配',
      description: '基于相似度的历史案例检索，提供参考解决方案',
    },
    {
      icon: '📚',
      title: '知识库检索',
      description: '混合检索技术，精准匹配相关SOP文档',
    },
    {
      icon: '✅',
      title: 'LLM验证',
      description: '智能验证确保推荐内容的准确性和相关性',
    },
    {
      icon: '📋',
      title: '执行计划生成',
      description: '自动生成详细的解决方案执行步骤',
    },
    {
      icon: '⚡',
      title: '实时处理',
      description: '快速响应，提升支持效率',
    },
  ];

  const stats = [
    { label: '处理事件', value: '10,000+' },
    { label: '准确率', value: '95%+' },
    { label: '响应时间', value: '< 3秒' },
    { label: '用户满意度', value: '98%' },
  ];

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* 导航栏 */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg={useColorModeValue('white', 'gray.800')}
        borderBottom="1px"
        borderColor={borderColor}
        backdropFilter="blur(10px)"
      >
        <Container maxW="7xl" py={4}>
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                PortSentinel AI
              </Text>
              <Badge colorScheme="blue" variant="subtle">
                AI Assistant
              </Badge>
            </HStack>
            <HStack spacing={4}>
              <Button
                variant="ghost"
                onClick={() => setShowAuth(true)}
                size="sm"
              >
                登录
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => {
                  setIsLoginMode(false);
                  setShowAuth(true);
                }}
                size="sm"
              >
                注册
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* 主要内容 */}
      <Container maxW="7xl" pt={20} pb={20}>
        <VStack spacing={20}>
          {/* Hero Section */}
          <Fade in>
            <VStack spacing={8} textAlign="center" maxW="4xl">
              <VStack spacing={4}>
                <Heading
                  fontSize={{ base: '4xl', md: '6xl' }}
                  fontWeight="bold"
                  bgGradient="linear(to-r, blue.600, purple.600)"
                  bgClip="text"
                  lineHeight="1.2"
                >
                  让AI成为你的
                  <br />
                  不公平优势
                </Heading>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  color={useColorModeValue('gray.600', 'gray.300')}
                  maxW="2xl"
                >
                  PortSentinel AI Assistant 提供强大的智能支持，通过AI代理实现计划、行动和协作，
                  为港口运营提供卓越的技术支持体验。
                </Text>
              </VStack>

              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  colorScheme="blue"
                  rightIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    setIsLoginMode(true);
                    setShowAuth(true);
                  }}
                >
                  开始使用
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowAuth(true)}
                >
                  了解更多
                </Button>
              </HStack>

              {/* 统计数据 */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} mt={8}>
                {stats.map((stat, index) => (
                  <VStack key={index} spacing={2}>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {stat.value}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {stat.label}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </VStack>
          </Fade>

          {/* 功能特性 */}
          <Fade in delay={0.2}>
            <VStack spacing={12} w="100%">
              <VStack spacing={4} textAlign="center">
                <Heading fontSize="3xl" fontWeight="bold">
                  强大的AI代理功能
                </Heading>
                <Text fontSize="lg" color="gray.600" maxW="2xl">
                  集成先进的AI技术，提供智能、协作和安全的事件处理体验
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="100%">
                {features.map((feature, index) => (
                  <ScaleFade key={index} in delay={index * 0.1}>
                    <Box
                      bg={cardBg}
                      p={6}
                      borderRadius="xl"
                      border="1px"
                      borderColor={borderColor}
                      boxShadow="sm"
                      _hover={{
                        boxShadow: 'lg',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <VStack spacing={4} align="start">
                        <Text fontSize="3xl">{feature.icon}</Text>
                        <VStack spacing={2} align="start">
                          <Text fontSize="lg" fontWeight="semibold">
                            {feature.title}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {feature.description}
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  </ScaleFade>
                ))}
              </SimpleGrid>
            </VStack>
          </Fade>

          {/* 工作流程展示 */}
          <Fade in delay={0.4}>
            <VStack spacing={8} w="100%">
              <VStack spacing={4} textAlign="center">
                <Heading fontSize="3xl" fontWeight="bold">
                  智能工作流程
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  从事件输入到解决方案执行，全流程AI驱动
                </Text>
              </VStack>

              <Box
                bg={cardBg}
                p={8}
                borderRadius="xl"
                border="1px"
                borderColor={borderColor}
                w="100%"
                maxW="4xl"
              >
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                  {[
                    { step: '1', title: '事件解析', desc: 'AI智能提取关键信息' },
                    { step: '2', title: '历史匹配', desc: '查找相似历史案例' },
                    { step: '3', title: '知识检索', desc: '匹配相关SOP文档' },
                    { step: '4', title: '计划生成', desc: '生成执行方案' },
                  ].map((item, index) => (
                    <VStack key={index} spacing={3}>
                      <Box
                        w={12}
                        h={12}
                        bg="blue.500"
                        color="white"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                        fontSize="lg"
                      >
                        {item.step}
                      </Box>
                      <VStack spacing={1} textAlign="center">
                        <Text fontWeight="semibold">{item.title}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {item.desc}
                        </Text>
                      </VStack>
                    </VStack>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </Fade>

          {/* CTA Section */}
          <Fade in delay={0.6}>
            <Box
              bg={cardBg}
              p={12}
              borderRadius="xl"
              border="1px"
              borderColor={borderColor}
              textAlign="center"
              w="100%"
              maxW="2xl"
            >
              <VStack spacing={6}>
                <Heading fontSize="2xl" fontWeight="bold">
                  准备开始了吗？
                </Heading>
                <Text color="gray.600">
                  立即体验PortSentinel AI的强大功能，提升您的支持效率
                </Text>
                <Button
                  size="lg"
                  colorScheme="blue"
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => {
                    setIsLoginMode(true);
                    setShowAuth(true);
                  }}
                >
                  立即开始
                </Button>
              </VStack>
            </Box>
          </Fade>
        </VStack>
      </Container>

      {/* 认证模态框 */}
      {showAuth && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box position="relative">
            <Button
              position="absolute"
              top={-4}
              right={-4}
              size="sm"
              borderRadius="full"
              onClick={() => setShowAuth(false)}
              zIndex={1}
            >
              ×
            </Button>
            {isLoginMode ? (
              <LoginForm onSwitchToRegister={() => setIsLoginMode(false)} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setIsLoginMode(true)} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
