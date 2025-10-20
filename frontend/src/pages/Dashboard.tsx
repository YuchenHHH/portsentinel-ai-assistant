/**
 * Dashboard - Main dashboard page
 */

import React, { useState } from 'react';
import {
  Box,
  Flex,
  useColorModeValue,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  ChevronDownIcon,
  BellIcon,
  SettingsIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/dashboard/Sidebar';
import { DashboardCards } from '../components/dashboard/DashboardCards';
import { CaseList } from '../components/dashboard/CaseList';
import { CaseDetail } from '../components/dashboard/CaseDetail';
import { KnowledgeBase } from '../components/dashboard/KnowledgeBase';

type DashboardView = 'overview' | 'pending-cases' | 'resolved-cases' | 'knowledge-base' | 'case-detail';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentView('case-detail');
  };

  const handleNewCase = () => {
    console.log('handleNewCase called');
    setSelectedCaseId(null); // 新案例不需要特定的ID
    setCurrentView('case-detail');
    console.log('Current view set to case-detail');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedCaseId(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return <DashboardCards />;
      case 'pending-cases':
        return <CaseList type="pending" onCaseSelect={handleCaseSelect} />;
      case 'resolved-cases':
        return <CaseList type="resolved" onCaseSelect={handleCaseSelect} />;
      case 'knowledge-base':
        return <KnowledgeBase />;
      case 'case-detail':
        return (
          <CaseDetail 
            caseId={selectedCaseId} 
            onBack={handleBackToOverview}
          />
        );
      default:
        return <DashboardCards />;
    }
  };

  return (
    <Box bg={bgColor} h="100vh" maxH="100vh" overflow="hidden">
      {/* Header */}
      <Box
        bg={headerBg}
        borderBottom="1px"
        borderColor={borderColor}
        px={4}
        py={3}
        position="sticky"
        top={0}
        zIndex={1000}
        backdropFilter="blur(10px)"
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            {isMobile && (
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
              />
            )}
            <Text fontSize="xl" fontWeight="bold" color="blue.600">
              PortSentinel AI
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              Dashboard
            </Badge>
          </HStack>

          <HStack spacing={4}>
            <IconButton
              aria-label="Search"
              icon={<SearchIcon />}
              variant="ghost"
              size="sm"
            />
            <IconButton
              aria-label="Notifications"
              icon={<BellIcon />}
              variant="ghost"
              size="sm"
            />
            <Menu>
              <MenuButton as={Button} variant="ghost" rightIcon={<ChevronDownIcon />}>
                <HStack spacing={2}>
                  <Avatar size="sm" name={user?.name} />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" fontWeight="medium">
                      {user?.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user?.email}
                    </Text>
                  </VStack>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<SettingsIcon />}>
                  Settings
                </MenuItem>
                <MenuItem onClick={logout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      <Flex>
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view as DashboardView)}
          onNewCase={handleNewCase}
          isMobile={isMobile}
        />

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader>
              <Text fontSize="lg" fontWeight="bold">
                Navigation
              </Text>
            </DrawerHeader>
            <DrawerBody p={0}>
              <Sidebar
                currentView={currentView}
                onViewChange={(view) => {
                  setCurrentView(view as DashboardView);
                  onClose();
                }}
                onNewCase={handleNewCase}
                isMobile={true}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
          {renderContent()}
        </Box>
      </Flex>
    </Box>
  );
};
