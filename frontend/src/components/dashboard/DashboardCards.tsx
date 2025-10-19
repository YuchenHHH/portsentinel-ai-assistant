/**
 * DashboardCards - 数据可视化卡片组件
 */

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  useColorModeValue,
  Badge,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  TimeIcon,
  CheckIcon,
  WarningIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@chakra-ui/icons';

// 模拟数据
const dashboardData = {
  pendingCases: 12,
  resolvedCases: 48,
  totalCases: 60,
  weeklyTrend: [
    { day: 'Mon', cases: 8 },
    { day: 'Tue', cases: 12 },
    { day: 'Wed', cases: 6 },
    { day: 'Thu', cases: 15 },
    { day: 'Fri', cases: 9 },
    { day: 'Sat', cases: 4 },
    { day: 'Sun', cases: 2 },
  ],
  urgentCases: 3,
  averageResolutionTime: '2.5 hours',
  successRate: 94.2,
};

export const DashboardCards: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Dashboard Overview
        </Text>
        <Text color={textColor}>
          Monitor your duty cases and system performance
        </Text>
      </Box>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
        {/* Pending Cases */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Pending Cases</StatLabel>
              <StatNumber color="red.500">{dashboardData.pendingCases}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                23.36% from last week
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Resolved Cases */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Resolved Cases</StatLabel>
              <StatNumber color="green.500">{dashboardData.resolvedCases}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                12.5% from last week
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Urgent Cases */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Urgent Cases</StatLabel>
              <StatNumber color="orange.500">{dashboardData.urgentCases}</StatNumber>
              <StatHelpText>
                <Icon as={WarningIcon} color="orange.500" />
                Requires immediate attention
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Success Rate */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel color={textColor}>Success Rate</StatLabel>
              <StatNumber color="blue.500">{dashboardData.successRate}%</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                2.1% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Charts and Additional Info */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Weekly Trend Chart */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="semibold">
                  Weekly Cases Trend
                </Text>
                <Badge colorScheme="blue" variant="subtle">
                  Last 7 days
                </Badge>
              </HStack>
              
              {/* Simple Bar Chart */}
              <Box>
                <HStack spacing={2} align="end" h="200px">
                  {dashboardData.weeklyTrend.map((item, index) => (
                    <VStack key={index} spacing={2} flex={1}>
                      <Box
                        bg="blue.500"
                        w="full"
                        h={`${(item.cases / 15) * 150}px`}
                        borderRadius="md"
                        opacity={0.8}
                        _hover={{ opacity: 1 }}
                      />
                      <Text fontSize="xs" color={textColor}>
                        {item.day}
                      </Text>
                      <Text fontSize="xs" fontWeight="bold">
                        {item.cases}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Performance Metrics */}
        <VStack spacing={4} align="stretch">
          {/* Average Resolution Time */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                    Avg Resolution Time
                  </Text>
                  <Icon as={TimeIcon} color="blue.500" />
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {dashboardData.averageResolutionTime}
                </Text>
                <Progress value={75} colorScheme="blue" size="sm" />
                <Text fontSize="xs" color={textColor}>
                  Target: 2 hours
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Case Distribution */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  Case Distribution
                </Text>
                
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Box w={3} h={3} bg="red.500" borderRadius="sm" />
                      <Text fontSize="sm">Pending</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="bold">
                      {dashboardData.pendingCases}
                    </Text>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Box w={3} h={3} bg="green.500" borderRadius="sm" />
                      <Text fontSize="sm">Resolved</Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="bold">
                      {dashboardData.resolvedCases}
                    </Text>
                  </HStack>
                </VStack>

                <Progress 
                  value={(dashboardData.resolvedCases / dashboardData.totalCases) * 100} 
                  colorScheme="green" 
                  size="sm" 
                />
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  Quick Actions
                </Text>
                
                <SimpleGrid columns={2} spacing={2}>
                  <Box
                    p={3}
                    bg="blue.50"
                    borderRadius="md"
                    textAlign="center"
                    cursor="pointer"
                    _hover={{ bg: 'blue.100' }}
                  >
                    <Icon as={TimeIcon} color="blue.500" mb={1} />
                    <Text fontSize="xs" fontWeight="medium">
                      New Case
                    </Text>
                  </Box>
                  
                  <Box
                    p={3}
                    bg="green.50"
                    borderRadius="md"
                    textAlign="center"
                    cursor="pointer"
                    _hover={{ bg: 'green.100' }}
                  >
                    <Icon as={CheckIcon} color="green.500" mb={1} />
                    <Text fontSize="xs" fontWeight="medium">
                      Review
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Grid>
    </VStack>
  );
};
