import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

function getDebugErrorContext(error) {
  return {
    message: error?.message,
    status: error?.response?.status,
    apiError: error?.response?.data?.error || error?.response?.data?.message,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  const applyToken = useCallback((t) => {
    if (t) {
      localStorage.setItem('auth_token', t)
    } else {
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
    let isMounted = true

    async function restoreSession() {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      applyToken(storedToken)

      try {
        const res = await api.get('/auth/me')
        const restoredUser = res.data?.user || null
        if (isMounted) {
          setToken(storedToken)
          setUser(restoredUser)
        }

        if (restoredUser) {
          localStorage.setItem('auth_user', JSON.stringify(restoredUser))
        } else {
          localStorage.removeItem('auth_user')
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('Failed to restore session:', getDebugErrorContext(error))
        }
        if (isMounted) {
          clearSession()
        } else {
          applyToken(null)
          localStorage.removeItem('auth_user')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    restoreSession()
    return () => {
      isMounted = false
    }
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
        console.debug('Logout request failed:', getDebugErrorContext(error))
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
