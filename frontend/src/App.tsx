import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { theme } from './theme/theme'
import { IncidentParserPage } from './features/incident-parser/IncidentParserPage'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<IncidentParserPage />} />
          <Route path="/incident-parser" element={<IncidentParserPage />} />
        </Routes>
      </Router>
    </ChakraProvider>
  )
}

export default App
