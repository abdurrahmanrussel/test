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
  const [refreshToken, setRefreshToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load user from localStorage on mount and fetch fresh data
  useEffect(() => {
    const loadUserData = async () => {
      const storedToken = localStorage.getItem('token')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken)
        }
        setUser(JSON.parse(storedUser))
        
        // Fetch fresh user data from backend
        try {
          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
          const response = await fetch(`${backendUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          }
        } catch (error) {
          console.error('Failed to fetch fresh user data:', error)
        }
      }

      setIsLoading(false)
    }
    
    loadUserData()
  }, [])

  // Update localStorage when tokens/user changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('refreshToken')
    }
  }, [token, refreshToken, user])

  const login = (accessToken, userData, newRefreshToken = null) => {
    setToken(accessToken)
    setUser(userData)
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken)
    }
  }

  const logout = async () => {
    try {
      // Clear refresh token on server (uses authenticated user ID)
      if (token) {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with logout even if server call fails
    } finally {
      // Clear all tokens and user data
      setToken(null)
      setRefreshToken(null)
      setUser(null)
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
  }

  // Refresh access token
  const refreshAccessToken = async () => {
    if (isRefreshing || !refreshToken) {
      return null
    }

    setIsRefreshing(true)

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Refresh token is invalid or expired, logout
        logout()
        return null
      }

      // Update tokens with new ones
      setToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setUser(data.user)

      return data.accessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      // On error, logout
      logout()
      return null
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch wrapper that handles token refresh
  const authenticatedFetch = async (url, options = {}) => {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    })

    // If 401 (unauthorized), try to refresh token
    if (response.status === 401 && refreshToken && !isRefreshing) {
      const newToken = await refreshAccessToken()
      
      if (newToken) {
        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        })
      }
    }

    return response
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
    refreshToken,
    isAuthenticated,
    isLoading,
    isRefreshing,
    hasRole,
    login,
    logout,
    updateUser,
    refreshAccessToken,
    authenticatedFetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}