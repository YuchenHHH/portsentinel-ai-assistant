/**
 * Landing Page - Inspired by Claude AI agents page design
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
      title: 'Intelligent Event Parsing',
      description: 'AI-driven natural language processing that automatically extracts key information',
    },
    {
      icon: '🔍',
      title: 'Historical Case Matching',
      description: 'Similarity-based historical case retrieval providing reference solutions',
    },
    {
      icon: '📚',
      title: 'Knowledge Base Retrieval',
      description: 'Hybrid retrieval technology for precise SOP document matching',
    },
    {
      icon: '✅',
      title: 'LLM Validation',
      description: 'Intelligent validation ensuring accuracy and relevance of recommendations',
    },
    {
      icon: '📋',
      title: 'Execution Plan Generation',
      description: 'Automatically generates detailed solution execution steps',
    },
    {
      icon: '⚡',
      title: 'Real-time Processing',
      description: 'Fast response times to enhance support efficiency',
    },
  ];

  const stats = [
    { label: 'Events Processed', value: '10,000+' },
    { label: 'Accuracy Rate', value: '95%+' },
    { label: 'Response Time', value: '< 3s' },
    { label: 'User Satisfaction', value: '98%' },
  ];

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Navigation Bar */}
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
                Login
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => {
                  setIsLoginMode(false);
                  setShowAuth(true);
                }}
                size="sm"
              >
                Register
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
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
                  Make AI Your
                  <br />
                  Unfair Advantage
                </Heading>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  color={useColorModeValue('gray.600', 'gray.300')}
                  maxW="2xl"
                >
                  PortSentinel AI Assistant provides powerful intelligent support through AI agents for planning, action, and collaboration,
                  delivering exceptional technical support experience for port operations.
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
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowAuth(true)}
                >
                  Learn More
                </Button>
              </HStack>

              {/* Statistics */}
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

          {/* Features */}
          <Fade in delay={0.2}>
            <VStack spacing={12} w="100%">
              <VStack spacing={4} textAlign="center">
                <Heading fontSize="3xl" fontWeight="bold">
                  Powerful AI Agent Features
                </Heading>
                <Text fontSize="lg" color="gray.600" maxW="2xl">
                  Integrated advanced AI technology providing intelligent, collaborative, and secure event processing experience
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

          {/* Workflow Display */}
          <Fade in delay={0.4}>
            <VStack spacing={8} w="100%">
              <VStack spacing={4} textAlign="center">
                <Heading fontSize="3xl" fontWeight="bold">
                  Intelligent Workflow
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  From event input to solution execution, fully AI-driven process
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
                    { step: '1', title: 'Event Parsing', desc: 'AI intelligently extracts key information' },
                    { step: '2', title: 'Historical Matching', desc: 'Find similar historical cases' },
                    { step: '3', title: 'Knowledge Retrieval', desc: 'Match relevant SOP documents' },
                    { step: '4', title: 'Plan Generation', desc: 'Generate execution plan' },
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
                  Ready to Get Started?
                </Heading>
                <Text color="gray.600">
                  Experience the power of PortSentinel AI immediately and enhance your support efficiency
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
                  Start Now
                </Button>
              </VStack>
            </Box>
          </Fade>
        </VStack>
      </Container>

      {/* Authentication Modal */}
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
