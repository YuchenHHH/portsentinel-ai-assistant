import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Container,
  Heading,
  Alert,
  AlertIcon,
  Badge
} from '@chakra-ui/react';
import { ExecutionSummaryDisplay } from '../components/ExecutionSummaryDisplay';

export const SummaryDisplayDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');

  // 模拟成功场景的摘要数据
  const successSummaryData = {
    incident_id: "ALR-861600",
    resolution_outcome: "SUCCESS",
    error_identified: "Container data duplication issue",
    root_cause: "Data synchronization problem between systems",
    actions_taken: [
      "Query the database to retrieve all container records for container number 'CMAU0000020' ordered by creation time descending",
      "Identify the latest record for each unique combination of vessel_id and eta_ts for container 'CMAU0000020'",
      "Delete all duplicate container records for 'CMAU0000020' that are older than the latest record per vessel_id and eta_ts safely",
      "Verify that only the latest container records per vessel_id and eta_ts remain for container 'CMAU0000020'"
    ],
    resolution_timestamp: "2025-10-20T00:41:41.726284",
    l2_team_notes: "SOP execution completed successfully",
    escalation_required: false
  };

  // 模拟失败场景的摘要数据
  const failureSummaryData = {
    incident_id: "ALR-861601",
    resolution_outcome: "ESCALATION_REQUIRED",
    error_identified: "Database permission error",
    root_cause: "Insufficient database privileges for L2 team",
    actions_taken: [
      "Attempted to query container records",
      "Failed to execute database operations due to permission restrictions"
    ],
    resolution_timestamp: "2025-10-20T01:00:00.000000",
    l2_team_notes: "Unable to complete SOP due to database access limitations",
    escalation_required: true
  };

  // 模拟升级联系人数据
  const escalationContact = {
    contact_name: "Jane Doe",
    role: "Senior Database Administrator",
    email: "jane.doe@company.com",
    module: "Container"
  };

  // 模拟升级邮件数据
  const escalationEmail = {
    to_email: "jane.doe@company.com",
    subject: "URGENT: Database Permission Issue - ALR-861601",
    body: `Dear Jane,

This is an urgent escalation regarding incident ALR-861601.

**Issue Summary:**
The L2 team encountered database permission restrictions while attempting to resolve a container data duplication issue.

**Root Cause:**
Insufficient database privileges for L2 team to execute required SQL operations.

**Actions Attempted:**
- Query container records
- Execute database operations

**Required Action:**
Please review and update database permissions for the L2 team to allow execution of container data management operations.

**Priority:** HIGH
**Deadline:** ASAP

Best regards,
PortSentinel AI Assistant`,
    priority: "HIGH"
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Agent 4 执行摘要显示演示
          </Heading>
          <Text color="gray.600">
            展示不同场景下的执行摘要显示效果
          </Text>
        </Box>

        <Box p={6} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold">
                演示场景
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => setShowDemo(!showDemo)}
                size="md"
              >
                {showDemo ? '隐藏演示' : '显示演示'}
              </Button>
            </HStack>

            {showDemo && (
              <VStack align="stretch" spacing={6}>
                {/* 成功场景 */}
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={3} color="green.700">
                    ✅ 成功场景 - 容器数据重复问题已解决
                  </Text>
                  <ExecutionSummaryDisplay
                    summaryData={successSummaryData}
                  />
                </Box>

                {/* 失败场景 */}
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={3} color="orange.700">
                    ⚠️ 失败场景 - 需要升级到 L3 团队
                  </Text>
                  <ExecutionSummaryDisplay
                    summaryData={failureSummaryData}
                    escalationContact={escalationContact}
                    escalationEmail={escalationEmail}
                  />
                </Box>
              </VStack>
            )}

            {!showDemo && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm">
                    点击"显示演示"按钮查看不同场景下的执行摘要显示效果。
                    包括成功场景和需要升级的失败场景。
                  </Text>
                </Box>
              </Alert>
            )}
          </VStack>
        </Box>

        <Box p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" color="gray.600">
            💡 提示: 在实际使用中，当 SOP 执行完成后，系统会自动显示"生成执行摘要"按钮。
            点击按钮后，Agent 4 会根据执行结果生成相应的摘要内容。
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default SummaryDisplayDemo;
