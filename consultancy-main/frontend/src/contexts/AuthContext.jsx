import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) return
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    ;(async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
      } catch {
        setUser(null)
        setToken('')
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const t = res.data.token
    setToken(t)
    localStorage.setItem('token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setUser(res.data.user)
  }

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password })
    const t = res.data.token
    setToken(t)
    localStorage.setItem('token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setUser(res.data.user)
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const value = useMemo(() => ({ user, token, loading, login, signup, logout }), [user, token, loading])

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
