/**
 * Sidebar - 左侧导航栏组件
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  useColorModeValue,
  Divider,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import {
  ViewIcon,
  TimeIcon,
  CheckIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChatIcon,
  SearchIcon,
  AddIcon,
} from '@chakra-ui/icons';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onNewCase: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onNewCase,
  isMobile = false 
}) => {
  const { isOpen: isProjectsOpen, onToggle: onProjectsToggle } = useDisclosure();
  const { isOpen: isChatOpen, onToggle: onChatToggle } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: ViewIcon,
      badge: null,
    },
    {
      id: 'pending-cases',
      label: 'Pending Cases',
      icon: TimeIcon,
      badge: '12',
      badgeColor: 'red',
    },
    {
      id: 'resolved-cases',
      label: 'Resolved Cases',
      icon: CheckIcon,
      badge: '48',
      badgeColor: 'green',
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      icon: SettingsIcon,
      badge: null,
    },
  ];

  const recentChats = [
    'Container Loading Issue',
    'Vessel Docking Problem',
    'EDI Connection Error',
    'Cargo Inspection Delay',
  ];

  return (
    <Box
      w={isMobile ? 'full' : '280px'}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      h="100vh"
      overflowY="auto"
      p={4}
    >
      <VStack spacing={4} align="stretch">
        {/* Logo Section */}
        <HStack spacing={3} mb={4}>
          <Box
            w={8}
            h={8}
            bg="blue.500"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" fontSize="sm" fontWeight="bold">
              P
            </Text>
          </Box>
          <VStack spacing={0} align="start">
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              PortSentinel
            </Text>
            <Text fontSize="xs" color="gray.500">
              AI Assistant
            </Text>
          </VStack>
        </HStack>

        {/* New Chat Button */}
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          variant="solid"
          size="sm"
          mb={2}
          onClick={() => {
            console.log('New Case button clicked');
            onNewCase();
          }}
        >
          New Case
        </Button>

        {/* Search */}
        <Button
          leftIcon={<SearchIcon />}
          variant="ghost"
          size="sm"
          justifyContent="flex-start"
          color={textColor}
        >
          Search Cases
        </Button>

        <Divider />

        {/* Main Navigation */}
        <VStack spacing={1} align="stretch">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              leftIcon={<Icon as={item.icon} />}
              variant={currentView === item.id ? 'solid' : 'ghost'}
              colorScheme={currentView === item.id ? 'blue' : 'gray'}
              size="sm"
              justifyContent="flex-start"
              onClick={() => onViewChange(item.id)}
              position="relative"
            >
              <HStack justify="space-between" w="full">
                <Text>{item.label}</Text>
                {item.badge && (
                  <Badge
                    colorScheme={item.badgeColor}
                    variant="solid"
                    size="sm"
                  >
                    {item.badge}
                  </Badge>
                )}
              </HStack>
            </Button>
          ))}
        </VStack>

        <Divider />

        {/* Projects Section */}
        <Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={onProjectsToggle}
            justifyContent="space-between"
            w="full"
            color={textColor}
          >
            <Text>Projects</Text>
            <Icon as={isProjectsOpen ? ChevronDownIcon : ChevronRightIcon} />
          </Button>
          <Collapse in={isProjectsOpen}>
            <VStack spacing={1} align="stretch" mt={2} ml={4}>
              <Button
                leftIcon={<AddIcon />}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                color={textColor}
              >
                New Project
              </Button>
              <Button
                leftIcon={<ChatIcon />}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                color={textColor}
              >
                Interview
              </Button>
            </VStack>
          </Collapse>
        </Box>

        <Divider />

        {/* Recent Chats */}
        <Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={onChatToggle}
            justifyContent="space-between"
            w="full"
            color={textColor}
          >
            <Text>Recent Cases</Text>
            <Icon as={isChatOpen ? ChevronDownIcon : ChevronRightIcon} />
          </Button>
          <Collapse in={isChatOpen}>
            <VStack spacing={1} align="stretch" mt={2} ml={4}>
              {recentChats.map((chat, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                  color={textColor}
                  _hover={{ bg: hoverBg }}
                  onClick={() => onViewChange('case-detail')}
                >
                  <Text fontSize="sm" isTruncated>
                    {chat}
                  </Text>
                </Button>
              ))}
            </VStack>
          </Collapse>
        </Box>

      </VStack>
    </Box>
  );
};
