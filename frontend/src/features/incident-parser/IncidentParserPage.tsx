import React, { useState } from 'react'
import { Box, Container, Heading, VStack, HStack, Button, Badge, Text, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import DatabaseConnectionModal from './components/DatabaseConnectionModal'
import { useAuth } from '../../contexts/AuthContext'
import { parseIncidentReport, matchHistoryCases, enrichIncident, fetchExecutionPlan, executeSOPPlan, approveSOPExecution, continueSOPExecution, getDatabaseStatus } from '../../services/api'
import { getLatestSummaryMarkdown } from '../../services/executionSummaryApi'
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
  createMarkdownMessage,
  ChatMessage 
} from '../../types/chat'

const MotionBox = motion(Box)

interface IncidentParserPageProps {
  onBack?: () => void
}

export const IncidentParserPage: React.FC<IncidentParserPageProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingApproval, setIsProcessingApproval] = useState(false)
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<any>({ success: false, message: 'Checking connection status...' })
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (text: string, sourceType: 'Email' | 'SMS' | 'Call') => {
    setIsLoading(true)

    const userMessage = createUserMessage(text, sourceType)
    const parsingLoadingMessage = createLoadingMessage('Parsing incident report...')
    setMessages((prev) => [...prev, userMessage, parsingLoadingMessage])

    try {
      const parsedResult: IncidentReportResponse = await parseIncidentReport({
        source_type: sourceType,
        raw_text: text,
      })

      const assistantMessage = createAssistantMessage(
        'Incident parsing completed. Here are the parsing results:',
        parsedResult
      )

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parsingLoadingMessage.id ? assistantMessage : msg
        )
      )

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

  const handleNextStepConfirm = async (parsedResult: IncidentReportResponse) => {
    setIsLoading(true)
    try {
      const historyLoadingMessage = createLoadingMessage('Matching historical cases...')
      setMessages((prev) => [...prev, historyLoadingMessage])

      try {
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

        const historyResult = await matchHistoryCases(historyRequest)
        const historyMessage = createHistoryMatchMessage(
          'Historical case matching completed. Here are similar historical cases:',
          historyResult
        )

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
        return
      }

      const ragLoadingMessage = createLoadingMessage('Retrieving knowledge base...')
      setMessages((prev) => [...prev, ragLoadingMessage])

      try {
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

          const enrichmentResult = await enrichIncident(enrichmentRequest)
          const enrichmentMessage = createEnrichmentMessage(
            'Knowledge base retrieval completed. Here are relevant SOP suggestions:',
            enrichmentResult
          )

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === ragLoadingMessage.id ? enrichmentMessage : msg
            )
          )

          const planLoadingMessage = createLoadingMessage('Generating execution plan...')
          setMessages((prev) => [...prev, planLoadingMessage])

        try {
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

          const planResult = await fetchExecutionPlan(planRequest)

          if (planResult.success && planResult.plan.length > 0) {
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

            setMessages((prev) => [
              ...prev.filter((msg) => msg.id !== planLoadingMessage.id),
              planConfirmationMessage
            ])
          } else {
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

  const handleContinueExecution = async (stateToken: string) => {
    setIsLoading(true)
    try {
      const result = await continueSOPExecution({ state_token: stateToken })
      
      const executionMessage = createSOPExecutionMessage(
        `🔄 Continuing SOP execution...`,
        result
      )
      setMessages(prev => [...prev, executionMessage])

      if (result.status === 'needs_approval' && result.state_token) {
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

  const handleApprovalApprove = async (stateToken: string, approvedQuery: string) => {
    setIsProcessingApproval(true)
    try {
      const result = await approveSOPExecution({
        state_token: stateToken,
        approved_query: approvedQuery,
        approved: true
      })

      if (result.success && result.execution_result) {
        console.log('Approval execution result:', result.execution_result)
        console.log('completed_steps count:', result.execution_result.completed_steps?.length)
        const executionMessage = createSOPExecutionMessage(
          `✅ Operation approved and executed successfully`,
          result.execution_result
        )
        setMessages(prev => [...prev, executionMessage])

        if (result.execution_result.status === 'needs_approval' && result.execution_result.state_token) {
          let sqlQuery = '';
          try {
            if (result.execution_result.tool_output) {
              const toolOutput = JSON.parse(result.execution_result.tool_output);
              if (toolOutput && toolOutput.query) {
                sqlQuery = toolOutput.query;
              } else {
                sqlQuery = result.execution_result.tool_output;
              }
            }
          } catch (e) {
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
        // Check if execution result is completed and show summary generation button
        else if (result.execution_result.status === 'completed') {
          const summaryMessage = createSummaryGenerationMessage(
            '🎉 All SOP steps completed successfully! Ready to generate execution summary.',
            {
              incident_id: 'UNKNOWN',
              completed_steps_count: result.execution_result.completed_steps?.length || 0,
              execution_status: result.execution_result.status
            }
          )
          setMessages(prev => [...prev, summaryMessage])
        }
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

  const handlePlanConfirm = async (plan: string[], incidentContext: Record<string, any>) => {
    setIsLoading(true)
    try {
      const executionRequest = {
        plan: plan,
        incident_context: incidentContext
      }

      const result = await executeSOPPlan(executionRequest)
      
      const executionMessage = createSOPExecutionMessage(
        `🚀 Starting SOP plan execution with ${plan.length} steps`,
        result
      )
      setMessages(prev => [...prev, executionMessage])

      if (result.status === 'needs_approval' && result.state_token) {
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
            incident_id: 'UNKNOWN',
            completed_steps_count: result.completed_steps?.length || 0,
            execution_status: result.status
          }
        )
        setMessages(prev => [...prev, summaryMessage])
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

  // Handle summary generation
  const handleGenerateSummary = async () => {
    setIsLoading(true)
    try {
      // 获取最新的摘要Markdown内容
      const markdownResult = await getLatestSummaryMarkdown()
      
      if (markdownResult.success) {
        // 创建Markdown消息
        const markdownMessage = createMarkdownMessage(
          '📋 Execution summary generated successfully!',
          {
            file_name: markdownResult.file_name,
            incident_id: markdownResult.incident_id,
            markdown_content: markdownResult.markdown_content
          }
        )
        setMessages(prev => [...prev, markdownMessage])
      } else {
        const errorMessage = createAssistantMessage(
          '❌ Failed to retrieve execution summary content.',
          {} as IncidentReportResponse
        )
        setMessages(prev => [...prev, errorMessage])
      }
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

  const checkDatabaseStatus = async () => {
    try {
      const status = await getDatabaseStatus()
      setDatabaseStatus(status)
    } catch (error) {
      setDatabaseStatus({ success: false, message: 'Database not connected' })
    }
  }

  const handleDatabaseConnectionSuccess = () => {
    checkDatabaseStatus()
  }

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack()
      return
    }
    navigate('/dashboard')
  }

  React.useEffect(() => {
    checkDatabaseStatus()
  }, [])

  
  return (
    <Box 
      position="fixed"
      top="7%"
      left={0}
      right={0}
      bottom={0}
      bg={bgColor} 
      display="flex" 
      flexDirection="column"
    >
      {/* Status Bar */}
      <Box px={4} py={2} bg="gray.50" borderBottom="1px" borderColor={borderColor} flexShrink={0}>
        <HStack spacing={2} justify="space-between">
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={handleBackToDashboard}
            leftIcon={<span>←</span>}
          >
            Back to Dashboard
          </Button>
          
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
        </HStack>
      </Box>
  
      {/* Chat Messages Area */}
      <Box 
        flex={1}
        overflow="hidden"
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
  
      {/* Chat Input */}
      {messages.length === 0 && (
        <Box 
          flexShrink={0}
          borderTop="1px" 
          borderColor={borderColor}
          bg={bgColor}
        >
          <ChatInput onSubmit={handleSubmit} isLoading={isLoading} disabled={isLoading} />
        </Box>
      )}
  
      {/* Database Connection Modal */}
      <DatabaseConnectionModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onConnectionSuccess={handleDatabaseConnectionSuccess}
      />
    </Box>
  )
}