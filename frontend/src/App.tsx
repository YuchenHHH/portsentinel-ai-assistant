import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { theme } from './theme/theme'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { IncidentParserPage } from './features/incident-parser/IncidentParserPage'
import { LandingPage } from './pages/LandingPage'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <IncidentParserPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/incident-parser" 
              element={
                <ProtectedRoute>
                  <IncidentParserPage />
                </ProtectedRoute>
              } 
            />
            {/* 添加默认重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App
