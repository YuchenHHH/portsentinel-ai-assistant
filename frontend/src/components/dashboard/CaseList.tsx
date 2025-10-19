/**
 * CaseList - 案例列表组件
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  SearchIcon,
  ChevronDownIcon,
  TimeIcon,
  WarningIcon,
  CheckIcon,
  EditIcon,
  ViewIcon,
} from '@chakra-ui/icons';

interface Case {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'resolved';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  category: string;
}

interface CaseListProps {
  type: 'pending' | 'resolved';
  onCaseSelect: (caseId: string) => void;
}

// 模拟数据
const mockCases: Case[] = [
  {
    id: '1',
    title: 'Container Loading Issue',
    description: 'Container loading process failed due to equipment malfunction',
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'John Doe',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    category: 'Equipment',
  },
  {
    id: '2',
    title: 'Vessel Docking Problem',
    description: 'Vessel unable to dock due to weather conditions',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'Jane Smith',
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-01-15T11:45:00Z',
    category: 'Weather',
  },
  {
    id: '3',
    title: 'EDI Connection Error',
    description: 'EDI system connection timeout during data transfer',
    priority: 'medium',
    status: 'pending',
    assignedTo: 'Mike Johnson',
    createdAt: '2024-01-15T08:20:00Z',
    updatedAt: '2024-01-15T08:20:00Z',
    category: 'IT',
  },
  {
    id: '4',
    title: 'Cargo Inspection Delay',
    description: 'Customs inspection taking longer than expected',
    priority: 'low',
    status: 'resolved',
    assignedTo: 'Sarah Wilson',
    createdAt: '2024-01-14T16:00:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
    category: 'Customs',
  },
];

export const CaseList: React.FC<CaseListProps> = ({ type, onCaseSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red';
      case 'in-progress': return 'blue';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return WarningIcon;
      case 'high': return TimeIcon;
      default: return CheckIcon;
    }
  };

  const filteredCases = mockCases.filter(caseItem => {
    const matchesType = type === 'pending' ? 
      caseItem.status !== 'resolved' : 
      caseItem.status === 'resolved';
    
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || caseItem.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || caseItem.category === filterCategory;

    return matchesType && matchesSearch && matchesPriority && matchesCategory;
  });

  const sortedCases = filteredCases.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold">
            {type === 'pending' ? 'Pending Cases' : 'Resolved Cases'}
          </Text>
          <Text color={textColor}>
            {type === 'pending' ? 'Cases requiring attention' : 'Recently resolved cases'}
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          <Button size="sm" colorScheme="blue" variant="outline">
            Export
          </Button>
          <Button size="sm" colorScheme="blue">
            New Case
          </Button>
        </HStack>
      </Flex>

      {/* Filters */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <Icon as={SearchIcon} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              maxW="150px"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            
            <Select
              maxW="150px"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Equipment">Equipment</option>
              <option value="Weather">Weather</option>
              <option value="IT">IT</option>
              <option value="Customs">Customs</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Cases Table */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Case</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th>Assigned To</Th>
                <Th>Category</Th>
                <Th>Updated</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedCases.map((caseItem) => (
                <Tr
                  key={caseItem.id}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={() => onCaseSelect(caseItem.id)}
                >
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {caseItem.title}
                      </Text>
                      <Text fontSize="xs" color={textColor} noOfLines={2}>
                        {caseItem.description}
                      </Text>
                    </VStack>
                  </Td>
                  
                  <Td>
                    <HStack spacing={1}>
                      <Icon as={getPriorityIcon(caseItem.priority)} />
                      <Badge
                        colorScheme={getPriorityColor(caseItem.priority)}
                        variant="solid"
                      >
                        {caseItem.priority.toUpperCase()}
                      </Badge>
                    </HStack>
                  </Td>
                  
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(caseItem.status)}
                      variant="subtle"
                    >
                      {caseItem.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <HStack spacing={2}>
                      <Avatar size="xs" name={caseItem.assignedTo} />
                      <Text fontSize="sm">{caseItem.assignedTo}</Text>
                    </HStack>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm" color={textColor}>
                      {caseItem.category}
                    </Text>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm" color={textColor}>
                      {new Date(caseItem.updatedAt).toLocaleDateString()}
                    </Text>
                  </Td>
                  
                  <Td>
                    <Menu>
                      <MenuButton
                        as={Button}
                        size="sm"
                        variant="ghost"
                        rightIcon={<ChevronDownIcon />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Actions
                      </MenuButton>
                      <MenuList>
                        <MenuItem icon={<ViewIcon />}>
                          View Details
                        </MenuItem>
                        <MenuItem icon={<EditIcon />}>
                          Edit Case
                        </MenuItem>
                        <MenuItem icon={<CheckIcon />}>
                          Mark Resolved
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Summary */}
      <HStack justify="space-between" color={textColor} fontSize="sm">
        <Text>
          Showing {sortedCases.length} of {mockCases.length} cases
        </Text>
        <HStack spacing={4}>
          <Text>
            Urgent: {sortedCases.filter(c => c.priority === 'urgent').length}
          </Text>
          <Text>
            High: {sortedCases.filter(c => c.priority === 'high').length}
          </Text>
          <Text>
            Medium: {sortedCases.filter(c => c.priority === 'medium').length}
          </Text>
          <Text>
            Low: {sortedCases.filter(c => c.priority === 'low').length}
          </Text>
        </HStack>
      </HStack>
    </VStack>
  );
};
