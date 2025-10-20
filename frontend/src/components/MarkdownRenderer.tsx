import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  useColorModeValue,
  Heading,
  Text,
  Divider,
  UnorderedList,
  OrderedList,
  ListItem,
  Code,
  Link,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';

interface MarkdownRendererProps {
  content: string;
  maxHeight?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  maxHeight = "400px" 
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');

  const components = {
    h1: ({ children, ...props }: any) => (
      <Heading as="h1" size="lg" mb={4} color="blue.600" {...props}>
        {children}
      </Heading>
    ),
    h2: ({ children, ...props }: any) => (
      <Heading as="h2" size="md" mb={3} color="blue.500" {...props}>
        {children}
      </Heading>
    ),
    h3: ({ children, ...props }: any) => (
      <Heading as="h3" size="sm" mb={2} color="blue.400" {...props}>
        {children}
      </Heading>
    ),
    p: ({ children, ...props }: any) => (
      <Text mb={2} color={textColor} {...props}>
        {children}
      </Text>
    ),
    ul: ({ children, ...props }: any) => (
      <UnorderedList mb={3} pl={4} {...props}>
        {children}
      </UnorderedList>
    ),
    ol: ({ children, ...props }: any) => (
      <OrderedList mb={3} pl={4} {...props}>
        {children}
      </OrderedList>
    ),
    li: ({ children, ...props }: any) => (
      <ListItem mb={1} color={textColor} {...props}>
        {children}
      </ListItem>
    ),
    code: ({ inline, children, ...props }: any) => (
      inline ? (
        <Code fontSize="sm" colorScheme="blue" {...props}>
          {children}
        </Code>
      ) : (
        <Box
          as="pre"
          bg="gray.100"
          p={3}
          borderRadius="md"
          overflowX="auto"
          mb={3}
          border="1px"
          borderColor="gray.200"
          {...props}
        >
          <Code fontSize="sm" color="gray.800">
            {children}
          </Code>
        </Box>
      )
    ),
    blockquote: ({ children, ...props }: any) => (
      <Alert status="info" variant="left-accent" mb={3} {...props}>
        <AlertIcon />
        <Box>
          <AlertDescription>
            {children}
          </AlertDescription>
        </Box>
      </Alert>
    ),
    table: ({ children, ...props }: any) => (
      <Box overflowX="auto" mb={4}>
        <Table variant="simple" size="sm" {...props}>
          {children}
        </Table>
      </Box>
    ),
    thead: ({ children, ...props }: any) => (
      <Thead bg="gray.50" {...props}>
        {children}
      </Thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <Tbody {...props}>
        {children}
      </Tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <Tr {...props}>
        {children}
      </Tr>
    ),
    th: ({ children, ...props }: any) => (
      <Th color="gray.700" fontWeight="semibold" {...props}>
        {children}
      </Th>
    ),
    td: ({ children, ...props }: any) => (
      <Td color={textColor} {...props}>
        {children}
      </Td>
    ),
    hr: () => <Divider my={4} />,
    a: ({ href, children, ...props }: any) => (
      <Link href={href} color="blue.500" isExternal {...props}>
        {children}
      </Link>
    ),
    strong: ({ children, ...props }: any) => (
      <Text as="span" fontWeight="bold" color={textColor} {...props}>
        {children}
      </Text>
    ),
    em: ({ children, ...props }: any) => (
      <Text as="span" fontStyle="italic" color={textColor} {...props}>
        {children}
      </Text>
    )
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
      p={4}
      maxH={maxHeight}
      overflowY="auto"
      sx={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          bg: 'gray.100',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          bg: 'gray.400',
          borderRadius: '4px',
          '&:hover': {
            bg: 'gray.500',
          },
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
