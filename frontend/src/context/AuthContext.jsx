import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  // Update localStorage when token/user changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [token, user])

  const login = (newToken, userData) => {
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  const isAuthenticated = !!token && !!user

  const hasRole = (roles) => {
    if (!user || !user.role) return false
    if (Array.isArray(roles)) {
      return roles.includes(user.role)
    }
    return user.role === roles
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    hasRole,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}