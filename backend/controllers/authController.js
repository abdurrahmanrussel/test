import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import * as userService from '../services/airtableUserService.js'
import * as emailService from '../services/emailService.js'

// Validation rules
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
]

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
]

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Register new user
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      })
    }

    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const newUser = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    })

    // Generate verification token
    const verificationToken = await userService.setEmailVerificationToken(newUser.id)

    // Send verification email
    try {
      await emailService.sendEmailVerificationEmail(email, verificationToken, name)
      console.log(`Verification email sent to ${email}`)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue with registration even if email fails
    }

    // Generate token
    const token = generateToken(newUser.id, email, 'user')

    // Return success response (without password)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.fields.Name,
        email: newUser.fields.Email,
        role: newUser.fields.Role,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      })
    }

    const { email, password } = req.body

    // Find user
    const user = await userService.findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      })
    }

    // Check if email is verified
    if (!user.fields.IsEmailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in.',
        needsEmailVerification: true,
        email: user.fields.Email
      })
    }

    // Check if user is active
    if (!user.fields.IsActive) {
      return res.status(403).json({ 
        error: 'Account is deactivated. Please contact support.' 
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.fields.Password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      })
    }

    // Generate token
    const token = generateToken(user.id, email, user.fields.Role)

    // Return success response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.fields.Name,
        email: user.fields.Email,
        role: user.fields.Role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    })
  }
}

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        name: user.fields.Name,
        email: user.fields.Email,
        role: user.fields.Role,
        createdAt: user.fields.CreatedAt,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message 
    })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const updatedUser = await userService.updateUser(req.user.id, {
      Name: name.trim(),
    })

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.fields.Name,
        email: updatedUser.fields.Email,
        role: updatedUser.fields.Role,
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: error.message 
    })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'All password fields are required' 
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'New passwords do not match' 
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      })
    }

    // Get current user
    const user = await userService.getUserById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.fields.Password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12)
    const hashedNewPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await userService.updateUser(req.user.id, {
      Password: hashedNewPassword,
    })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ 
      error: 'Failed to change password',
      message: error.message 
    })
  }
}

// Logout with refresh token clearing
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (refreshToken) {
      try {
        // Decode refresh token to get user ID
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
        // Clear refresh token from database
        await userService.clearRefreshToken(decoded.userId)
      } catch (error) {
        // Token might be invalid/expired, but still proceed with logout
        console.log('Refresh token already invalid or expired during logout')
      }
    }

    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
    
    // Verify token in database
    try {
      await userService.verifyRefreshToken(decoded.userId, refreshToken)
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' })
    }

    // Get user data
    const user = await userService.getUserById(decoded.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate new access token
    const accessToken = generateToken(
      user.id,
      user.fields.Email,
      user.fields.Role
    )

    // Generate new refresh token (token rotation)
    const newRefreshToken = await userService.setRefreshToken(user.id)

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.fields.Name,
        email: user.fields.Email,
        role: user.fields.Role,
      },
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(403).json({ error: 'Failed to refresh token' })
  }
}

// Resend email verification
export const resendVerification = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.fields.IsEmailVerified) {
      return res.status(400).json({ 
        error: 'Email is already verified' 
      })
    }

    // Generate verification token
    const verificationToken = await userService.setEmailVerificationToken(user.id)

    // Send verification email
    await emailService.sendEmailVerificationEmail(user.fields.Email, verificationToken)

    res.json({ 
      message: 'Verification email sent successfully' 
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ 
      error: 'Failed to send verification email',
      message: error.message 
    })
  }
}

// Verify email with token
export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body

    if (!token || !email) {
      return res.status(400).json({ 
        error: 'Token and email are required' 
      })
    }

    // Find user by email
    const user = await userService.findUserByEmail(email)
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      })
    }

    // Verify token
    if (user.fields.EmailVerificationToken !== token) {
      return res.status(400).json({ 
        error: 'Invalid verification token' 
      })
    }

    // Mark email as verified
    await userService.verifyEmail(user.id)

    res.json({ 
      message: 'Email verified successfully. You can now login.' 
    })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ 
      error: 'Failed to verify email',
      message: error.message 
    })
  }
}

// Change email
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body

    // Validate inputs
    if (!newEmail || !password) {
      return res.status(400).json({ 
        error: 'New email and password are required' 
      })
    }

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      })
    }

    // Check if new email already exists
    const existingUser = await userService.findUserByEmail(newEmail)
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already in use' 
      })
    }

    // Verify current password
    const user = await userService.getUserById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.fields.Password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      })
    }

    // Update email
    const updatedUser = await userService.updateUser(req.user.id, {
      Email: newEmail,
      IsEmailVerified: false, // Require re-verification
    })

    // Send verification email for new email
    const verificationToken = await userService.setEmailVerificationToken(updatedUser.id)
    await emailService.sendEmailVerificationEmail(newEmail, verificationToken)

    res.json({ 
      message: 'Email changed successfully. Please verify your new email address.' 
    })
  } catch (error) {
    console.error('Change email error:', error)
    res.status(500).json({ 
      error: 'Failed to change email',
      message: error.message 
    })
  }
}

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmDelete } = req.body

    if (confirmDelete !== 'DELETE') {
      return res.status(400).json({ 
        error: 'Please type DELETE to confirm account deletion' 
      })
    }

    if (!password) {
      return res.status(400).json({ 
        error: 'Password is required to delete account' 
      })
    }

    // Get user
    const user = await userService.getUserById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.fields.Password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Password is incorrect' 
      })
    }

    // Delete user
    await userService.deleteUser(req.user.id)

    res.json({ 
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ 
      error: 'Failed to delete account',
      message: error.message 
    })
  }
}

// Forgot password - send reset email
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      })
    }

    const { email } = req.body

    // Check if user exists
    const user = await userService.findUserByEmail(email)
    
    // Always return success (even if user doesn't exist) to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      })
    }

    // Generate reset token
    const resetToken = await userService.setResetToken(user.id)

    // Send email
    await emailService.sendPasswordResetEmail(email, resetToken)

    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    // Still return success to prevent email enumeration
    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    })
  }
}

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      })
    }

    const { email, token, password, confirmPassword } = req.body

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      })
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      })
    }

    // Find user by email
    const user = await userService.findUserByEmail(email)
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      })
    }

    // Verify reset token
    try {
      await userService.verifyResetToken(user.id, token)
    } catch (error) {
      return res.status(400).json({ 
        error: error.message || 'Invalid or expired reset token' 
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update password
    await userService.updateUser(user.id, {
      Password: hashedPassword,
    })

    res.json({ 
      message: 'Password reset successful. You can now login with your new password.' 
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ 
      error: 'Failed to reset password',
      message: error.message 
    })
  }
}

// Validation for forgot password
export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
]

// Validation for reset password
export const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Token is required'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
]

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  resendVerification,
  verifyEmail,
  changeEmail,
  deleteAccount,
  forgotPassword,
  resetPassword,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
}
