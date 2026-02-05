// ===============================
// Load environment variables first
// ===============================
import dotenv from 'dotenv'
dotenv.config()

console.log('ENV:', process.env.AIRTABLE_BASE_ID, process.env.AIRTABLE_TABLE_NAME)

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import Stripe from 'stripe'
import fetch from 'node-fetch'
import https from 'https'
import dns from 'dns'
import authController from './controllers/authController.js'
import { authenticateToken, generateCSRFToken } from './middleware/auth.js'
import { apiLimiter, authLimiter, passwordResetLimiter } from './middleware/rateLimiter.js'

dns.setDefaultResultOrder('ipv4first')

const app = express()

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 20000,
  family: 4,
})

app.use(cors({ 
  origin: 'http://localhost:5173',
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

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
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('🔥 Checkout hit:', req.body)

    const { productId } = req.body

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
    const price = record.fields.Price
    const name = record.fields['Name / Title']

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
        productName: name
      },
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/cancel?product_id=${productId}&product_name=${encodeURIComponent(name)}`,
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

// Refresh token
app.post('/api/auth/refresh', authController.refreshToken)

// Logout (clears refresh token)
app.post('/api/auth/logout', authController.logout)

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

// Change password
app.post('/api/auth/change-password', authenticateToken, authController.changePassword)

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
// START SERVER
// ===============================
app.listen(4242, () => {
  console.log('✅ Backend running on http://localhost:4242')
  console.log('📍 Webhook endpoint: http://localhost:4242/api/stripe-webhook')
  console.log('🔐 Auth endpoints: /api/auth/*')
  console.log('🛡️ Security features: Rate limiting, CSRF protection, Refresh tokens enabled')
})
