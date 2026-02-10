import * as promoCodeService from '../services/airtablePromoCodeService.js'

// Validation middleware
export const promoCodeValidation = (req, res, next) => {
  const { promoCode, discountType, discountValue, expiryDate } = req.body

  if (!promoCode || typeof promoCode !== 'string' || promoCode.trim().length === 0) {
    return res.status(400).json({ error: 'Promo code is required' })
  }

  if (!discountType || !['Percentage', 'Fixed Amount'].includes(discountType)) {
    return res.status(400).json({ error: 'Discount type must be "Percentage" or "Fixed Amount"' })
  }

  if (discountValue === undefined || discountValue === null || isNaN(discountValue)) {
    return res.status(400).json({ error: 'Discount value is required' })
  }

  if (parseFloat(discountValue) < 0) {
    return res.status(400).json({ error: 'Discount value cannot be negative' })
  }

  if (discountType === 'Percentage' && parseFloat(discountValue) > 100) {
    return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' })
  }

  if (expiryDate && isNaN(Date.parse(expiryDate))) {
    return res.status(400).json({ error: 'Invalid expiry date' })
  }

  next()
}

// Get all promo codes
export const getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await promoCodeService.getAllPromoCodes()
    res.json({ promoCodes })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    res.status(500).json({ error: 'Failed to fetch promo codes' })
  }
}

// Get promo code by ID
export const getPromoCodeById = async (req, res) => {
  try {
    const { id } = req.params
    const promoCode = await promoCodeService.getPromoCodeById(id)
    res.json({ promoCode })
  } catch (error) {
    console.error('Error fetching promo code:', error)
    res.status(500).json({ error: 'Failed to fetch promo code' })
  }
}

// Create new promo code
export const createPromoCode = async (req, res) => {
  try {
    const promoCodeData = {
      promoCode: req.body.promoCode.trim().toUpperCase(),
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      expiryDate: req.body.expiryDate || null,
      maxUses: req.body.maxUses || null,
      timesUsed: req.body.timesUsed || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      applicableProducts: req.body.applicableProducts || [],
      minimumPurchase: req.body.minimumPurchase || null,
      createdAt: new Date().toISOString().split('T')[0],
    }

    const newPromoCode = await promoCodeService.createPromoCode(promoCodeData)
    res.status(201).json(newPromoCode)
  } catch (error) {
    console.error('Error creating promo code:', error)
    res.status(500).json({ error: error.message || 'Failed to create promo code' })
  }
}

// Update promo code
export const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params
    const promoCodeData = {}

    if (req.body.promoCode !== undefined) {
      promoCodeData.promoCode = req.body.promoCode.trim().toUpperCase()
    }
    if (req.body.discountType !== undefined) {
      promoCodeData.discountType = req.body.discountType
    }
    if (req.body.discountValue !== undefined) {
      promoCodeData.discountValue = req.body.discountValue
    }
    if (req.body.expiryDate !== undefined) {
      promoCodeData.expiryDate = req.body.expiryDate
    }
    if (req.body.maxUses !== undefined) {
      promoCodeData.maxUses = req.body.maxUses
    }
    if (req.body.timesUsed !== undefined) {
      promoCodeData.timesUsed = req.body.timesUsed
    }
    if (req.body.isActive !== undefined) {
      promoCodeData.isActive = req.body.isActive
    }
    if (req.body.applicableProducts !== undefined) {
      promoCodeData.applicableProducts = req.body.applicableProducts
    }
    if (req.body.minimumPurchase !== undefined) {
      promoCodeData.minimumPurchase = req.body.minimumPurchase
    }

    const updatedPromoCode = await promoCodeService.updatePromoCode(id, promoCodeData)
    res.json(updatedPromoCode)
  } catch (error) {
    console.error('Error updating promo code:', error)
    res.status(500).json({ error: error.message || 'Failed to update promo code' })
  }
}

// Delete promo code
export const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params
    await promoCodeService.deletePromoCode(id)
    res.json({ message: 'Promo code deleted successfully' })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    res.status(500).json({ error: 'Failed to delete promo code' })
  }
}

// Validate promo code for a product
export const validatePromoCode = async (req, res) => {
  try {
    const { promoCode, productId } = req.body

    if (!promoCode || typeof promoCode !== 'string' || promoCode.trim().length === 0) {
      return res.status(400).json({ error: 'Promo code is required' })
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    // Find promo code by code value
    const allPromoCodes = await promoCodeService.getAllPromoCodes()
    const promo = allPromoCodes.find(p => 
      p.fields['Promo Code'] && 
      p.fields['Promo Code'].toUpperCase() === promoCode.trim().toUpperCase()
    )

    if (!promo) {
      return res.status(404).json({ 
        valid: false,
        message: 'Invalid promo code' 
      })
    }

    const fields = promo.fields

    // Check if promo is active
    if (fields.IsActive !== true && fields.IsActive !== 'true') {
      return res.status(400).json({ 
        valid: false,
        message: 'This promo code is inactive' 
      })
    }

    // Check expiry date
    if (fields['Expiry Date']) {
      const expiryDate = new Date(fields['Expiry Date'])
      if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
        return res.status(400).json({ 
          valid: false,
          message: 'This promo code has expired' 
        })
      }
    }

    // Check max uses
    if (fields['Max Uses'] && fields['Times Used'] >= fields['Max Uses']) {
      return res.status(400).json({ 
        valid: false,
        message: 'This promo code has reached maximum usage limit' 
      })
    }

    // Check if product is applicable
    const applicableProductsRaw = fields['Applicable Products'] || ''
    const applicableProducts = typeof applicableProductsRaw === 'string' && applicableProductsRaw.trim()
      ? applicableProductsRaw.split(',').map(p => p.trim()).filter(p => p)
      : []

    if (applicableProducts.length > 0 && !applicableProducts.includes(productId)) {
      return res.status(400).json({ 
        valid: false,
        message: 'This promo code is not applicable for this product' 
      })
    }

    // Promo code is valid
    res.json({
      valid: true,
      promoCode: {
        id: promo.id,
        code: fields['Promo Code'],
        discountType: fields['Discount Type'],
        discountValue: fields['Discount Value'],
        minimumPurchase: fields['Minimum Purchase'] || null,
      }
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    res.status(500).json({ error: 'Failed to validate promo code' })
  }
}

export default {
  promoCodeValidation,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
}
