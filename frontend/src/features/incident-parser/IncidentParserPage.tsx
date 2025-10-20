import React, { useState } from 'react'
import { Box, Container, Heading, VStack, HStack, Button, Badge, Text, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import DatabaseConnectionModal from './components/DatabaseConnectionModal'
import { useAuth } from '../../contexts/AuthContext'
import { parseIncidentReport, matchHistoryCases, enrichIncident, fetchExecutionPlan, executeSOPPlan, approveSOPExecution, getDatabaseStatus } from '../../services/api'
import { IncidentReportResponse, HistoryMatchRequest, EnrichmentRequest, PlanRequest, ParsedIncident, SOPResponse } from '../../types/api'
import { 
  createUserMessage, 
  createAssistantMessage, 
  createHistoryMatchMessage,
  createEnrichmentMessage, 
  createLoadingMessage,
  createSOPExecutionMessage,
  createApprovalRequestMessage,
  createPlanConfirmationMessage,
  ChatMessage 
} from '../../types/chat'

const MotionBox = motion(Box)

export const IncidentParserPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingApproval, setIsProcessingApproval] = useState(false)
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<any>({ success: false, message: 'Checking connection status...' })
  
  const { user, logout } = useAuth()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (text: string, sourceType: 'Email' | 'SMS' | 'Call') => {
    setIsLoading(true)

    // Create user message
    const userMessage = createUserMessage(text, sourceType)

    // Create parsing loading message
    const parsingLoadingMessage = createLoadingMessage('Parsing incident report...')

    // Add messages to state
    setMessages((prev) => [...prev, userMessage, parsingLoadingMessage])

    try {
      // Step 1: Call API to parse incident
      const parsedResult: IncidentReportResponse = await parseIncidentReport({
        source_type: sourceType,
        raw_text: text,
      })

      // Update parsing loading message with parsing result
      const assistantMessage = createAssistantMessage(
        'Incident parsing completed. Here are the parsing results:',
        parsedResult
      )

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parsingLoadingMessage.id ? assistantMessage : msg
        )
      )

      // Step 2: Historical case matching
      const historyLoadingMessage = createLoadingMessage('Matching historical cases...')
      setMessages((prev) => [...prev, historyLoadingMessage])

      try {
        // Build historical case matching request
        const historyRequest: HistoryMatchRequest = {
          incident_id: parsedResult.incident_id,
          source_type: parsedResult.source_type,
          problem_summary: parsedResult.problem_summary,
          affected_module: parsedResult.affected_module,
          error_code: parsedResult.error_code,
          urgency: parsedResult.urgency,
          entities: parsedResult.entities,
          raw_text: parsedResult.raw_text,
        }

        // Call historical case matching API
        const historyResult = await matchHistoryCases(historyRequest)

        // Create historical case matching message
        const historyMessage = createHistoryMatchMessage(
          'Historical case matching completed. Here are similar historical cases:',
          historyResult
        )

        // Update historical case matching loading message with matching result
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === historyLoadingMessage.id ? historyMessage : msg
          )
        )

      } catch (historyError: any) {
        console.error('Historical case matching failed:', historyError)
        const errorMessage = createLoadingMessage(`Historical case matching failed: ${historyError.message}`)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === historyLoadingMessage.id ? errorMessage : msg
          )
        )
        return // If historical case matching fails, return directly without continuing to subsequent steps
      }

      // Step 3: Call RAG enrichment
      const ragLoadingMessage = createLoadingMessage('Retrieving knowledge base...')
      setMessages((prev) => [...prev, ragLoadingMessage])

      try {
          // Build RAG request
          const enrichmentRequest: EnrichmentRequest = {
            incident_id: parsedResult.incident_id,
            source_type: parsedResult.source_type,
            problem_summary: parsedResult.problem_summary,
            affected_module: parsedResult.affected_module,
            error_code: parsedResult.error_code,
            urgency: parsedResult.urgency,
            entities: parsedResult.entities,
            raw_text: parsedResult.raw_text,
          }

          // Call RAG enrichment API
          const enrichmentResult = await enrichIncident(enrichmentRequest)

          // Create RAG enrichment message
          const enrichmentMessage = createEnrichmentMessage(
            'Knowledge base retrieval completed. Here are relevant SOP suggestions:',
            enrichmentResult
          )

          // Update RAG loading message with enrichment result
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === ragLoadingMessage.id ? enrichmentMessage : msg
            )
          )

          // Step 4: Generate execution plan
          const planLoadingMessage = createLoadingMessage('Generating execution plan...')
          setMessages((prev) => [...prev, planLoadingMessage])

        try {
          // Build execution plan request
          const planRequest: PlanRequest = {
            incident_context: {
              incident_id: parsedResult.incident_id,
              problem_summary: parsedResult.problem_summary,
              affected_module: parsedResult.affected_module || '',
              error_code: parsedResult.error_code,
              urgency: parsedResult.urgency,
              entities: parsedResult.entities,
              raw_text: parsedResult.raw_text,
            },
            sop_response: {
              incident_id: enrichmentResult.incident_id,
              problem_summary: enrichmentResult.problem_summary,
              affected_module: enrichmentResult.affected_module,
              error_code: enrichmentResult.error_code,
              urgency: enrichmentResult.urgency,
              retrieved_sops: enrichmentResult.retrieved_sops,
            }
          }

          // Call execution plan generation API
          const planResult = await fetchExecutionPlan(planRequest)

          if (planResult.success && planResult.plan.length > 0) {
            // Create plan confirmation message
            const planConfirmationMessage = createPlanConfirmationMessage(
              `📋 Execution plan generation completed with ${planResult.plan.length} steps. Please confirm to start execution:`,
              {
                plan: planResult.plan,
                incident_context: {
                  incident_id: parsedResult.incident_id,
                  problem_summary: parsedResult.problem_summary,
                  affected_module: parsedResult.affected_module,
                  urgency: parsedResult.urgency,
                  entities: parsedResult.entities,
                  error_code: parsedResult.error_code,
                  raw_text: parsedResult.raw_text
                }
              }
            )

            // Remove loading message and add plan confirmation message
            setMessages((prev) => [
              ...prev.filter((msg) => msg.id !== planLoadingMessage.id),
              planConfirmationMessage
            ])
          } else {
            // Plan generation failed
            const planErrorMessage = createAssistantMessage(
              `Execution plan generation failed: ${planResult.message || 'Unable to generate execution plan'}`,
              {} as IncidentReportResponse
            )
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === planLoadingMessage.id ? planErrorMessage : msg
              )
            )
          }

        } catch (planError: any) {
          console.error('Execution plan generation failed:', planError)
          const planErrorMessage = createAssistantMessage(
            `Execution plan generation failed: ${planError.message || 'Orchestrator service temporarily unavailable'}`,
            {} as IncidentReportResponse
          )

          // Update plan loading message with error information
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === planLoadingMessage.id ? planErrorMessage : msg
            )
          )
        }

      } catch (ragError: any) {
        console.error('RAG enrichment failed:', ragError)
        const ragErrorMessage = createAssistantMessage(
          `Knowledge base retrieval failed: ${ragError.message || 'RAG service temporarily unavailable'}`,
          parsedResult
        )

        // Update RAG loading message with error information
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === ragLoadingMessage.id ? ragErrorMessage : msg
          )
        )
      }

    } catch (parseError: any) {
      console.error('Incident parsing failed:', parseError)
      const errorMessage = createAssistantMessage(
        `Parsing failed: ${parseError.message || 'AI parsing service temporarily unavailable, please try again later.'}`,
        {} as IncidentReportResponse // Empty result object
      )

      // Update parsing loading message with error information
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parsingLoadingMessage.id ? errorMessage : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle approval request
  const handleApprovalApprove = async (stateToken: string, approvedQuery: string) => {
    setIsProcessingApproval(true)
    try {
      const result = await approveSOPExecution({
        state_token: stateToken,
        approved_query: approvedQuery,
        approved: true
      })

      if (result.success && result.execution_result) {
        // Add execution result message
        console.log('Approval execution result:', result.execution_result)
        console.log('completed_steps count:', result.execution_result.completed_steps?.length)
        const executionMessage = createSOPExecutionMessage(
          `✅ Operation approved and executed successfully`,
          result.execution_result
        )
        setMessages(prev => [...prev, executionMessage])

        // If execution is completed, don't show completion message
        // if (result.execution_result.status === 'completed') {
        //   const completionMessage = createAssistantMessage(
        //     '🎉 SOP execution plan completed successfully!',
        //     {} as IncidentReportResponse
        //   )
        //   setMessages(prev => [...prev, completionMessage])
        // }
      }
    } catch (error: any) {
      console.error('Approval execution failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ Approval execution failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsProcessingApproval(false)
  }

  const handleApprovalReject = async (stateToken: string) => {
    setIsProcessingApproval(true)
    try {
      const result = await approveSOPExecution({
        state_token: stateToken,
        approved_query: '',
        approved: false
      })

      const rejectionMessage = createAssistantMessage(
        '❌ Operation has been rejected, SOP execution stopped',
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, rejectionMessage])
    } catch (error: any) {
      console.error('Rejection execution failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ Rejection execution failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsProcessingApproval(false)
  }

  // Handle plan confirmation
  const handlePlanConfirm = async (plan: string[], incidentContext: Record<string, any>) => {
    setIsLoading(true)
    try {
      // Start executing SOP plan
      const executionRequest = {
        plan: plan,
        incident_context: incidentContext
      }

      const result = await executeSOPPlan(executionRequest)
      
      // Add execution result message
      const executionMessage = createSOPExecutionMessage(
        `🚀 Starting SOP plan execution with ${plan.length} steps`,
        result
      )
      setMessages(prev => [...prev, executionMessage])

      // If execution status is needs_approval, show approval request
      if (result.status === 'needs_approval' && result.state_token) {
        // Parse SQL query from tool_output
        let sqlQuery = '';
        try {
          if (result.tool_output) {
            const toolOutput = JSON.parse(result.tool_output);
            if (toolOutput && toolOutput.query) {
              sqlQuery = toolOutput.query;
            } else {
              sqlQuery = result.tool_output; // If not JSON format, use directly
            }
          }
        } catch (e) {
          // If parsing fails, use original output
          sqlQuery = result.tool_output || '';
        }

        const approvalMessage = createApprovalRequestMessage(
          `⚠️ High-risk operation detected, manual approval required`,
          {
            state_token: result.state_token,
            query: sqlQuery,
            step_description: result.step_description
          }
        )
        setMessages(prev => [...prev, approvalMessage])
      }
    } catch (error: any) {
      console.error('SOP plan execution failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ SOP plan execution failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsLoading(false)
  }

  // Check database status
  const checkDatabaseStatus = async () => {
    try {
      const status = await getDatabaseStatus()
      setDatabaseStatus(status)
    } catch (error) {
      setDatabaseStatus({ success: false, message: 'Database not connected' })
    }
  }

  // Handle database connection success
  const handleDatabaseConnectionSuccess = () => {
    checkDatabaseStatus()
    // Don't show success message, silently update status
  }

  // Check database status when component mounts
  React.useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Navigation Bar */}
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
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Heading size="md" color="blue.600">
                PortSentinel AI
              </Heading>
              <Badge colorScheme="blue" variant="subtle">
                AI Assistant
              </Badge>
            </HStack>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Welcome, {user?.name || user?.email}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={logout}
                colorScheme="red"
              >
                Logout
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={4} height="calc(100vh - 60px)" display="flex" flexDirection="column">
        <VStack spacing={4} align="stretch" flex={1}>
          {/* Page Title */}
          <MotionBox
            textAlign="center"
            pt={4}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={3} mb={4}>
              <Heading as="h1" size="xl" color="gray.700">
                PortSentinel AI Assistant
              </Heading>
              <HStack spacing={2}>
                <Badge 
                  colorScheme={databaseStatus?.success ? 'green' : 'red'} 
                  variant="solid"
                  fontSize="xs"
                >
                  {databaseStatus?.success ? 'Database Connected' : 'Database Not Connected'}
                </Badge>
                <Button
                  size="sm"
                  colorScheme={databaseStatus?.success ? 'green' : 'orange'}
                  variant="outline"
                  onClick={() => setIsDatabaseModalOpen(true)}
                >
                  🗄️ Database Settings
                </Button>
              </HStack>
            </VStack>
          </MotionBox>

        {/* Chat Window */}
        <ChatWindow 
          messages={messages} 
          onApprovalApprove={handleApprovalApprove}
          onApprovalReject={handleApprovalReject}
          onPlanConfirm={handlePlanConfirm}
        />
      </VStack>

      {/* Chat Input */}
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} disabled={isLoading} />

      {/* Database Connection Modal */}
      <DatabaseConnectionModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onConnectionSuccess={handleDatabaseConnectionSuccess}
      />
      </Container>
    </Box>
  )
}