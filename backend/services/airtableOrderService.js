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

dns.setDefaultResultOrder('ipv4first')

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 20000,
  family: 4,
})

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_PAT = process.env.AIRTABLE_PAT
const ORDERS_TABLE_ID = process.env.AIRTABLE_ORDERS_TABLE_ID

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

// Get all orders
export const getAllOrders = async () => {
  try {
    const url = encodeURIComponent(ORDERS_TABLE_ID)
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to fetch orders')
    }

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

// Normalize email (remove dots for Gmail, convert to lowercase)
const normalizeEmail = (email) => {
  if (!email) return email
  const normalized = email.toLowerCase().trim()
  // For Gmail, remove ALL dots in the local part (before @)
  return normalized.replace(/^([^@]+)\.?.*@gmail\.com$/i, (match, localPart) => {
    return localPart.replace(/\./g, '') + '@gmail.com'
  })
}

// Get orders by user email
export const getOrdersByUserId = async (userEmail) => {
  try {
    const normalizedEmail = normalizeEmail(userEmail)
    console.log('[getOrdersByUserId] Searching for orders with normalized email:', normalizedEmail)
    
    // Filter by Customer Email field (simple match, emails are normalized)
    const url = `${encodeURIComponent(ORDERS_TABLE_ID)}?filterByFormula=LOWER({Customer Email})="${normalizedEmail.toLowerCase()}"`
    
    console.log('[getOrdersByUserId] Airtable query URL:', url)
    
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('[getOrdersByUserId] Airtable error:', error)
      throw new Error(error.error?.message || 'Failed to fetch orders')
    }

    const data = await response.json()
    console.log(`[getOrdersByUserId] Found ${data.records?.length || 0} orders`)
    
    // Log all orders found (or none)
    if (data.records && data.records.length > 0) {
      data.records.forEach((order, index) => {
        console.log(`[getOrdersByUserId] Order ${index + 1}:`, {
          id: order.id,
          email: order.fields['Customer Email'],
          product: order.fields['Product Name']
        })
      })
    } else {
      console.log('[getOrdersByUserId] No orders found')
      console.log('[getOrdersByUserId] Hint: Check if email in orders table matches:', userEmail)
    }
    
    return data.records || []
  } catch (error) {
    console.error('[getOrdersByUserId] Error:', error)
    throw error
  }
}

// Create new order
export const createOrder = async (orderData) => {
  try {
    const { userId, productId, productName, amount, stripePaymentId, status = 'completed', customerEmail, customerName, contactInfo, cardHolder } = orderData

    // Build fields object
    const fields = {
      'Product ID': productId,
      'Product Name': productName,
      Amount: amount,
      Status: status,
      'Stripe Payment ID': stripePaymentId,
    }

    // Note: Airtable automatically adds 'createdTime' to every record
    // If you want a separate Purchase Date field, make sure it's configured correctly
    // For Date+Time field in Airtable, use: new Date().toISOString().replace('Z', '+00:00')
    // For now, we'll rely on Airtable's auto-created timestamp (createdTime)

    // Add customer email from user account (NORMALIZED to match Users table)
    // Always include field even if empty - allows Airtable to display it
    if (customerEmail && customerEmail.trim() !== '') {
      const normalizedEmail = normalizeEmail(customerEmail)
      console.log('[createOrder] Customer Email (user account):', customerEmail, '→', normalizedEmail)
      fields['Customer Email'] = normalizedEmail
    } else {
      console.log('[createOrder] Customer Email is empty (no user account or not provided)')
      fields['Customer Email'] = '' // Still send field to Airtable
    }

    // Add customer name from user account
    // Always include field even if empty - allows Airtable to display it
    if (customerName && customerName.trim() !== '') {
      console.log('[createOrder] Customer Name (user account):', customerName)
      fields['Customer Name'] = customerName
    } else {
      console.log('[createOrder] Customer Name is empty (no user account or not provided)')
      fields['Customer Name'] = '' // Still send field to Airtable
    }

    // Add contact info from Stripe checkout
    if (contactInfo && contactInfo.trim() !== '') {
      console.log('[createOrder] Contact Info (Stripe):', contactInfo)
      fields['Contact Info'] = contactInfo
    }

    // Add card holder name from Stripe
    if (cardHolder && cardHolder.trim() !== '') {
      console.log('[createOrder] Card Holder (Stripe):', cardHolder)
      fields['Card Holder'] = cardHolder
    }

    // Note: User field linkage removed - using email matching only
    // If you want to use User field, configure it in Airtable to link to Users table

    const requestBody = {
      records: [
        {
          fields,
        },
      ],
    }

    const response = await airtableFetch(encodeURIComponent(ORDERS_TABLE_ID), {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Airtable create order error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to create order')
    }

    const data = await response.json()
    return data.records[0]
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(ORDERS_TABLE_ID)}/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          Status: status,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to update order')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

// Get order statistics
export const getOrderStats = async () => {
  try {
    const orders = await getAllOrders()
    
    // Only count 'completed' orders for revenue
    const completedOrders = orders.filter(o => o.fields.Status === 'completed')
    
    const stats = {
      totalOrders: orders.length,
      totalRevenue: completedOrders.reduce((sum, order) => {
        const amount = order.fields.Amount || 0
        return sum + amount
      }, 0),
      completedOrders: completedOrders.length,
      pendingOrders: orders.filter(o => o.fields.Status === 'pending').length,
      refundedOrders: orders.filter(o => o.fields.Status === 'refunded').length,
    }

    return stats
  } catch (error) {
    console.error('Error calculating order stats:', error)
    throw error
  }
}

export default {
  getAllOrders,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  getOrderStats,
}