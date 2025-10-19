/**
 * 受保护的路由组件
 */

import React, { ReactNode } from 'react';
import { Box, Spinner, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { LandingPage } from '../pages/LandingPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">加载中...</Text>
        </VStack>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <>{children}</>;
};
