import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

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
const PROMO_CODES_TABLE_ID = 'Promo Codes'

console.log('=== AIRTABLE PROMO CODE SERVICE INIT ===')
console.log('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID)
console.log('PROMO_CODES_TABLE_ID:', PROMO_CODES_TABLE_ID)
console.log('========================================')

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

// Get all promo codes
export const getAllPromoCodes = async () => {
  try {
    console.log(`[getAllPromoCodes] Fetching from table: ${PROMO_CODES_TABLE_ID}`)
    const url = encodeURIComponent(PROMO_CODES_TABLE_ID)
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('[getAllPromoCodes] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to fetch promo codes')
    }

    const data = await response.json()
    console.log(`[getAllPromoCodes] Found ${data.records?.length || 0} promo codes`)
    return data.records || []
  } catch (error) {
    console.error('[getAllPromoCodes] Error:', error)
    throw error
  }
}

// Get promo code by ID
export const getPromoCodeById = async (promoCodeId) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(PROMO_CODES_TABLE_ID)}/${promoCodeId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch promo code')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting promo code by ID:', error)
    throw error
  }
}

// Create new promo code
export const createPromoCode = async (promoCodeData) => {
  try {
    const { 
      promoCode, 
      discountType, 
      discountValue, 
      expiryDate, 
      maxUses, 
      timesUsed = 0,
      isActive = true,
      applicableProducts = [],
      minimumPurchase,
      createdAt
    } = promoCodeData

    // Convert applicableProducts array to comma-separated string for multiline text field
    const applicableProductsString = Array.isArray(applicableProducts) 
      ? applicableProducts.join(', ')
      : applicableProducts

    const requestBody = {
      records: [
        {
          fields: {
            'Promo Code': promoCode,
            'Discount Type': discountType,
            'Discount Value': parseFloat(discountValue),
            'Expiry Date': expiryDate,
            'Max Uses': parseInt(maxUses) || null,
            'Times Used': parseInt(timesUsed) || 0,
            IsActive: isActive === true || isActive === 'true' ? true : false,
            'Applicable Products': applicableProductsString,
            'Minimum Purchase': minimumPurchase ? parseFloat(minimumPurchase) : null,
            'Created At': createdAt || new Date().toISOString().split('T')[0],
          },
        },
      ],
    }

    console.log('[createPromoCode] Creating promo code with data:', JSON.stringify(requestBody, null, 2))

    const response = await airtableFetch(encodeURIComponent(PROMO_CODES_TABLE_ID), {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[createPromoCode] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to create promo code')
    }

    const data = await response.json()
    console.log('[createPromoCode] Promo code created successfully:', data)
    return data.records[0]
  } catch (error) {
    console.error('[createPromoCode] Error:', error)
    throw error
  }
}

// Update promo code
export const updatePromoCode = async (promoCodeId, promoCodeData) => {
  try {
    const fields = {}

    if (promoCodeData.promoCode !== undefined) fields['Promo Code'] = promoCodeData.promoCode
    if (promoCodeData.discountType !== undefined) fields['Discount Type'] = promoCodeData.discountType
    if (promoCodeData.discountValue !== undefined) fields['Discount Value'] = parseFloat(promoCodeData.discountValue)
    if (promoCodeData.expiryDate !== undefined) fields['Expiry Date'] = promoCodeData.expiryDate
    if (promoCodeData.maxUses !== undefined) fields['Max Uses'] = parseInt(promoCodeData.maxUses) || null
    if (promoCodeData.timesUsed !== undefined) fields['Times Used'] = parseInt(promoCodeData.timesUsed) || 0
    
    // Handle IsActive - convert to boolean for Airtable checkbox field
    if (promoCodeData.isActive !== undefined) {
      console.log('[updatePromoCode] isActive value:', promoCodeData.isActive, 'type:', typeof promoCodeData.isActive)
      fields.IsActive = promoCodeData.isActive === true || promoCodeData.isActive === 'true' ? true : false
    }
    
    // Convert applicableProducts array to comma-separated string for multiline text field
    if (promoCodeData.applicableProducts !== undefined) {
      const applicableProductsString = Array.isArray(promoCodeData.applicableProducts) 
        ? promoCodeData.applicableProducts.join(', ')
        : promoCodeData.applicableProducts
      fields['Applicable Products'] = applicableProductsString
    }
    if (promoCodeData.minimumPurchase !== undefined) fields['Minimum Purchase'] = promoCodeData.minimumPurchase ? parseFloat(promoCodeData.minimumPurchase) : null
    if (promoCodeData.createdAt !== undefined) fields['Created At'] = promoCodeData.createdAt

    console.log('[updatePromoCode] Updating promo code with fields:', JSON.stringify(fields, null, 2))

    const response = await airtableFetch(`${encodeURIComponent(PROMO_CODES_TABLE_ID)}/${promoCodeId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[updatePromoCode] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to update promo code')
    }

    const data = await response.json()
    console.log('[updatePromoCode] Promo code updated successfully:', data)
    return data
  } catch (error) {
    console.error('[updatePromoCode] Error:', error)
    throw error
  }
}

// Delete promo code
export const deletePromoCode = async (promoCodeId) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(PROMO_CODES_TABLE_ID)}/${promoCodeId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete promo code')
    }

    return true
  } catch (error) {
    console.error('Error deleting promo code:', error)
    throw error
  }
}

export default {
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
}