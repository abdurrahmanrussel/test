import * as orderService from '../services/airtableOrderService.js'
import * as userService from '../services/airtableUserService.js'
import * as productService from '../services/airtableProductService.js'

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      })
    }

    const orders = await orderService.getAllOrders()

    // Handle empty orders
    if (!orders || orders.length === 0) {
      return res.json({
        orders: [],
      })
    }

    // Enrich orders with user information
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const userId = order.fields.User?.[0]
        let userInfo = null
        
        if (userId) {
          try {
            const user = await userService.getUserById(userId)
            userInfo = {
              id: user.id,
              name: user.fields?.Name || 'Unknown',
              email: user.fields?.Email || 'N/A',
            }
          } catch (err) {
            console.error('Error fetching user for order:', err)
            userInfo = {
              id: userId,
              name: 'Unknown',
              email: 'N/A',
            }
          }
        }

        // Use customer email/name if available, otherwise use linked user
        const customerName = order.fields['Customer Name'] || userInfo?.name || 'Unknown'
        const customerEmail = order.fields['Customer Email'] || userInfo?.email || 'N/A'

        return {
          id: order.id,
          orderId: order.fields['Order ID'] || order.id,
          productId: order.fields['Product ID'] || 'N/A',
          productName: order.fields['Product Name'] || 'N/A',
          amount: order.fields.Amount || 0,
          status: order.fields.Status || 'unknown',
          stripePaymentId: order.fields['Stripe Payment ID'] || 'N/A',
          purchaseDate: order.createdTime,
          user: userInfo || {
            id: null,
            name: customerName,
            email: customerEmail,
          },
          // Also include customer fields directly for easy access
          customerName,
          customerEmail,
        }
      })
    )

    res.json({
      orders: enrichedOrders,
    })
  } catch (error) {
    console.error('Get all orders error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error.message 
    })
  }
}

// Get orders for current user
export const getUserOrders = async (req, res) => {
  try {
    console.log('[getUserOrders] Fetching orders for user:', req.user.email)
    
    // Get orders by email (Customer Email field)
    const orders = await orderService.getOrdersByUserId(req.user.email)
    console.log(`[getUserOrders] Found ${orders.length} orders`)

    // Handle empty orders
    if (!orders || orders.length === 0) {
      console.log('[getUserOrders] No orders found for email:', req.user.email)
      return res.json({
        orders: [],
      })
    }

    // Enrich orders with product information
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        console.log(`[getUserOrders] Processing order: ${order.id}, Product ID: ${order.fields['Product ID']}`)
        
        const productId = order.fields['Product ID']
        let productInfo = {
          thumbnailUrl: null,
          productType: null,
        }
        
        // Fetch product details if productId exists
        if (productId) {
          try {
            const product = await productService.getProductById(productId)
            productInfo = {
              thumbnailUrl: product.fields['Thumbnail URL'] || null,
              productType: product.fields.Type || null,
            }
            console.log(`[getUserOrders] Found product: ${product.fields['Name / Title']}, Type: ${product.fields.Type}`)
          } catch (err) {
            console.error(`[getUserOrders] Error fetching product ${productId}:`, err)
          }
        }
        
        return {
          id: order.id,
          orderId: order.fields['Order ID'] || order.id,
          productId: productId || 'N/A',
          productName: order.fields['Product Name'] || 'N/A',
          amount: order.fields.Amount || 0,
          status: order.fields.Status || 'unknown',
          stripePaymentId: order.fields['Stripe Payment ID'] || 'N/A',
          createdAt: order.createdTime,
          thumbnailUrl: productInfo.thumbnailUrl,
          productType: productInfo.productType,
        }
      })
    )

    console.log(`[getUserOrders] Returning ${enrichedOrders.length} enriched orders`)

    res.json({
      orders: enrichedOrders,
    })
  } catch (error) {
    console.error('Get user orders error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error.message 
    })
  }
}

// Get order statistics (admin only)
export const getOrderStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      })
    }

    const stats = await orderService.getOrderStats()

    res.json({
      stats,
    })
  } catch (error) {
    console.error('Get order stats error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch order statistics',
      message: error.message 
    })
  }
}

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      })
    }

    const { orderId } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required' 
      })
    }

    const validStatuses = ['pending', 'completed', 'refunded', 'failed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      })
    }

    const updatedOrder = await orderService.updateOrderStatus(orderId, status)

    res.json({
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder.id,
        status: updatedOrder.fields.Status,
      },
    })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ 
      error: 'Failed to update order status',
      message: error.message 
    })
  }
}

export default {
  getAllOrders,
  getUserOrders,
  getOrderStats,
  updateOrderStatus,
}