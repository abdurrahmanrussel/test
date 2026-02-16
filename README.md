# AA Trading Website

Full-stack React + Node.js + Tailwind CSS product website with automatic GitHub Actions deployment to EC2.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, JWT Authentication
- **Database**: Airtable (CMS)
- **Payment**: Stripe
- **Deployment**: GitHub Actions → EC2 + PM2 + Nginx
- **Automation**: N8N workflows

## 🚀 Quick Start

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (in a separate terminal)
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

### Environment Variables

Create `.env` files for both frontend and backend:

**Frontend (.env)**:
```bash
VITE_API_URL=http://localhost:4242
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
VITE_APP_URL=http://localhost:5173
VITE_AIRTABLE_BASE_ID=app...
VITE_AIRTABLE_TABLE_NAME=Products Info
VITE_AIRTABLE_PAT=pat...
VITE_GROQ_API_KEY=gsk_...
```

**Backend (.env)**:
```bash
PORT=4242
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
AIRTABLE_PAT=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_NAME=Products Info
AIRTABLE_USERS_TABLE_ID=tbl...
AIRTABLE_ORDERS_TABLE_ID=tbl...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔄 GitHub Actions Auto-Deployment

This project uses GitHub Actions for automatic deployment to an EC2 instance. The workflow triggers on every push to the `main` or `master` branch.

### Required GitHub Secrets

Configure these secrets in your GitHub repository: **Settings > Secrets and variables > Actions**

#### EC2 Configuration
- `EC2_HOST` - Your EC2 instance IP address or hostname
- `EC2_SSH_KEY` - SSH private key for EC2 access (full key content)

#### Application Configuration
- `PROD_API_URL` - Production API URL (e.g., https://api.yourdomain.com)
- `PROD_STRIPE_PUBLIC_KEY` - Stripe public key
- `PROD_N8N_WEBHOOK_URL` - N8N webhook URL
- `PROD_APP_URL` - Production application URL (e.g., https://yourdomain.com)
- `VITE_AIRTABLE_PAT` - Airtable Personal Access Token
- `VITE_GROQ_API_KEY` - Groq API key for AI chatbot

#### Backend Configuration
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `EMAIL_PASSWORD` - Email app password for SMTP (Gmail app password)

### Deployment Process

The GitHub Actions workflow (`.github/workflows/deploy.yml`) performs:

1. ✅ **Checkout code** - Clones the repository
2. ✅ **Setup Node.js** - Installs Node.js v20
3. ✅ **Build Frontend** - Installs dependencies and builds the React app
4. ✅ **Build Backend** - Prepares Node.js backend
5. ✅ **Create Environment Files** - Generates `.env.production` files with secrets
6. ✅ **Deploy to EC2** - Syncs files to EC2 using rsync
7. ✅ **Setup Server** - Installs Node.js, PM2, and Nginx
8. ✅ **Configure Nginx** - Sets up web server with reverse proxy
9. ✅ **Deploy Frontend** - Copies built files to `/var/www/html`
10. ✅ **Restart Services** - Restarts PM2 and Nginx services
11. ✅ **Verify Deployment** - Checks health endpoints and service status

### Monitoring Deployment

After each push, monitor deployment in:
- **GitHub Actions tab** - View workflow logs and status
- **PM2 logs on EC2**: `ssh ubuntu@your-ec2 "pm2 logs backend --lines 50"`
- **Nginx logs**: `sudo tail -f /var/log/nginx/access.log` and `sudo tail -f /var/log/nginx/error.log`
- **Service status**: `ssh ubuntu@your-ec2 "pm2 list && sudo systemctl status nginx"`

### Manual Deployment

If GitHub Actions fails or you need manual deployment:

```bash
# Using the provided script
chmod +x scripts/manual-deploy.sh
./scripts/manual-deploy.sh

# Or manually deploy to EC2
ssh -i your-key.pem ubuntu@your-ec2-host
cd /home/ubuntu/my-react-app
git pull origin main

# Frontend
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/

# Backend
cd ../backend
npm install --production
pm2 reload backend --update-env

# Restart Nginx
sudo systemctl restart nginx
```

## 📁 Project Structure

```
my-react-app/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── FloatingChatbot.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── HeroCarousel.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProductPage.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   ├── user/     # User dashboard pages
│   │   │   └── admin/    # Admin dashboard pages
│   │   ├── layouts/       # Layout components
│   │   ├── context/       # React context (AuthContext)
│   │   └── styles/        # Global styles
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Node.js Express backend
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   ├── ordersController.js
│   │   └── promoCodesController.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── rateLimiter.js
│   ├── services/        # Business logic & external services
│   │   ├── airtableUserService.js
│   │   ├── airtableProductService.js
│   │   ├── airtableOrderService.js
│   │   ├── airtablePromoCodeService.js
│   │   └── emailService.js
│   ├── server.js        # Express app entry point
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions deployment workflow
├── nginx.conf           # Nginx configuration for reverse proxy
├── ecosystem.config.cjs # PM2 process manager configuration
├── scripts/            # Deployment and setup scripts
│   ├── manual-deploy.sh
│   └── setup-ec2.sh
└── README.md
```

## 🔧 Features

### User Features
- User registration and email verification
- JWT-based authentication
- Product browsing and purchasing
- Stripe payment integration
- User dashboard (purchases, transactions)
- Password reset functionality
- AI-powered chatbot (Groq API)

### Admin Features
- Admin dashboard
- Product management via Airtable CMS
- Promo code management
- User management
- Transaction monitoring
- Analytics and indicators

### Technical Features
- Rate limiting for API endpoints
- Email notifications
- Secure password hashing
- Protected routes
- Responsive design (Tailwind CSS)
- SEO-friendly structure

## 🐛 Troubleshooting

### Deployment Issues
1. **GitHub Actions fails** - Check workflow logs for specific errors
2. **SSH connection errors** - Verify EC2_HOST and EC2_SSH_KEY secrets
3. **Build errors** - Check if all dependencies are properly installed
4. **Nginx 502 error** - Verify backend is running: `pm2 list`

### Common Issues
- **Environment variables not working** - Check GitHub Secrets are properly set
- **Stripe webhook errors** - Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- **Airtable connection issues** - Check AIRTABLE_PAT and base/table IDs
- **Email not sending** - Verify EMAIL_PASSWORD is an app password (not account password)

## 📝 API Documentation

See `API_DOCUMENTATION.md` for detailed API endpoints and usage examples.

## 📄 License

This project is private and confidential.# Deployment trigger Mon Feb 16 08:43:21 PM +06 2026
