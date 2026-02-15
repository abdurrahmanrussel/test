# EC2 Deployment Guide - My React App

Complete guide for deploying your React + Express + n8n application to AWS EC2.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [What You Need to Provide](#what-you-need-to-provide)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Configuration Files](#configuration-files)
6. [GitHub CI/CD Setup](#github-cicd-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Cost Breakdown](#cost-breakdown)

---

## 🏗️ Architecture Overview

### Single EC2 Instance Setup
```
EC2 Instance (Ubuntu)
├── Frontend (React - served by Nginx on port 80/443)
├── Backend API (Express - port 5000)
├── n8n (Workflow Automation - port 5678)
├── PM2 (Process Manager)
└── Nginx (Reverse Proxy & SSL)
```

### Access URLs
- **Frontend**: `https://yourdomain.com`
- **Backend API**: `https://yourdomain.com/api`
- **n8n Dashboard**: `https://n8n.yourdomain.com`

---

## ✅ Prerequisites

### Required
- AWS Account
- Domain name (e.g., from Namecheap, GoDaddy, etc.)
- EC2 Instance (t2.medium recommended)
- SSH key pair for EC2 access

### Optional
- Database (MongoDB Atlas or PostgreSQL)
- SMTP email service (SendGrid, Mailgun, etc.)

---

## 🔑 What You Need to Provide

### 1. Domain & DNS
- [ ] Register domain name
- [ ] Point A record to EC2 IP address
- [ ] Create `n8n` subdomain pointing to same IP

### 2. AWS Configuration
- [ ] Launch EC2 instance (Ubuntu 22.04 LTS)
- [ ] Create/Download SSH key pair (`.pem` file)
- [ ] Configure Security Group (ports: 22, 80, 443)
- [ ] Note down EC2 public IP address

### 3. Environment Variables (CRITICAL)

#### Frontend Variables (`frontend/.env.production`)
```bash
VITE_API_URL=https://yourdomain.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_STRIPE_PUBLIC_KEY
VITE_N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
VITE_APP_URL=https://yourdomain.com
VITE_APP_NAME=Your App Name
```

#### Backend Variables (`backend/.env.production`)
```bash
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# JWT Secret (USE STRONG RANDOM VALUE!)
JWT_SECRET=CHANGE_THIS_TO_STRONG_RANDOM_SECRET

# Airtable
AIRTABLE_API_KEY=patYOUR_AIRTABLE_TOKEN
AIRTABLE_BASE_ID=appYOUR_BASE_ID

# Stripe (Live Mode)
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Email Configuration
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourdomain.com

# n8n
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
```

#### n8n Configuration (in PM2 ecosystem)
```bash
N8N_ENCRYPTION_KEY=CHANGE_THIS_TO_STRONG_KEY
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
WEBHOOK_URL=https://n8n.yourdomain.com/
```

### 4. GitHub Secrets (for CI/CD)
Go to: GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

Required Secrets:
- `EC2_HOST` - EC2 IP address or domain
- `EC2_SSH_KEY` - Complete content of your `.pem` file (include all lines)
- `PROD_API_URL` - https://yourdomain.com/api
- `PROD_APP_URL` - https://yourdomain.com
- `PROD_N8N_WEBHOOK_URL` - https://n8n.yourdomain.com/webhook
- `PROD_STRIPE_PUBLIC_KEY` - Stripe live public key
- `PROD_STRIPE_SECRET_KEY` - Stripe live secret key
- `PROD_STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `PROD_APP_NAME` - Your application name
- `JWT_SECRET` - Strong random JWT secret
- `AIRTABLE_API_KEY` - Airtable PAT
- `AIRTABLE_BASE_ID` - Airtable base ID
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port (usually 587)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_FROM` - From email address

---

## 🚀 Step-by-Step Deployment

### Phase 1: Initial EC2 Setup

#### 1. Launch EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Choose Ubuntu Server 22.04 LTS
3. Instance type: `t2.medium` (2 vCPU, 4GB RAM)
4. Create/Select key pair
5. Configure Security Group:
   - SSH (Port 22) - Your IP
   - HTTP (Port 80) - 0.0.0.0/0
   - HTTPS (Port 443) - 0.0.0.0/0
6. Launch instance

#### 2. Connect to EC2
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP
```

#### 3. Run Setup Script
```bash
# Clone your repository
git clone https://github.com/abdurrahmanrussel/aa.git my-react-app
cd my-react-app

# Make script executable
chmod +x scripts/setup-ec2.sh

# Run setup script
bash scripts/setup-ec2.sh
```

The script will:
- Install Node.js, Nginx, PM2
- Set up project structure
- Install dependencies
- Build frontend
- Configure Nginx
- Setup SSL certificates
- Start services with PM2

#### 4. Configure Environment Files
```bash
# Edit backend environment
nano backend/.env.production
# Add all your production values

# Edit frontend environment
nano frontend/.env.production
# Add all your production values

# Update PM2 ecosystem with n8n credentials
nano ecosystem.config.cjs
# Update BASIC_AUTH_PASSWORD and N8N_ENCRYPTION_KEY
```

#### 5. Restart Services
```bash
pm2 reload all --update-env
pm2 save
```

### Phase 2: GitHub CI/CD Setup

#### 1. Add GitHub Secrets
Follow the "GitHub Secrets" section above to add all required secrets.

#### 2. Verify Workflow
- Push to main branch
- Go to GitHub → Actions
- Check deployment workflow status

#### 3. Verify Deployment
```bash
# On EC2
pm2 status
pm2 logs

# Check services
curl http://localhost:5000/health
```

---

## 📁 Configuration Files

### Files Created
1. **Environment Files**
   - `frontend/.env.local` - Local development
   - `frontend/.env.production` - Production
   - `backend/.env.local` - Local development
   - `backend/.env.production` - Production

2. **Process Management**
   - `ecosystem.config.cjs` - PM2 configuration for all services

3. **Web Server**
   - `nginx.conf` - Nginx configuration with SSL

4. **Deployment**
   - `.github/workflows/deploy.yml` - GitHub Actions CI/CD
   - `scripts/setup-ec2.sh` - Initial EC2 setup
   - `scripts/manual-deploy.sh` - Manual deployment

5. **n8n Configuration**
   - `n8n/n8n.config.js` - n8n settings and webhook endpoints

---

## 🔄 GitHub CI/CD Setup

### Automatic Deployment
Every push to `main` branch triggers:
1. Build frontend
2. Test backend
3. Deploy to EC2
4. Restart services
5. Verify health

### Manual Deployment
```bash
# On local machine
bash scripts/manual-deploy.sh

# Or on EC2
ssh -i key.pem ubuntu@EC2_IP
cd /home/ubuntu/my-react-app
bash scripts/manual-deploy.sh
```

---

## 📊 Monitoring & Maintenance

### Check Service Status
```bash
pm2 status           # View all processes
pm2 monit            # Real-time monitoring
pm2 logs             # View logs
pm2 logs backend     # View backend logs only
pm2 logs n8n         # View n8n logs only
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart all     # Restart all services
pm2 restart backend  # Restart backend only
pm2 restart n8n      # Restart n8n only
```

### Update Application
```bash
# Automatic via GitHub push
# Or manual:
git pull origin main
bash scripts/manual-deploy.sh
```

### SSL Certificate Renewal
```bash
# Certbot auto-renews, but you can check:
sudo certbot renew --dry-run

# Check expiry:
sudo certbot certificates
```

---

## 🔧 Troubleshooting

### Issue: Frontend not loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Backend API not responding
```bash
# Check PM2 status
pm2 status

# View backend logs
pm2 logs backend

# Check if port is listening
sudo netstat -tulpn | grep 5000
```

### Issue: n8n not accessible
```bash
# Check n8n status
pm2 status

# View n8n logs
pm2 logs n8n

# Check Nginx config for n8n subdomain
sudo cat /etc/nginx/sites-available/yourdomain.com
```

### Issue: Deployment failed
```bash
# Check GitHub Actions logs
# Check EC2 logs:
pm2 logs --lines 100

# Manually redeploy
bash scripts/manual-deploy.sh
```

### Issue: SSL Certificate Error
```bash
# Reissue certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d n8n.yourdomain.com

# Force renewal
sudo certbot renew --force-renewal
```

---

## 💰 Cost Breakdown

### AWS Free Tier (First 12 Months)
- **EC2 (t2.micro)**: Free for 750 hours/month
- **Data Transfer**: 100GB free
- **Total**: ~$0 (if within limits)

### After Free Tier
- **EC2 (t2.medium)**: ~$30-35/month
- **Data Transfer**: $0.09/GB (after 100GB)
- **Total**: ~$35-40/month

### Additional Costs (if needed)
- **Domain**: $10-15/year
- **Database**: Free tier available, or $15+/month
- **Email Service**: Free tier available, or $15+/month

### Optimization Tips
- Use `t2.small` instead of `t2.medium` if resource usage is low
- Monitor usage with AWS CloudWatch
- Consider AWS Lightsail for simpler pricing

---

## 🎯 Next Steps After Deployment

1. **Setup Database** (if using MongoDB/PostgreSQL)
2. **Configure Stripe Webhooks** in Stripe Dashboard
3. **Setup n8n Workflows** via `https://n8n.yourdomain.com`
4. **Configure Email Service** (SendGrid, Mailgun, etc.)
5. **Setup Monitoring** (CloudWatch, PagerDuty, etc.)
6. **Configure Backup Strategy** (EBS snapshots)
7. **Setup Error Tracking** (Sentry, Rollbar, etc.)

---

## 📞 Support

### Useful Commands Reference
```bash
# SSH to EC2
ssh -i key.pem ubuntu@EC2_IP

# Check system resources
htop
free -h
df -h

# PM2 Management
pm2 startup        # Setup PM2 startup
pm2 save           # Save process list
pm2 delete all     # Delete all processes
pm2 flush          # Clear logs

# Nginx Management
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

# View logs
journalctl -u nginx -f
pm2 logs --lines 200
```

### Important URLs After Setup
- **Frontend**: `https://yourdomain.com`
- **Backend API**: `https://yourdomain.com/api`
- **Health Check**: `https://yourdomain.com/health`
- **n8n Dashboard**: `https://n8n.yourdomain.com`

---

## ✅ Deployment Checklist

- [ ] Domain purchased and DNS configured
- [ ] EC2 instance launched with correct security group
- [ ] SSH key pair downloaded and secured
- [ ] Setup script run successfully
- [ ] Environment variables configured
- [ ] n8n credentials set in ecosystem.config.cjs
- [ ] Nginx configured with correct domain
- [ ] SSL certificates installed
- [ ] GitHub Secrets configured
- [ ] Test deployment via GitHub Actions
- [ ] Verify all services running (pm2 status)
- [ ] Test frontend accessibility
- [ ] Test backend API endpoints
- [ ] Test n8n dashboard
- [ ] Setup database (if needed)
- [ ] Configure Stripe webhooks
- [ ] Setup monitoring and alerts

---

## 🎉 You're Ready to Go!

Your application is now deployed to EC2 with:
- ✅ Automated CI/CD via GitHub Actions
- ✅ SSL/HTTPS certificates
- ✅ Process management with PM2
- ✅ Reverse proxy with Nginx
- ✅ n8n workflow automation
- ✅ Auto-restart on crashes
- ✅ Health monitoring

For questions or issues, refer to the troubleshooting section above.