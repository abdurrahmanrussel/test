import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Verify JWT token and attach user to request
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    console.error('Token verification error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' })
    }
    
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

// Verify refresh token
export const authenticateRefreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    // Verify refresh token (using different secret)
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    console.error('Refresh token verification error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid refresh token' })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Refresh token expired' })
    }
    
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

// CSRF Protection - Validate CSRF token
export const validateCSRFToken = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token']
  
  if (!csrfToken) {
    return res.status(403).json({ error: 'CSRF token required' })
  }

  // Get token from cookie (set by server)
  const cookieCSRFToken = req.cookies?.csrf_token

  if (!cookieCSRFToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }

  // Verify CSRF token matches
  if (csrfToken !== cookieCSRFToken) {
    return res.status(403).json({ error: 'CSRF token mismatch' })
  }

  next()
}

// Generate CSRF token
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Check if user has required role
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRole: allowedRoles,
        userRole: req.user.role 
      })
    }

    next()
  }
}

// Admin only middleware shortcut
export const isAdmin = requireRole('admin')

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      }
    }

    next()
  } catch (error) {
    // Token is optional, so continue even if verification fails
    next()
  }
}

// Check if email is verified
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      message: 'Please verify your email address' 
    })
  }

  next()
}

export default {
  authenticateToken,
  authenticateRefreshToken,
  validateCSRFToken,
  generateCSRFToken,
  requireRole,
  isAdmin,
  optionalAuth,
  requireVerifiedEmail,
}