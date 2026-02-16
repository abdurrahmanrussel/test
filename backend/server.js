// ===============================
// Load environment variables FIRST before any imports
// ===============================
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local for development, .env for production
const envPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '.env.local')
dotenv.config({ path: envPath })

console.log(`[Server] Loading environment from: ${envPath}`)

console.log('ENV:', process.env.AIRTABLE_BASE_ID, process.env.AIRTABLE_TABLE_NAME)

// Normalize email (remove dots for Gmail, convert to lowercase)
const normalizeEmail = (email) => {
  if (!email) return email
  const normalized = email.toLowerCase().trim()
  // For Gmail, remove ALL dots in the local part (before @)
  if (normalized.endsWith('@gmail.com')) {
    const [localPart, domain] = normalized.split('@')
    return localPart.replace(/\./g, '') + '@' + domain
  }
  return normalized
}

// NOW import everything else (after env vars are loaded)
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import Stripe from 'stripe'
import fetch from 'node-fetch'
import https from 'https'
import dns from 'dns'
import authController from './controllers/authController.js'
import ordersController from './controllers/ordersController.js'
import productsController from './controllers/productsController.js'
import promoCodesController from './controllers/promoCodesController.js'
import { createOrder, getOrderByPaymentId } from './services/airtableOrderService.js'
import * as userService from './services/airtableUserService.js'
import { authenticateToken, generateCSRFToken } from './middleware/auth.js'
import { requireAdmin } from './middleware/admin.js'
import { apiLimiter, authLimiter, passwordResetLimiter, passwordChangeLimiter, tokenRefreshLimiter } from './middleware/rateLimiter.js'

dns.setDefaultResultOrder('ipv4first')

const app = express()

// Trust proxy - needed for nginx reverse proxy
app.set('trust proxy', 1)

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 20000,
  family: 4,
})

// Initialize Stripe BEFORE using it in routes
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
}))

// Parse cookies
app.use(cookieParser())

// ⬇️ IMPORTANT: Webhook route MUST come BEFORE express.json()
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    
    console.log('✅ Stripe Webhook received:', event.type, event.id)

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('💰 Payment successful for session:', session.id)
      console.log('📦 Session details:', JSON.stringify(session, null, 2))
      
      try {
        // Extract order information
        const productId = session.metadata?.productId
        const productName = session.metadata?.productName
        const userId = session.metadata?.userId // Get user ID from logged-in checkout
        const amount = session.amount_total / 100 // Convert from cents
        const stripePaymentId = session.payment_intent || session.payment_intent || session.id
        
        // Get contact info from Stripe checkout
        const contactEmail = session.customer_details?.email
        const cardHolderName = session.customer_details?.name || contactEmail?.split('@')[0] || 'Customer'
        
        console.log('📝 Stripe checkout data:', {
          productId,
          productName,
          userId,
          amount,
          stripePaymentId,
          contactEmail,
          cardHolderName,
        })

        if (!productId || !productName || !amount) {
          console.error('❌ Missing required order data:', { productId, productName, amount })
          throw new Error('Missing required order data')
        }

        // IDEMPOTENCY CHECK: Check if order already exists for this payment
        console.log('🔍 Checking for existing order with payment ID:', stripePaymentId)
        const existingOrder = await getOrderByPaymentId(stripePaymentId)
        
        if (existingOrder) {
          console.log('✅ Order already exists for this payment - skipping duplicate creation')
          console.log('📋 Existing order ID:', existingOrder.id)
          return res.json({ received: true, orderId: existingOrder.id, duplicate: true })
        }
        
        console.log('🆕 No existing order found - creating new order')

        // Get user account details from userId (no email matching needed)
        let userAccountEmail = ''
        let userAccountName = ''
        
        console.log('🔍 Getting user account from userId:', userId)
        
        if (userId) {
          try {
            console.log('🔍 Calling userService.getUserById...')
            const user = await userService.getUserById(userId)
            console.log('🔍 User lookup result:', user ? 'FOUND' : 'NOT FOUND')
            
            if (user) {
              userAccountEmail = user.fields.Email
              userAccountName = user.fields.Name || ''
              console.log('✅ Found user account:', {
                id: userId,
                email: userAccountEmail,
                name: userAccountName
              })
            } else {
              console.log('⚠️ No user account found for userId:', userId)
              console.log('⚠️ Customer Email/Name will be empty')
            }
          } catch (err) {
            console.log('⚠️ Error getting user:', err.message)
          }
        } else {
          console.log('⚠️ No userId provided in session metadata')
        }

        // Customer Email and Name ONLY from user account (no fallback)
        const finalCustomerEmail = userAccountEmail
        const finalCustomerName = userAccountName

        console.log('🔄 Creating order in Airtable with:', {
          customerEmail: finalCustomerEmail,
          customerName: finalCustomerName,
          contactInfo: contactEmail,
          cardHolder: cardHolderName,
        })
        
        // Create order in Airtable
        const order = await createOrder({
          userId,
          productId,
          productName,
          amount,
          stripePaymentId,
          status: 'completed',
          customerEmail: finalCustomerEmail, // ONLY from user account
          customerName: finalCustomerName, // ONLY from user account
          contactInfo: contactEmail, // From Stripe checkout
          cardHolder: cardHolderName, // From Stripe cardholder
        })

        console.log('✅ Order created in Airtable:', order.id)
        console.log('📋 Order record:', JSON.stringify(order, null, 2))
      } catch (orderError) {
        console.error('❌ Failed to create order:', orderError)
        console.error('❌ Error stack:', orderError.stack)
        // Don't return error to Stripe - we've already received payment
        // Just log it so you can manually create the order if needed
      }
    }

    // Optional: Forward to n8n
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        })
        console.log('📤 Event forwarded to n8n')
      } catch (err) {
        console.error('Failed to forward to n8n:', err.message)
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

// ⬇️ Now apply JSON parser for other routes
app.use(express.json())

// ===============================
// TEST AIRTABLE TABLES
// ===============================
app.get('/api/test-tables', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Test Products Info table
    const productsRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    // Test Users table
    const usersRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_USERS_TABLE_ID}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
        signal: controller.signal,
      }
    );

    const productsData = await productsRes.json();
    const usersData = await usersRes.json();

    res.json({
      productsTable: {
        name: process.env.AIRTABLE_TABLE_NAME,
        accessible: productsRes.ok,
        recordCount: productsData.records?.length || 0,
        status: productsRes.status,
      },
      usersTable: {
        id: process.env.AIRTABLE_USERS_TABLE_ID,
        accessible: usersRes.ok,
        recordCount: usersData.records?.length || 0,
        status: usersRes.status,
      },
    });
  } catch (err) {
    console.error('Test tables error:', err);
    res.status(500).json({ error: 'Failed to test tables' });
  }
});

// ===============================
// GET PRODUCTS
// ===============================
app.get('/api/products', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
        agent: httpsAgent,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await airtableRes.json();
    res.json(data.records);
  } catch (err) {
    console.error('Failed to fetch products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ===============================
// CREATE STRIPE CHECKOUT
// ===============================
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 Checkout hit:', req.body)

    const { productId, promoCodeId, finalPrice } = req.body
    const userId = req.user.id // Get logged-in user's ID

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}?filterByFormula=RECORD_ID()="${productId}"`,
      {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
        agent: httpsAgent,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await airtableRes.json()

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const record = data.records[0]
    const originalPrice = record.fields.Price
    const name = record.fields['Name / Title']

    // Use finalPrice if provided (with promo), otherwise use original price
    const price = finalPrice ? parseFloat(finalPrice) : originalPrice

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        productId,
        productName: name,
        userId,
        promoCodeId,
        originalPrice,
        finalPrice: price // Store: actual price being charged
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel?product_id=${productId}&product_name=${encodeURIComponent(name)}`,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout failed:', err);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Airtable timeout' });
    }
    res.status(500).json({ error: 'Checkout failed' });
  }
})

// ===============================
// RETRIEVE SESSION
// ===============================
app.get('/api/checkout-session', async (req, res) => {
  try {
    const { sessionId } = req.query
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' })

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details'],
    })

    res.json(session)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to retrieve session' })
  }
})

// ===============================
// CSRF TOKEN ENDPOINT
// ===============================
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateCSRFToken()
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false, // Allow frontend to read
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  })
  res.json({ csrfToken })
})

// ===============================
// AUTH ROUTES
// ===============================

// Register (with rate limiting)
app.post(
  '/api/auth/register',
  authLimiter,
  authController.registerValidation,
  authController.register
)

// Login (with rate limiting)
app.post(
  '/api/auth/login',
  authLimiter,
  authController.loginValidation,
  authController.login
)

// Refresh token (with rate limiting)
app.post('/api/auth/refresh', tokenRefreshLimiter, authController.refreshToken)

// Logout (clears refresh token) - requires authentication
app.post('/api/auth/logout', authenticateToken, authController.logout)

// ===============================
// ADMIN PRODUCT ROUTES
// ===============================

// Get all products (admin only)
app.get('/api/admin/products', authenticateToken, requireAdmin, productsController.getAllProducts)

// Create product (admin only)
app.post(
  '/api/admin/products',
  authenticateToken,
  requireAdmin,
  productsController.productValidation,
  productsController.createProduct
)

// Update product (admin only)
app.patch(
  '/api/admin/products/:id',
  authenticateToken,
  requireAdmin,
  productsController.productValidation,
  productsController.updateProduct
)

// Delete product (admin only)
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, productsController.deleteProduct)

// ===============================
// ADMIN PROMO CODE ROUTES
// ===============================

// Get all promo codes (admin only)
app.get('/api/admin/promo-codes', authenticateToken, requireAdmin, promoCodesController.getAllPromoCodes)

// Create promo code (admin only)
app.post(
  '/api/admin/promo-codes',
  authenticateToken,
  requireAdmin,
  promoCodesController.promoCodeValidation,
  promoCodesController.createPromoCode
)

// Update promo code (admin only)
app.patch(
  '/api/admin/promo-codes/:id',
  authenticateToken,
  requireAdmin,
  promoCodesController.promoCodeValidation,
  promoCodesController.updatePromoCode
)

// Delete promo code (admin only)
app.delete('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, promoCodesController.deletePromoCode)

// Validate promo code (public - for users to check if promo code is valid)
app.post('/api/promo-codes/validate', promoCodesController.validatePromoCode)

// ===============================
// ADMIN USER MANAGEMENT ROUTES
// ===============================

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, authController.getAllUsers)

// Update user status/role (admin only)
app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, authController.updateUserStatus)

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, authController.adminDeleteUser)

// Email verification
app.post('/api/auth/verify-email', authController.verifyEmail)
app.post('/api/auth/resend-verification', authenticateToken, authController.resendVerification)

// Change email
app.post('/api/auth/change-email', authenticateToken, authController.changeEmail)

// Delete account
app.post('/api/auth/delete-account', authenticateToken, authController.deleteAccount)

// Get current user profile
app.get('/api/auth/me', authenticateToken, authController.getProfile)

// Update profile
app.put('/api/auth/profile', authenticateToken, authController.updateProfile)

// Change password (with rate limiting)
app.post('/api/auth/change-password', authenticateToken, passwordChangeLimiter, authController.changePassword)

// Forgot password (with strict rate limiting)
app.post(
  '/api/auth/forgot-password',
  passwordResetLimiter,
  authController.forgotPasswordValidation,
  authController.forgotPassword
)

// Reset password (with strict rate limiting)
app.post(
  '/api/auth/reset-password',
  passwordResetLimiter,
  authController.resetPasswordValidation,
  authController.resetPassword
)

// ===============================
// ORDERS ROUTES
// ===============================

// Get all orders (admin only)
app.get('/api/orders', authenticateToken, ordersController.getAllOrders)

// Get current user's orders
app.get('/api/orders/my-orders', authenticateToken, ordersController.getUserOrders)

// Get order statistics (admin only)
app.get('/api/orders/stats', authenticateToken, ordersController.getOrderStats)

// Update order status (admin only)
app.patch('/api/orders/:orderId/status', authenticateToken, ordersController.updateOrderStatus)

// ===============================
// HEALTH CHECK
// ===============================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: process.env.FRONTEND_URL || 'http://localhost:5173'
  })
})

// ===============================
// START SERVER
// ===============================
app.listen(4242, () => {
  console.log('✅ Backend running on http://localhost:4242')
  console.log('📍 Webhook endpoint: http://localhost:4242/api/stripe-webhook')
  console.log('🔐 Auth endpoints: /api/auth/*')
  console.log('🛡️ Security features: Rate limiting, CSRF protection, Refresh tokens enabled')
  console.log('🌍 CORS origin:', process.env.FRONTEND_URL || 'http://localhost:5173')
  console.log('🏥 Health check: http://localhost:4242/health')
})
