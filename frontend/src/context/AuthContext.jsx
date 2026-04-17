import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  const applyToken = useCallback((t) => {
    if (t) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
      localStorage.setItem('auth_token', t)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('auth_token')
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      applyToken(storedToken)
    }
    setLoading(false)
  }, [applyToken])

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token: t, user: u } = res.data
    setToken(t)
    setUser(u)
    applyToken(t)
    localStorage.setItem('auth_user', JSON.stringify(u))
    return u
  }, [applyToken])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    applyToken(null)
    localStorage.removeItem('auth_user')
  }, [applyToken])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
