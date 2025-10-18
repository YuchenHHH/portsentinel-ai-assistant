import { Spinner, Box, Text } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = '加载中...', 
  size = 'md' 
}) => {
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      p={8}
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size={size}
      />
      <Text mt={4} color="gray.600" fontSize="sm">
        {message}
      </Text>
    </Box>
  )
}
