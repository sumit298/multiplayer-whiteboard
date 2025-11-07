import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './LoginPage'
import Whiteboard from './Whiteboard'

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/whiteboard" element={<Whiteboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
