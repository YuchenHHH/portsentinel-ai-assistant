import React, { useState } from 'react';
import {
  Box,
  VStack,
  Button,
  Text,
  useColorModeValue,
  Container,
  Heading
} from '@chakra-ui/react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getSummaryMarkdown } from '../services/executionSummaryApi';

export const MarkdownTestPage: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');

  const handleLoadMarkdown = async () => {
    setIsLoading(true);
    try {
      const result = await getSummaryMarkdown('ALR-861600');
      setMarkdownContent(result.markdown_content);
    } catch (error: any) {
      console.error('加载 Markdown 内容失败:', error);
      setMarkdownContent('# 错误\n\n加载 Markdown 内容失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={4}>Markdown 渲染测试</Heading>
          <Button
            colorScheme="blue"
            onClick={handleLoadMarkdown}
            isLoading={isLoading}
            loadingText="加载中..."
          >
            加载 ALR-861600 摘要内容
          </Button>
        </Box>

        {markdownContent && (
          <Box bg={bgColor} p={6} borderRadius="lg" shadow="md">
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              📄 执行摘要 Markdown 内容:
            </Text>
            <MarkdownRenderer 
              content={markdownContent}
              maxHeight="800px"
            />
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default MarkdownTestPage;
