import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  const applyToken = useCallback((t) => {
    if (t) {
      axios.defaults.headers.common.Authorization = `Bearer ${t}`
      localStorage.setItem('auth_token', t)
    } else {
      delete axios.defaults.headers.common.Authorization
      localStorage.removeItem('auth_token')
    }
  }, [])

  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)
    applyToken(null)
    localStorage.removeItem('auth_user')
  }, [applyToken])

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      applyToken(storedToken)

      try {
        const res = await api.get('/auth/me')
        const restoredUser = res.data?.user || null
        setToken(storedToken)
        setUser(restoredUser)

        if (restoredUser) {
          localStorage.setItem('auth_user', JSON.stringify(restoredUser))
        } else {
          localStorage.removeItem('auth_user')
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('Failed to restore session:', error)
        }
        clearSession()
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [applyToken, clearSession])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: authToken, user: authUser } = res.data

    setToken(authToken)
    setUser(authUser)
    applyToken(authToken)
    localStorage.setItem('auth_user', JSON.stringify(authUser))

    return authUser
  }, [applyToken])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Logout request failed:', error)
      }
    } finally {
      clearSession()
    }
  }, [clearSession])

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
