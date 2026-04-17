import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MailApp from './pages/MailApp.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import './App.css'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return isAuthenticated ? <Navigate to="/inbox" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inbox" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><MailApp folder="inbox" /></ProtectedRoute>} />
      <Route path="/inbox/:id" element={<ProtectedRoute><MailApp folder="inbox" /></ProtectedRoute>} />
      <Route path="/sent" element={<ProtectedRoute><MailApp folder="sent" /></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><MailApp folder="drafts" /></ProtectedRoute>} />
      <Route path="/trash" element={<ProtectedRoute><MailApp folder="trash" /></ProtectedRoute>} />
      <Route path="/spam" element={<ProtectedRoute><MailApp folder="spam" /></ProtectedRoute>} />
      <Route path="/compose" element={<ProtectedRoute><MailApp folder="inbox" compose={true} /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
