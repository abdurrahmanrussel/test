import { body, validationResult } from 'express-validator'
import * as productService from '../services/airtableProductService.js'

// Validation rules
export const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['product', 'indicator', 'strategy'])
    .withMessage('Type must be product, indicator, or strategy'),
  body('price')
    .trim()
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('thumbnailUrl')
    .optional({ nullable: true, checkFalsy: true })
    .if(body('thumbnailUrl').notEmpty())
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  body('youtubeLink')
    .optional({ nullable: true, checkFalsy: true })
    .if(body('youtubeLink').notEmpty())
    .isURL()
    .withMessage('YouTube link must be a valid URL'),
]

// Get all products (admin only)
export const getAllProducts = async (req, res) => {
  try {
    const { type } = req.query
    
    console.log(`[getAllProducts] Fetching products with type: ${type || 'all'}`)

    let products
    if (type) {
      products = await productService.getProductsByType(type)
    } else {
      products = await productService.getAllProducts()
    }

    console.log(`[getAllProducts] Found ${products.length} products`)

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.fields['Name / Title'],
      type: product.fields.Type,
      price: product.fields.Price,
      description: product.fields.Description,
      thumbnailUrl: product.fields['Thumbnail URL'],
      galleryImages: product.fields['Gallery Images'],
      youtubeLink: product.fields['Youtube Link'],
      faq: product.fields.FAQ,
      isActive: product.fields.IsActive,
      createdAt: product.createdTime,
    }))

    console.log(`[getAllProducts] Returning ${formattedProducts.length} formatted products`)

    res.json({
      products: formattedProducts,
    })
  } catch (error) {
    console.error('[getAllProducts] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    })
  }
}

// Create new product (admin only)
export const createProduct = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('[createProduct] Validation failed:', JSON.stringify(errors.array(), null, 2))
      console.log('[createProduct] Request body:', JSON.stringify(req.body, null, 2))
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }

    console.log('[createProduct] Creating product with body:', JSON.stringify(req.body, null, 2))
    const newProduct = await productService.createProduct(req.body)

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: newProduct.id,
        name: newProduct.fields['Name / Title'],
        type: newProduct.fields.Type,
        price: newProduct.fields.Price,
        description: newProduct.fields.Description,
        thumbnailUrl: newProduct.fields['Thumbnail URL'],
        galleryImages: newProduct.fields['Gallery Images'],
        youtubeLink: newProduct.fields['Youtube Link'],
        faq: newProduct.fields.FAQ,
        isActive: newProduct.fields.IsActive,
        createdAt: newProduct.createdTime,
      },
    })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({
      error: 'Failed to create product',
      message: error.message
    })
  }
}

// Update product (admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    const updatedProduct = await productService.updateProduct(id, req.body)

    // Handle both direct record and wrapped response from Airtable
    const record = updatedProduct.records ? updatedProduct.records[0] : updatedProduct

    res.json({
      message: 'Product updated successfully',
      product: {
        id: record.id,
        name: record.fields['Name / Title'],
        type: record.fields.Type,
        price: record.fields.Price,
        description: record.fields.Description,
        thumbnailUrl: record.fields['Thumbnail URL'],
        galleryImages: record.fields['Gallery Images'],
        youtubeLink: record.fields['Youtube Link'],
        faq: record.fields.FAQ,
        isActive: record.fields.IsActive,
        createdAt: record.createdTime,
      },
    })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({
      error: 'Failed to update product',
      message: error.message
    })
  }
}

// Delete product (admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    await productService.deleteProduct(id)

    res.json({
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({
      error: 'Failed to delete product',
      message: error.message
    })
  }
}

export default {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productValidation,
}