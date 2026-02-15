import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

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
const PRODUCTS_TABLE_ID = process.env.AIRTABLE_TABLE_NAME

console.log('=== AIRTABLE PRODUCT SERVICE INIT ===')
console.log('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID)
console.log('PRODUCTS_TABLE_ID:', PRODUCTS_TABLE_ID)
console.log('=====================================')

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

// Get all products
export const getAllProducts = async () => {
  try {
    console.log(`[getAllProducts] Fetching from table: ${PRODUCTS_TABLE_ID}`)
    const url = encodeURIComponent(PRODUCTS_TABLE_ID)
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('[getAllProducts] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to fetch products')
    }

    const data = await response.json()
    console.log(`[getAllProducts] Found ${data.records?.length || 0} products`)
    return data.records || []
  } catch (error) {
    console.error('[getAllProducts] Error:', error)
    throw error
  }
}

// Get products by type
export const getProductsByType = async (type) => {
  try {
    console.log(`[getProductsByType] Fetching ${type} from table: ${PRODUCTS_TABLE_ID}`)
    const url = `${encodeURIComponent(PRODUCTS_TABLE_ID)}?filterByFormula={Type}="${type}"`
    const response = await airtableFetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('[getProductsByType] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to fetch products')
    }

    const data = await response.json()
    console.log(`[getProductsByType] Found ${data.records?.length || 0} ${type} products`)
    return data.records || []
  } catch (error) {
    console.error('[getProductsByType] Error:', error)
    throw error
  }
}

// Get product by ID
export const getProductById = async (productId) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(PRODUCTS_TABLE_ID)}/${productId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch product')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting product by ID:', error)
    throw error
  }
}

// Create new product
export const createProduct = async (productData) => {
  try {
    const { 
      name, 
      type, 
      price, 
      description, 
      thumbnailUrl,
      galleryImages,
      youtubeLink,
      faq,
      isActive = true 
    } = productData

    // Convert isActive to boolean for Airtable checkbox field
    const isActiveValue = isActive === true || isActive === 'true' ? true : false
    
    // Capitalize first letter of type for Airtable
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()

    const requestBody = {
      records: [
        {
          fields: {
            'Name / Title': name,
            Type: capitalizedType,
            Price: parseFloat(price),
            Description: description,
            'Thumbnail URL': thumbnailUrl || '',
            'Gallery Images': galleryImages || '',
            'Youtube Link': youtubeLink || '',
            FAQ: faq || '',
            IsActive: isActiveValue,
          },
        },
      ],
    }

    console.log('[createProduct] Creating product with data:', JSON.stringify(requestBody, null, 2))

    const response = await airtableFetch(encodeURIComponent(PRODUCTS_TABLE_ID), {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[createProduct] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to create product')
    }

    const data = await response.json()
    console.log('[createProduct] Product created successfully:', data)
    return data.records[0]
  } catch (error) {
    console.error('[createProduct] Error:', error)
    throw error
  }
}

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    const fields = {}

    if (productData.name !== undefined) fields['Name / Title'] = productData.name
    if (productData.type !== undefined) fields.Type = productData.type
    if (productData.price !== undefined) fields.Price = parseFloat(productData.price)
    if (productData.description !== undefined) fields.Description = productData.description
    if (productData.thumbnailUrl !== undefined) fields['Thumbnail URL'] = productData.thumbnailUrl
    if (productData.galleryImages !== undefined) fields['Gallery Images'] = productData.galleryImages
    if (productData.youtubeLink !== undefined) fields['Youtube Link'] = productData.youtubeLink
    if (productData.faq !== undefined) fields.FAQ = productData.faq
    
    // Handle IsActive - convert to boolean for Airtable checkbox field
    if (productData.isActive !== undefined) {
      console.log('[updateProduct] isActive value:', productData.isActive, 'type:', typeof productData.isActive)
      fields.IsActive = productData.isActive === true || productData.isActive === 'true' ? true : false
    }
    
    // Capitalize first letter of type for Airtable
    if (productData.type !== undefined) {
      const capitalizedType = productData.type.charAt(0).toUpperCase() + productData.type.slice(1).toLowerCase()
      fields.Type = capitalizedType
    }

    console.log('[updateProduct] Updating product with fields:', JSON.stringify(fields, null, 2))

    const response = await airtableFetch(`${encodeURIComponent(PRODUCTS_TABLE_ID)}/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[updateProduct] Airtable API error:', JSON.stringify(error, null, 2))
      throw new Error(error.error?.message || 'Failed to update product')
    }

    const data = await response.json()
    console.log('[updateProduct] Product updated successfully:', data)
    return data
  } catch (error) {
    console.error('[updateProduct] Error:', error)
    throw error
  }
}

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const response = await airtableFetch(`${encodeURIComponent(PRODUCTS_TABLE_ID)}/${productId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete product')
    }

    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

export default {
  getAllProducts,
  getProductsByType,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}