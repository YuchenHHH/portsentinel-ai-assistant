/**
 * KnowledgeBase - 知识库管理界面
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  Select,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Flex,
  Spacer,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import {
  AddIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  DownloadIcon,
  AttachmentIcon,
  InfoIcon,
} from '@chakra-ui/icons';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  status: 'active' | 'draft' | 'archived';
}

// 模拟知识库数据
const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: '1',
    title: 'Container Loading Procedures',
    content: 'Standard operating procedures for container loading operations...',
    category: 'SOP',
    tags: ['container', 'loading', 'safety'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    author: 'John Doe',
    status: 'active',
  },
  {
    id: '2',
    title: 'Weather Impact Assessment',
    content: 'Guidelines for assessing weather impact on port operations...',
    category: 'Guidelines',
    tags: ['weather', 'assessment', 'safety'],
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-12T11:00:00Z',
    author: 'Jane Smith',
    status: 'active',
  },
  {
    id: '3',
    title: 'EDI System Troubleshooting',
    content: 'Common EDI system issues and resolution steps...',
    category: 'Troubleshooting',
    tags: ['EDI', 'IT', 'troubleshooting'],
    createdAt: '2024-01-08T16:00:00Z',
    updatedAt: '2024-01-14T10:15:00Z',
    author: 'Mike Johnson',
    status: 'active',
  },
];

export const KnowledgeBase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'yellow';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };

  const filteredItems = mockKnowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleViewItem = (item: KnowledgeItem) => {
    setSelectedItem(item);
    onOpen();
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setSelectedItem(item);
    onEditOpen();
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold">
            Knowledge Base
          </Text>
          <Text color={textColor}>
            Manage and organize your knowledge resources
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          <Button size="sm" variant="outline" leftIcon={<DownloadIcon />}>
            Export
          </Button>
          <Button size="sm" variant="outline" leftIcon={<AttachmentIcon />}>
            Import
          </Button>
          <Button size="sm" colorScheme="blue" leftIcon={<AddIcon />}>
            Add Knowledge
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
                placeholder="Search knowledge base..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select
              maxW="150px"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="SOP">SOP</option>
              <option value="Guidelines">Guidelines</option>
              <option value="Troubleshooting">Troubleshooting</option>
            </Select>
            
            <Select
              maxW="150px"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Knowledge Items Table */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Tags</Th>
                <Th>Author</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {item.title}
                      </Text>
                      <Text fontSize="xs" color={textColor} noOfLines={2}>
                        {item.content.substring(0, 100)}...
                      </Text>
                    </VStack>
                  </Td>
                  
                  <Td>
                    <Badge colorScheme="blue" variant="subtle">
                      {item.category}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <HStack spacing={1} wrap="wrap">
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} size="sm" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Text fontSize="xs" color={textColor}>
                          +{item.tags.length - 2}
                        </Text>
                      )}
                    </HStack>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm">{item.author}</Text>
                  </Td>
                  
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(item.status)}
                      variant="solid"
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm" color={textColor}>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                  </Td>
                  
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label="View"
                        icon={<ViewIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewItem(item)}
                      />
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditItem(item)}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Summary Stats */}
      <HStack justify="space-between" color={textColor} fontSize="sm">
        <Text>
          Showing {filteredItems.length} of {mockKnowledgeItems.length} items
        </Text>
        <HStack spacing={4}>
          <Text>
            Active: {mockKnowledgeItems.filter(i => i.status === 'active').length}
          </Text>
          <Text>
            Draft: {mockKnowledgeItems.filter(i => i.status === 'draft').length}
          </Text>
          <Text>
            Archived: {mockKnowledgeItems.filter(i => i.status === 'archived').length}
          </Text>
        </HStack>
      </HStack>

      {/* View Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedItem?.title}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <Badge colorScheme="blue" variant="subtle">
                  {selectedItem?.category}
                </Badge>
                <Badge
                  colorScheme={getStatusColor(selectedItem?.status || '')}
                  variant="solid"
                >
                  {selectedItem?.status?.toUpperCase()}
                </Badge>
              </HStack>
              
              <Text fontSize="sm" color={textColor}>
                Author: {selectedItem?.author} | 
                Created: {selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : ''} |
                Updated: {selectedItem?.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : ''}
              </Text>
              
              <Divider />
              
              <Text>
                {selectedItem?.content}
              </Text>
              
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" fontWeight="semibold">
                  Tags:
                </Text>
                <HStack spacing={2} wrap="wrap">
                  {selectedItem?.tags.map((tag, index) => (
                    <Badge key={index} size="sm" variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="blue" onClick={() => {
              onClose();
              onEditOpen();
            }}>
              Edit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit Knowledge Item
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input defaultValue={selectedItem?.title} />
              </FormControl>
              
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select defaultValue={selectedItem?.category}>
                  <option value="SOP">SOP</option>
                  <option value="Guidelines">Guidelines</option>
                  <option value="Troubleshooting">Troubleshooting</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Content</FormLabel>
                <Textarea
                  defaultValue={selectedItem?.content}
                  rows={6}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Tags (comma-separated)</FormLabel>
                <Input defaultValue={selectedItem?.tags.join(', ')} />
              </FormControl>
              
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select defaultValue={selectedItem?.status}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue">
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
