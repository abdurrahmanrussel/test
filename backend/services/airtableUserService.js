import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local for development, .env for production
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env') 
  : path.join(__dirname, '../.env.local')
dotenv.config({ path: envPath })

import fetch from 'node-fetch'
import dns from 'dns'
import https from 'https'
import crypto from 'crypto'

dns.setDefaultResultOrder('ipv4first')

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 20000,
  family: 4,
})

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_PAT = process.env.AIRTABLE_PAT
const USERS_TABLE_ID = process.env.AIRTABLE_USERS_TABLE_ID

console.log('=== AIRTABLE SERVICE INIT ===')
console.log('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID)
console.log('AIRTABLE_PAT:', AIRTABLE_PAT ? '*** (exists)' : 'MISSING')
console.log('AIRTABLE_USERS_TABLE_ID:', USERS_TABLE_ID)
console.log('================================')

// Helper function to make Airtable API calls
const airtableFetch = async (endpoint, options = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        agent: httpsAgent,
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Airtable request timeout')
    }
    throw error
  }
}

// Find user by email
export const findUserByEmail = async (email) => {
  try {
    const url = `${encodeURIComponent(USERS_TABLE_ID)}?filterByFormula={Email}="${email}"`
    console.log('Fetching user from:', url)
    
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to fetch user')
    }

    const data = await response.json()
    
    if (!data.records || data.records.length === 0) {
      return null
    }

    return data.records[0]
  } catch (error) {
    console.error('Error finding user by email:', error)
    throw error
  }
}

// Create new user
export const createUser = async (userData) => {
  try {
    const { name, email, password, role = 'user' } = userData

    const requestBody = {
      records: [
        {
          fields: {
            Name: name,
            Email: email,
            Password: password,
            Role: role,
            IsActive: true,
          },
        },
      ],
    }

    console.log('Creating user with data:', JSON.stringify(requestBody, null, 2))

    const response = await airtableFetch(encodeURIComponent(USERS_TABLE_ID), {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Airtable create user error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to create user')
    }

    const data = await response.json()
    console.log('User created successfully:', data)
    return data.records[0]
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Update user by ID
export const updateUser = async (userId, fields) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(USERS_TABLE_ID)}/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to update user')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Generate reset token
export const setResetToken = async (userId) => {
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

  await updateUser(userId, {
    ResetToken: resetToken,
    ResetTokenExpiry: resetTokenExpiry.toISOString(),
  })

  return resetToken
}

// Verify and clear reset token
export const verifyResetToken = async (userId, token) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(USERS_TABLE_ID)}/${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    const data = await response.json()
    const user = data

    if (user.fields.ResetToken !== token) {
      throw new Error('Invalid reset token')
    }

    const expiry = new Date(user.fields.ResetTokenExpiry)
    if (expiry < new Date()) {
      throw new Error('Reset token has expired')
    }

    // Clear the reset token (use null for date fields)
    await updateUser(userId, {
      ResetToken: null,
      ResetTokenExpiry: null,
    })

    return true
  } catch (error) {
    console.error('Error verifying reset token:', error)
    throw error
  }
}

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(USERS_TABLE_ID)}/${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting user by ID:', error)
    throw error
  }
}

// Generate refresh token
export const setRefreshToken = async (userId) => {
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await updateUser(userId, {
    RefreshToken: refreshToken,
    RefreshTokenExpiry: refreshTokenExpiry.toISOString(),
  })

  return refreshToken
}

// Verify refresh token
export const verifyRefreshToken = async (userId, token) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(USERS_TABLE_ID)}/${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    const data = await response.json()
    const user = data

    if (user.fields.RefreshToken !== token) {
      throw new Error('Invalid refresh token')
    }

    const expiry = new Date(user.fields.RefreshTokenExpiry)
    if (expiry < new Date()) {
      throw new Error('Refresh token expired')
    }

    return true
  } catch (error) {
    console.error('Error verifying refresh token:', error)
    throw error
  }
}

// Clear refresh token (logout/invalidate sessions)
export const clearRefreshToken = async (userId) => {
  console.log(`[clearRefreshToken] Attempting to clear refresh token for user: ${userId}`)
  
  try {
    const result = await updateUser(userId, {
      RefreshToken: null,
      RefreshTokenExpiry: null,
    })
    console.log(`[clearRefreshToken] Successfully cleared refresh token for user: ${userId}`)
    console.log(`[clearRefreshToken] Result:`, JSON.stringify(result, null, 2))
    return result
  } catch (error) {
    console.error(`[clearRefreshToken] Error clearing refresh token for user ${userId}:`, error)
    throw error
  }
}

// Generate email verification token
export const setEmailVerificationToken = async (userId) => {
  const verificationToken = crypto.randomBytes(32).toString('hex')

  await updateUser(userId, {
    EmailVerificationToken: verificationToken,
  })

  return verificationToken
}

// Verify email
export const verifyEmail = async (userId) => {
  await updateUser(userId, {
    IsEmailVerified: true,
    EmailVerificationToken: null,
  })
}

// Delete user account
export const deleteUser = async (userId) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(USERS_TABLE_ID)}/${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete user')
    }

    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

// Get all users
export const getAllUsers = async () => {
  try {
    const url = encodeURIComponent(USERS_TABLE_ID)
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to fetch users')
    }

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error('Error fetching all users:', error)
    throw error
  }
}

export default {
  findUserByEmail,
  createUser,
  updateUser,
  setResetToken,
  verifyResetToken,
  getUserById,
  setRefreshToken,
  verifyRefreshToken,
  clearRefreshToken,
  setEmailVerificationToken,
  verifyEmail,
  deleteUser,
  getAllUsers,
}
