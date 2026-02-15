# Deployment Fixes Summary

## Issues Fixed

### 1. Frontend Products Not Displaying ✅
**Problem:** Backend API `/api/products` returns an array directly, but frontend code expected an object with a `records` property.

**Solution:** Updated 3 files to handle both response formats:
- `frontend/src/App.jsx` - Main page product listing
- `frontend/src/pages/ProductPage.jsx` - Individual product details
- `frontend/src/components/HeroCarousel.jsx` - Hero carousel

**Fix Applied:**
```javascript
// Handle both array and object with records property
const records = Array.isArray(data) ? data : data.records
```

### 2. Backend Environment Path Issue ✅
**Problem:** Backend server had hardcoded path `/home/ubuntu/my-react-app/backend/.env` which breaks local development.

**Solution:** Changed to use dotenv's default behavior which automatically finds .env file in the current directory.

**Before:**
```javascript
dotenv.config({ path: "/home/ubuntu/my-react-app/backend/.env" })
```

**After:**
```javascript
dotenv.config()
```

### 3. Nginx Configuration Issues ✅
**Problem:** Multiple path mismatches in nginx configuration.

**Fixes:**
1. Changed root path from `/var/www/my-react-app` to `/var/www/html` (matches GitHub Actions deployment)
2. Fixed webhook route from `/webhook` to `/api/stripe-webhook` (matches backend route)

---

## GitHub Actions Deployment Setup

### Required GitHub Secrets

The following secrets must be configured in your GitHub repository:

**Backend Secrets:**
- `EC2_HOST` - Your EC2 instance IP address
- `EC2_SSH_KEY` - SSH private key for EC2 access
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `AIRTABLE_API_KEY` - Airtable API key
- `AIRTABLE_PAT` - Airtable Personal Access Token
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `EMAIL_PASSWORD` - Gmail app password

**Frontend Secrets:**
- `PROD_API_URL` - Production API URL (e.g., `http://51.20.107.134/api`)
- `PROD_STRIPE_PUBLIC_KEY` - Stripe publishable key
- `PROD_N8N_WEBHOOK_URL` - n8n webhook URL
- `PROD_APP_URL` - Production frontend URL (e.g., `http://51.20.107.134`)
- `VITE_AIRTABLE_PAT` - Airtable PAT (for frontend)
- `VITE_GROQ_API_KEY` - Groq API key

### Deployment Workflow Overview

The `.github/workflows/deploy.yml` workflow:

1. **Triggers:** On push/PR to main/master branches
2. **Build Frontend:** Creates production build with environment variables
3. **Create Environment Files:** Generates `.env.production` files for both frontend and backend
4. **Deploy to EC2:** Uses rsync to sync files (excludes node_modules, .git, .env files)
5. **Setup EC2:** Installs Node.js, PM2, Nginx
6. **Configure Nginx:** Sets up reverse proxy configuration
7. **Deploy Frontend:** Copies built frontend files to `/var/www/html`
8. **Start Backend:** Uses PM2 to manage backend process
9. **Verify Deployment:** Checks health endpoint and PM2 status

### Key Deployment Details

**Backend:**
- Runs on port 4242 (behind nginx reverse proxy)
- Managed by PM2 using `ecosystem.config.cjs`
- Environment: Production mode
- Auto-restart on failure
- Logs stored in `./logs/` directory

**Frontend:**
- Built with Vite in production mode
- Served by Nginx from `/var/www/html`
- All routes handled by `index.html` (SPA routing)
- Static assets cached for 1 year

**Nginx:**
- Listens on port 80 (HTTP)
- Proxies `/api/*` to backend on port 4242
- Proxies `/api/stripe-webhook` to backend
- Rate limiting: 10 requests/second on API routes
- Gzip compression enabled
- Security headers configured

---

## Manual Deployment (If GitHub Actions Fails)

If the automated deployment fails, you can deploy manually:

```bash
# 1. SSH into EC2
ssh -i /path/to/your/key.pem ubuntu@51.20.107.134

# 2. Navigate to project
cd /home/ubuntu/my-react-app

# 3. Pull latest changes
git pull origin main

# 4. Build frontend
cd frontend
npm install
npm run build

# 5. Deploy frontend to nginx
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 6. Setup backend
cd ../backend
npm install --production
cp .env.production .env

# 7. Restart backend with PM2
cd ..
pm2 reload backend --update-env
pm2 save

# 8. Restart nginx
sudo systemctl restart nginx

# 9. Verify
curl http://localhost:4242/health
pm2 list
sudo systemctl status nginx
```

---

## Troubleshooting

### Frontend Shows "Loading product..."
**Check:**
1. Backend is running: `pm2 list`
2. Backend health: `curl http://localhost:4242/health`
3. API accessible: `curl http://51.20.107.134/api/products`
4. Browser console for errors (F12)

### Backend Not Starting
**Check:**
1. PM2 logs: `pm2 logs backend`
2. Environment variables: `cat backend/.env`
3. Port availability: `sudo lsof -i :4242`
4. Node version: `node --version` (should be 20.x)

### Nginx Not Serving Frontend
**Check:**
1. Nginx status: `sudo systemctl status nginx`
2. Nginx config test: `sudo nginx -t`
3. Frontend files exist: `ls -la /var/www/html/`
4. Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Stripe Webhook Failing
**Check:**
1. Webhook route matches: `/api/stripe-webhook` (not `/webhook`)
2. Stripe webhook secret in backend `.env`
3. Nginx proxy passes through correctly
4. Backend logs show webhook receipt

### CORS Errors
**Check:**
1. `FRONTEND_URL` in backend `.env` matches production URL
2. Nginx CORS headers (should pass through backend CORS)
3. Browser console for specific CORS error

---

## Monitoring

### Check Backend Status
```bash
pm2 list                    # Show all PM2 processes
pm2 logs backend            # Show backend logs
pm2 monit                  # Monitor all processes in real-time
```

### Check Nginx Status
```bash
sudo systemctl status nginx    # Show nginx status
sudo tail -f /var/log/nginx/error.log  # Show nginx errors
sudo tail -f /var/log/nginx/access.log # Show nginx access
```

### Check Backend Health
```bash
# From EC2
curl http://localhost:4242/health

# From outside
curl http://51.20.107.134/health
```

---

## Next Steps

1. **Configure GitHub Secrets:** Add all required secrets to your GitHub repository settings
2. **Test Local Deployment:** Verify the fixes work locally with both frontend and backend running
3. **Commit and Push:** Push changes to trigger GitHub Actions deployment
4. **Monitor Deployment:** Watch GitHub Actions logs for any errors
5. **Verify Production:** Test the deployed application at `http://51.20.107.134`

---

## Files Modified

1. `frontend/src/App.jsx` - Fixed API response handling
2. `frontend/src/pages/ProductPage.jsx` - Fixed API response handling
3. `frontend/src/components/HeroCarousel.jsx` - Fixed API response handling
4. `backend/server.js` - Removed hardcoded .env path
5. `nginx.conf` - Fixed root path and webhook route

All changes are backwards compatible and will work in both development and production environments.