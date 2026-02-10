# User Onboarding Process Flow

## AA Trading Website - User Journey

```mermaid
graph TD
    Start((Start: User Visits Website)) --> Landing[Homepage / Landing Page]
    
    Landing --> Decision1{User Action?}
    Decision1 -->|Browse Products| Browse[View Products Page]
    Decision1 -->|Sign Up| Register[Registration Page]
    Decision1 -->|Login| Login[Login Page]
    
    Browse --> ViewProduct[Select Product]
    
    Register --> Decision2{Fill Registration Form}
    Decision2 -->|Submit| EmailSent[Verification Email Sent]
    Decision2 -->|Cancel| Landing
    
    EmailSent --> VerifyEmail[Verify Email Page]
    VerifyEmail --> Login
    
    Login --> Decision3{Login Successful?}
    Decision3 -->|No| CheckEmail[Check if Email Verified]
    Decision3 -->|Yes| CheckRole{Check User Role}
    
    CheckEmail --> Decision4{Email Verified?}
    Decision4 -->|No| Resend[Resend Verification Email]
    Decision4 -->|Yes| Login
    Resend --> VerifyEmail
    
    CheckRole -->|Admin| AdminDashboard[Admin Dashboard]
    CheckRole -->|User| UserDashboard[User Dashboard]
    
    ViewProduct --> Decision5{Already Logged In?}
    Decision5 -->|Yes| Checkout[Checkout with Stripe]
    Decision5 -->|No| Login
    
    AdminDashboard --> AdminActions{Admin Actions}
    AdminActions -->|Manage Users| ManageUsers[View & Manage Users]
    AdminActions -->|Manage Products| ManageProducts[View & Manage Products]
    AdminActions -->|View Orders| ViewOrders[View All Orders]
    AdminActions -->|View Statistics| ViewStats[View Statistics]
    
    UserDashboard --> UserActions{User Actions}
    UserActions -->|View Purchases| MyPurchases[View My Purchases]
    UserActions -->|View Transactions| MyTransactions[View Transactions]
    UserActions -->|Account Settings| Settings[Update Profile/Password]
    UserActions -->|Browse Products| Browse
    
    Checkout --> Payment[Stripe Payment]
    Payment --> Success[Success Page]
    Payment --> Cancel[Cancel Page]
    
    Cancel --> Browse
    
    Success --> MyPurchases
    
    ManageUsers --> AdminDashboard
    ManageProducts --> AdminDashboard
    ViewOrders --> AdminDashboard
    ViewStats --> AdminDashboard
    
    MyPurchases --> UserDashboard
    MyTransactions --> UserDashboard
    Settings --> UserDashboard
    
    style Start fill:#4CAF50,color:#fff
    style AdminDashboard fill:#2196F3,color:#fff
    style UserDashboard fill:#FF9800,color:#fff
    style Success fill:#4CAF50,color:#fff
    style Cancel fill:#f44336,color:#fff
```

---

## User Onboarding Steps

### 1. Website Visit
- User lands on the homepage
- Can browse available products without registration
- Access to public product information

### 2. Registration
- User fills registration form with:
  - Name
  - Email address
  - Password
- System validates input and checks for existing accounts

### 3. Email Verification
- Verification email sent to user's email address
- User must verify email before accessing full features
- Option to resend verification if needed

### 4. Login
- User logs in with verified email and password
- System authenticates and assigns access token
- JWT tokens manage session securely

### 5. Role Assignment
- **User Role**: Can browse products, make purchases, view orders
- **Admin Role**: Can manage users, products, orders, view statistics

---

## User Paths

### Regular User Path
```
Homepage → Browse Products → Login/Verify → Make Purchase → View Orders → Manage Account
```

### Admin User Path
```
Homepage → Login → Admin Dashboard → Manage Users/Products/Orders → View Analytics
```

---

## Key Features

### For All Users
- ✅ Browse products without registration
- ✅ Secure user authentication
- ✅ Email verification required
- ✅ Password recovery option
- ✅ Profile management

### For Customers
- ✅ Purchase products via Stripe
- ✅ View purchase history
- ✅ Access purchased content
- ✅ Track order status

### For Administrators
- ✅ Manage user accounts
- ✅ Create/update/delete products
- ✅ Monitor all orders
- ✅ View business statistics
- ✅ Update order statuses

---

## Security Features

- 🔐 JWT-based authentication
- 🔐 Refresh token mechanism
- 🔐 Password encryption (bcrypt)
- 🔐 Rate limiting on sensitive endpoints
- 🔐 Email verification required
- 🔐 CSRF protection

---

## Payment Flow

```
Select Product → Create Checkout Session → Stripe Payment → Webhook → Order Creation → Success Page
```

---

## Support Features

- 📧 Automated email notifications
- 🔄 Password reset functionality
- 💬 Floating chatbot for assistance
- 📱 Responsive design for all devices