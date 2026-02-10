# API Documentation

## Backend Endpoints & Frontend Usage

This document provides a comprehensive list of all backend API endpoints and their usage in the frontend application.

---

## AUTHENTICATION ENDPOINTS

### POST /api/auth/register
**Description:** Register a new user account  
**Authentication:** Not required  
**Rate Limiting:** Yes (authLimiter)  
**Body:**
```json
{
  "name": "string (2-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number)",
  "confirmPassword": "string (must match password)"
}
```
**Frontend Usage:** `frontend/src/pages/RegisterPage.jsx`

---

### POST /api/auth/login
**Description:** Login with email and password  
**Authentication:** Not required  
**Rate Limiting:** Yes (authLimiter)  
**Body:**
```json
{
  "email": "string (valid email)",
  "password": "string"
}
```
**Response:**
```json
{
  "message": "Login successful",
  "token": "string (JWT access token)",
  "refreshToken": "string (refresh token)",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string (user/admin)",
    "isActive": "boolean",
    "isEmailVerified": "boolean"
  }
}
```
**Frontend Usage:** `frontend/src/pages/LoginPage.jsx`

---

### POST /api/auth/logout
**Description:** Logout user and clear refresh token  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Frontend Usage:** `frontend/src/context/AuthContext.jsx` (logout function)

---

### POST /api/auth/refresh
**Description:** Refresh access token using refresh token  
**Authentication:** Not required (uses refresh token)  
**Rate Limiting:** Yes (tokenRefreshLimiter)  
**Body:**
```json
{
  "refreshToken": "string"
}
```
**Frontend Usage:** `frontend/src/context/AuthContext.jsx` (refreshAccessToken function)

---

### GET /api/auth/me
**Description:** Get current user profile  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "isActive": "boolean",
    "isEmailVerified": "boolean",
    "createdAt": "string (ISO date)"
  }
}
```
**Frontend Usage:** `frontend/src/context/AuthContext.jsx` (loadUserData useEffect)

---

### POST /api/auth/verify-email
**Description:** Verify email address with token  
**Authentication:** Not required  
**Rate Limiting:** No  
**Body:**
```json
{
  "email": "string (valid email)",
  "token": "string"
}
```
**Frontend Usage:** `frontend/src/pages/VerifyEmailPage.jsx`

---

### POST /api/auth/resend-verification
**Description:** Resend email verification link  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Frontend Usage:** `frontend/src/pages/LoginPage.jsx`

---

### POST /api/auth/change-email
**Description:** Change user email address  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Body:**
```json
{
  "newEmail": "string (valid email)",
  "password": "string (current password)"
}
```
**Frontend Usage:** `frontend/src/pages/AccountSettingsPage.jsx`

---

### POST /api/auth/change-password
**Description:** Change user password  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** Yes (passwordChangeLimiter)  
**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number)",
  "confirmPassword": "string (must match new password)"
}
```
**Frontend Usage:** `frontend/src/pages/AccountSettingsPage.jsx`

---

### POST /api/auth/forgot-password
**Description:** Request password reset email  
**Authentication:** Not required  
**Rate Limiting:** Yes (passwordResetLimiter)  
**Body:**
```json
{
  "email": "string (valid email)"
}
```
**Frontend Usage:** `frontend/src/pages/ForgotPasswordPage.jsx`

---

### POST /api/auth/reset-password
**Description:** Reset password with token  
**Authentication:** Not required  
**Rate Limiting:** Yes (passwordResetLimiter)  
**Body:**
```json
{
  "email": "string (valid email)",
  "token": "string",
  "password": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number)",
  "confirmPassword": "string (must match password)"
}
```
**Frontend Usage:** `frontend/src/pages/ResetPasswordPage.jsx`

---

### POST /api/auth/delete-account
**Description:** Delete user account  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Body:**
```json
{
  "password": "string (current password)",
  "confirmDelete": "string (must be 'DELETE')"
}
```
**Frontend Usage:** `frontend/src/pages/AccountSettingsPage.jsx`

---

### PUT /api/auth/profile
**Description:** Update user profile  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Body:**
```json
{
  "name": "string (2-50 chars)"
}
```
**Note:** This endpoint exists but doesn't appear to be used in the frontend.

---

## PRODUCT ENDPOINTS

### GET /api/products
**Description:** Get all products (public endpoint)  
**Authentication:** Not required  
**Rate Limiting:** No  
**Response:**
```json
{
  "records": [
    {
      "id": "string",
      "fields": {
        "Name / Title": "string",
        "Type": "string (product/indicator/strategy)",
        "Price": "number",
        "Description": "string",
        "Thumbnail URL": "string (URL)",
        "Gallery Images": ["array of URLs"],
        "Youtube Link": "string (URL)",
        "FAQ": "string",
        "IsActive": "boolean"
      },
      "createdTime": "string (ISO date)"
    }
  ]
}
```
**Note:** This endpoint exists but doesn't appear to be used in the frontend.

---

### GET /api/admin/products
**Description:** Get all products (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Query Parameters:**
- `type` (optional): Filter by type (product/indicator/strategy)

**Response:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "price": "number",
      "description": "string",
      "thumbnailUrl": "string",
      "galleryImages": ["array"],
      "youtubeLink": "string",
      "faq": "string",
      "isActive": "boolean",
      "createdAt": "string"
    }
  ]
}
```
**Frontend Usage:** 
- `frontend/src/pages/admin/Dashboard.jsx` - Get all products
- `frontend/src/pages/admin/Indicators.jsx` - Get indicators (type=Indicator)
- `frontend/src/pages/admin/Strategies.jsx` - Get strategies (type=Strategy)

---

### POST /api/admin/products
**Description:** Create new product (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Body:**
```json
{
  "name": "string (2-200 chars)",
  "type": "string (product/indicator/strategy)",
  "price": "number (positive)",
  "description": "string (optional)",
  "thumbnailUrl": "string (URL, optional)",
  "youtubeLink": "string (URL, optional)"
}
```
**Frontend Usage:** Admin product creation forms (implied)

---

### PATCH /api/admin/products/:id
**Description:** Update product (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Frontend Usage:** Admin product edit forms (implied)

---

### DELETE /api/admin/products/:id
**Description:** Delete product (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Frontend Usage:**
- `frontend/src/pages/admin/Indicators.jsx`
- `frontend/src/pages/admin/Strategies.jsx`

---

## ORDER ENDPOINTS

### GET /api/orders
**Description:** Get all orders (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "orderId": "string",
      "productId": "string",
      "productName": "string",
      "amount": "number",
      "status": "string (pending/completed/refunded/failed)",
      "stripePaymentId": "string",
      "purchaseDate": "string (ISO date)",
      "user": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "customerName": "string",
      "customerEmail": "string"
    }
  ]
}
```
**Frontend Usage:**
- `frontend/src/pages/AdminPage.jsx` - Fetch orders
- `frontend/src/pages/admin/Transactions.jsx` - Fetch transactions
- `frontend/src/pages/admin/Dashboard.jsx` - Stats calculations

---

### GET /api/orders/my-orders
**Description:** Get current user's orders  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "orderId": "string",
      "productId": "string",
      "productName": "string",
      "amount": "number",
      "status": "string",
      "stripePaymentId": "string",
      "createdAt": "string (ISO date)",
      "thumbnailUrl": "string",
      "productType": "string"
    }
  ]
}
```
**Frontend Usage:**
- `frontend/src/pages/user/Purchases.jsx` - Display user purchases
- `frontend/src/pages/user/Transactions.jsx` - Display user transactions

---

### GET /api/orders/stats
**Description:** Get order statistics (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Frontend Usage:**
- `frontend/src/pages/admin/Dashboard.jsx` - Fetch statistics
- `frontend/src/pages/AdminPage.jsx` - Fetch statistics

---

### PATCH /api/orders/:orderId/status
**Description:** Update order status (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Body:**
```json
{
  "status": "string (pending/completed/refunded/failed)"
}
```
**Frontend Usage:**
- `frontend/src/pages/admin/Transactions.jsx` - Update transaction status
- `frontend/src/pages/AdminPage.jsx` - Update order status

---

## STRIPE PAYMENT ENDPOINTS

### POST /api/create-checkout-session
**Description:** Create Stripe checkout session  
**Authentication:** Required (Bearer token)  
**Rate Limiting:** No  
**Body:**
```json
{
  "productId": "string (Airtable product ID)"
}
```
**Response:**
```json
{
  "url": "string (Stripe checkout URL)"
}
```
**Frontend Usage:**
- `frontend/src/pages/ProductPage.jsx` - Initiate checkout
- `frontend/src/App.jsx` - Alternative checkout initiation

---

### GET /api/checkout-session
**Description:** Retrieve Stripe checkout session  
**Authentication:** Not required  
**Rate Limiting:** No  
**Query Parameters:**
- `sessionId` (required): Stripe session ID

**Frontend Usage:** `frontend/src/pages/SuccessPage.jsx` - Verify payment

---

### POST /api/stripe-webhook
**Description:** Stripe webhook endpoint (internal use only)  
**Authentication:** Stripe signature verification  
**Rate Limiting:** No  
**Frontend Usage:** Not used directly by frontend

---

## USER MANAGEMENT ENDPOINTS (ADMIN)

### GET /api/admin/users
**Description:** Get all users (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "isActive": "boolean",
      "isEmailVerified": "boolean",
      "createdAt": "string (ISO date)"
    }
  ]
}
```
**Frontend Usage:**
- `frontend/src/pages/admin/Dashboard.jsx` - Fetch users
- `frontend/src/pages/admin/Users.jsx` - Fetch users list

---

### PATCH /api/admin/users/:id
**Description:** Update user status/role (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Body:**
```json
{
  "isActive": "boolean (optional)",
  "role": "string (optional, user/admin)"
}
```
**Frontend Usage:** `frontend/src/pages/admin/Users.jsx` - Update user

---

### DELETE /api/admin/users/:id
**Description:** Delete user (admin only)  
**Authentication:** Required (Bearer token, Admin role)  
**Rate Limiting:** No  
**Frontend Usage:** `frontend/src/pages/admin/Users.jsx` - Delete user

---

## UTILITY ENDPOINTS

### GET /api/test-tables
**Description:** Test Airtable table connectivity  
**Authentication:** Not required  
**Rate Limiting:** No  
**Frontend Usage:** Not used in frontend (testing only)

---

### GET /api/csrf-token
**Description:** Get CSRF token  
**Authentication:** Not required  
**Rate Limiting:** No  
**Response:**
```json
{
  "csrfToken": "string"
}
```
**Frontend Usage:** Not currently used in frontend

---

## PAGE TO ENDPOINT MAPPING

### Authentication Pages
| Page | Endpoints Used |
|------|----------------|
| `LoginPage.jsx` | `POST /api/auth/login`, `POST /api/auth/resend-verification` |
| `RegisterPage.jsx` | `POST /api/auth/register` |
| `ForgotPasswordPage.jsx` | `POST /api/auth/forgot-password` |
| `ResetPasswordPage.jsx` | `POST /api/auth/reset-password` |
| `VerifyEmailPage.jsx` | `POST /api/auth/verify-email` |
| `AccountSettingsPage.jsx` | `POST /api/auth/change-password`, `POST /api/auth/change-email`, `POST /api/auth/delete-account` |

### User Pages
| Page | Endpoints Used |
|------|----------------|
| `user/Dashboard.jsx` | (Uses AuthContext) |
| `user/Purchases.jsx` | `GET /api/orders/my-orders` |
| `user/Transactions.jsx` | `GET /api/orders/my-orders` |

### Admin Pages
| Page | Endpoints Used |
|------|----------------|
| `AdminPage.jsx` | `GET /api/orders`, `GET /api/orders/stats`, `PATCH /api/orders/:orderId/status` |
| `admin/Dashboard.jsx` | `GET /api/orders/stats`, `GET /api/admin/products`, `GET /api/admin/users` |
| `admin/Users.jsx` | `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id` |
| `admin/Transactions.jsx` | `GET /api/orders`, `PATCH /api/orders/:orderId/status` |
| `admin/Indicators.jsx` | `GET /api/admin/products?type=Indicator`, `DELETE /api/admin/products/:id` |
| `admin/Strategies.jsx` | `GET /api/admin/products?type=Strategy`, `DELETE /api/admin/products/:id` |

### Other Pages
| Page | Endpoints Used |
|------|----------------|
| `ProductPage.jsx` | `POST /api/create-checkout-session` |
| `SuccessPage.jsx` | `GET /api/checkout-session` |
| `AuthContext.jsx` | `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/refresh` |
| `App.jsx` | `POST /api/create-checkout-session` |

---

## Rate Limiting

The API implements the following rate limiters:

| Limiter | Endpoints Protected | Purpose |
|---------|---------------------|---------|
| `apiLimiter` | General API endpoints | Prevent abuse |
| `authLimiter` | `/api/auth/register`, `/api/auth/login` | Prevent brute force attacks |
| `passwordResetLimiter` | `/api/auth/forgot-password`, `/api/auth/reset-password` | Prevent email flooding |
| `passwordChangeLimiter` | `/api/auth/change-password` | Prevent rapid password changes |
| `tokenRefreshLimiter` | `/api/auth/refresh` | Prevent token abuse |

---

## Authentication & Authorization

### Token Types
- **Access Token (JWT)**: Short-lived token used for API requests
- **Refresh Token**: Long-lived token used to obtain new access tokens

### Authentication Flow
1. User logs in → Receives access token and refresh token
2. Access token used in `Authorization: Bearer <token>` header
3. When access token expires, use refresh token to get new access token
4. Tokens are stored in localStorage

### Role-Based Access Control
- **user**: Can access user-specific endpoints
- **admin**: Can access all user endpoints plus admin endpoints

---

## Third-Party Integrations

- **Airtable**: User, Product, and Order data storage
- **Stripe**: Payment processing
- **Email Service**: Transactional emails (verification, password reset)
- **Groq API**: Chatbot functionality (`frontend/src/components/FloatingChatbot.jsx`)

---

## Environment Variables

### Backend (.env)
```
AIRTABLE_BASE_ID
AIRTABLE_TABLE_NAME
AIRTABLE_USERS_TABLE_ID
AIRTABLE_PAT
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
JWT_SECRET
JWT_EXPIRES_IN
N8N_WEBHOOK_URL (optional)
NODE_ENV
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4242