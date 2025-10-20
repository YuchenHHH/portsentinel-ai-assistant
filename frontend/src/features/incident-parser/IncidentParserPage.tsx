import React, { useState } from 'react'
import { Box, Container, Heading, VStack, HStack, Button, Badge, Text, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import DatabaseConnectionModal from './components/DatabaseConnectionModal'
import { useAuth } from '../../contexts/AuthContext'
import { parseIncidentReport, matchHistoryCases, enrichIncident, fetchExecutionPlan, executeSOPPlan, approveSOPExecution, continueSOPExecution, getDatabaseStatus } from '../../services/api'
import { IncidentReportResponse, HistoryMatchRequest, EnrichmentRequest, PlanRequest } from '../../types/api'
import { 
  createUserMessage, 
  createAssistantMessage, 
  createHistoryMatchMessage,
  createEnrichmentMessage, 
  createLoadingMessage,
  createSOPExecutionMessage,
  createApprovalRequestMessage,
  createContinueExecutionMessage,
  createNextStepConfirmMessage,
  createSummaryGenerationMessage,
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

      // Show next step confirmation
      const nextStepMessage = createNextStepConfirmMessage(
        'Ready to proceed to historical case matching',
        {
          step_name: 'Incident Parsing',
          step_description: 'Incident parsing completed successfully',
          parsed_result: parsedResult
        }
      )
      setMessages(prev => [...prev, nextStepMessage])

    } catch (error: any) {
      console.error('Incident parsing failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ Incident parsing failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parsingLoadingMessage.id ? errorMessage : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle next step confirmation (historical case matching and beyond)
  const handleNextStepConfirm = async (parsedResult: IncidentReportResponse) => {
    setIsLoading(true)
    try {
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

    } catch (error: any) {
      console.error('Next step processing failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ Next step processing failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle continue execution
  const handleContinueExecution = async (stateToken: string) => {
    setIsLoading(true)
    try {
      const result = await continueSOPExecution({ state_token: stateToken })
      
      // Add execution result message
      const executionMessage = createSOPExecutionMessage(
        `🔄 Continuing SOP execution...`,
        result
      )
      setMessages(prev => [...prev, executionMessage])

      // Handle different execution statuses
      if (result.status === 'needs_approval' && result.state_token) {
        // Parse SQL query from tool_output
        let sqlQuery = '';
        try {
          if (result.tool_output) {
            const toolOutput = JSON.parse(result.tool_output);
            if (toolOutput && toolOutput.query) {
              sqlQuery = toolOutput.query;
            } else {
              sqlQuery = result.tool_output;
            }
          }
        } catch (e) {
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
      else if (result.status === 'in_progress' && result.state_token) {
        const continueMessage = createContinueExecutionMessage(
          `✅ Step ${result.step + 1} completed successfully. Ready for next step.`,
          {
            state_token: result.state_token,
            step_description: result.step_description,
            tool_output: result.tool_output || ''
          }
        )
        setMessages(prev => [...prev, continueMessage])
      }
      else if (result.status === 'completed') {
        // SOP execution completed, show summary generation button
        const summaryMessage = createSummaryGenerationMessage(
          '🎉 All SOP steps completed successfully! Ready to generate execution summary.',
          {
            incident_id: 'UNKNOWN', // ExecutionResponse 中没有 incident_id，使用默认值
            completed_steps_count: result.completed_steps?.length || 0,
            execution_status: result.status
          }
        )
        setMessages(prev => [...prev, summaryMessage])
      }
    } catch (error: any) {
      console.error('Continue execution failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ Continue execution failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsLoading(false)
  }

  // Handle summary generation
  const handleGenerateSummary = async () => {
    setIsLoading(true)
    try {
      // 这里可以调用后端 API 来生成摘要
      // 目前先显示一个简单的成功消息
      const summaryMessage = createAssistantMessage(
        '📋 Execution summary generated successfully! Summary has been saved to the backend.',
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, summaryMessage])
    } catch (error: any) {
      console.error('Summary generation failed:', error)
      const errorMessage = createAssistantMessage(
        `❌ Summary generation failed: ${error.message}`,
        {} as IncidentReportResponse
      )
      setMessages(prev => [...prev, errorMessage])
    }
    setIsLoading(false)
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

        // Check if execution result needs another approval
        if (result.execution_result.status === 'needs_approval' && result.execution_result.state_token) {
          // Parse SQL query from tool_output
          let sqlQuery = '';
          try {
            if (result.execution_result.tool_output) {
              const toolOutput = JSON.parse(result.execution_result.tool_output);
              if (toolOutput && toolOutput.query) {
                sqlQuery = toolOutput.query;
              } else {
                sqlQuery = result.execution_result.tool_output; // If not JSON format, use directly
              }
            }
          } catch (e) {
            // If parsing fails, use original output
            sqlQuery = result.execution_result.tool_output || '';
          }

          const approvalMessage = createApprovalRequestMessage(
            `⚠️ Another high-risk operation detected, manual approval required`,
            {
              state_token: result.execution_result.state_token,
              query: sqlQuery,
              step_description: result.execution_result.step_description
            }
          )
          setMessages(prev => [...prev, approvalMessage])
        }

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
      await approveSOPExecution({
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
      // If execution status is in_progress, show continue button
      else if (result.status === 'in_progress' && result.state_token) {
        const continueMessage = createContinueExecutionMessage(
          `✅ Step ${result.step + 1} completed successfully. Ready for next step.`,
          {
            state_token: result.state_token,
            step_description: result.step_description,
            tool_output: result.tool_output || ''
          }
        )
        setMessages(prev => [...prev, continueMessage])
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
    <Box bg={bgColor} h="calc(100vh - 200px)" maxH="calc(100vh - 200px)" display="flex" flexDirection="column" overflow="hidden">
      {/* Status Bar */}
      <Box px={4} py={2} bg="gray.50" borderBottom="1px" borderColor={borderColor} flexShrink={0}>
        <HStack spacing={2} justify="center">
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
      </Box>

      {/* Chat Messages Area - Takes remaining space and scrolls internally */}
      <Box 
        flex={1} 
        overflowY="auto" 
        overflowX="hidden"
        display="flex"
        flexDirection="column"
        minH={0}
      >
        <ChatWindow 
          messages={messages} 
          onApprovalApprove={handleApprovalApprove}
          onApprovalReject={handleApprovalReject}
          onPlanConfirm={handlePlanConfirm}
          onContinueExecution={handleContinueExecution}
          onNextStepConfirm={handleNextStepConfirm}
          onGenerateSummary={handleGenerateSummary}
          incidentId={(messages.find(m => m.type === 'assistant' && (m as any).incidentReport?.incident_id) as any)?.incidentReport?.incident_id}
        />
      </Box>

      {/* Chat Input - Fixed at bottom, aligned with sidebar */}
      <Box 
        flexShrink={0}
        borderTop="1px" 
        borderColor={borderColor}
        bg={bgColor}
      >
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} disabled={isLoading} />
      </Box>

      {/* Database Connection Modal */}
      <DatabaseConnectionModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onConnectionSuccess={handleDatabaseConnectionSuccess}
      />
    </Box>
  )
}