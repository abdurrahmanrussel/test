# 🚀 EC2 Setup - Step by Step Guide

## ✅ Answer: YES - Create EC2 Instance First!

**Order of operations:**
1. ✅ Create EC2 instance
2. ✅ Clone your test repository
3. ✅ Update config files
4. ✅ Deploy

---

## 📋 STEP 1: Create EC2 Instance (DO THIS FIRST)

### 1.1. Log into AWS Console
- Go to: https://console.aws.amazon.com/
- Sign in with your AWS account

### 1.2. Launch EC2 Instance
1. Go to **EC2 Dashboard** → **Instances** → **Launch Instance**
2. **Name**: `my-react-app`
3. **OS Images**: Select **Ubuntu 22.04 LTS**
4. **Instance Type**: Choose **t2.medium** (2 vCPU, 4GB RAM)
   - ⚠️ t2.micro (1 vCPU, 1GB RAM) is FREE but may be too small for production
   - t2.medium is recommended for React + Node + n8n
5. **Key Pair**: 
   - Click "Create new key pair"
   - Name: `ec2-key` (or any name you want)
   - Key pair type: RSA
   - Private key file format: .pem
   - **IMPORTANT**: Download the .pem file immediately! You can't download it again later.
   - Save it in a safe place (e.g., `~/.ssh/ec2-key.pem`)

### 1.3. Configure Network Settings
1. **Network Settings** → **Edit**
2. **Security Group Name**: `my-react-app-sg`
3. **Description**: Security group for my-react-app
4. **Inbound Rules** - Add these:
   ```
   Type          Protocol  Port Range  Source
   SSH           TCP       22          Anywhere (0.0.0.0/0)
   HTTP          TCP       80          Anywhere (0.0.0.0/0)
   HTTPS         TCP       443         Anywhere (0.0.0.0/0)
   Custom TCP     TCP       5678        Anywhere (0.0.0.0/0)  (for n8n)
   ```

### 1.4. Configure Storage
- **Storage**: 20 GB GP3 (or more if needed)
- Free tier includes 30 GB storage

### 1.5. Launch Instance
1. Click **Launch Instance**
2. Wait for instance to be in **"Running"** state (2-3 minutes)
3. Click on the instance to see details
4. Copy the **Public IPv4 address** (e.g., `3.85.123.456`)

---

## 📋 STEP 2: Connect to EC2 Instance

### 2.1. Set Permissions on Your Key
```bash
# On Linux/Mac:
chmod 400 ~/.ssh/ec2-key.pem

# On Windows (PowerShell):
icacls.exe "C:\path\to\ec2-key.pem" /inheritance:r
```

### 2.2. SSH to EC2
```bash
# Replace with your actual EC2 public IP
ssh -i ~/.ssh/ec2-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Example:
ssh -i ~/.ssh/ec2-key.pem ubuntu@3.85.123.456
```

**First time login?** Type `yes` to accept the fingerprint.

### 2.3. Update System
Once connected, run:
```bash
sudo apt update
sudo apt upgrade -y
```

---

## 📋 STEP 3: Clone Your Test Repository

### 3.1. Navigate to Home Directory
```bash
cd ~
```

### 3.2. Clone the Repository
```bash
git clone https://github.com/abdurrahmanrussel/test.git my-react-app
cd my-react-app
```

### 3.3. Copy Configuration Files (OPTIONAL)
**If your test repository doesn't have the config files we created**, copy them from this project:

```bash
# Exit EC2 temporarily
exit

# On your local machine, copy files to EC2
scp -i ~/.ssh/ec2-key.pem \
  frontend/.env.local \
  frontend/.env.production \
  backend/.env.local \
  backend/.env.production \
  ecosystem.config.cjs \
  nginx.conf \
  scripts/setup-ec2.sh \
  scripts/manual-deploy.sh \
  ubuntu@YOUR_EC2_PUBLIC_IP:~/my-react-app/

# Copy n8n config
scp -i ~/.ssh/ec2-key.pem -r \
  n8n/ \
  ubuntu@YOUR_EC2_PUBLIC_IP:~/my-react-app/

# Copy GitHub workflow
scp -i ~/.ssh/ec2-key.pem -r \
  .github/ \
  ubuntu@YOUR_EC2_PUBLIC_IP:~/my-react-app/

# Reconnect to EC2
ssh -i ~/.ssh/ec2-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
cd ~/my-react-app
```

---

## 📋 STEP 4: Update Configuration Files

### 4.1. Know Your Domain
**Do you have a domain?** (e.g., `yourdomain.com`)
- **YES**: Great! Update all files with your domain
- **NO**: Use EC2 public IP for now, update with domain later

### 4.2. Update Domain Names (If You Have Domain)

**Edit nginx.conf:**
```bash
nano nginx.conf
```
Replace `yourdomain.com` with your actual domain (4 occurrences):
- `server_name yourdomain.com www.yourdomain.com`
- `ssl_certificate /etc/letsencrypt/live/yourdomain.com/...`
- etc.

Press `Ctrl+X`, then `Y`, then `Enter` to save.

**Edit frontend/.env.production:**
```bash
nano frontend/.env.production
```
Replace `yourdomain.com` with your actual domain (2 occurrences):
- `VITE_API_URL=https://yourdomain.com`
- `VITE_APP_URL=https://yourdomain.com`

**Edit backend/.env.production:**
```bash
nano backend/.env.production
```
Replace `yourdomain.com` with your actual domain (1 occurrence):
- `FRONTEND_URL=https://yourdomain.com`

**Edit ecosystem.config.cjs:**
```bash
nano ecosystem.config.cjs
```
Replace `yourdomain.com` with your actual domain (2 occurrences):
- `N8N_BASE_URL=https://n8n.yourdomain.com`
- `N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook`

### 4.3. Update n8n Credentials (IMPORTANT!)
```bash
nano ecosystem.config.cjs
```

Find and change these lines:
```javascript
env: {
  BASIC_AUTH_PASSWORD: 'CHANGE_THIS_STRONG_PASSWORD',      // ← CHANGE THIS
  N8N_ENCRYPTION_KEY: 'CHANGE_THIS_TO_STRONG_KEY',       // ← CHANGE THIS
  N8N_PORT: 5678,
  // ... rest of config
}
```

Use strong, random passwords!

---

## 📋 STEP 5: Make Scripts Executable
```bash
chmod +x scripts/setup-ec2.sh
chmod +x scripts/manual-deploy.sh
```

---

## 📋 STEP 6: Run Setup Script
```bash
bash scripts/setup-ec2.sh
```

This will:
- Install Node.js (v20)
- Install npm
- Install PM2
- Install Nginx
- Install SSL certificates (if domain is configured)
- Configure Nginx
- Copy SSL config files
- Set up everything

⏱️ **This takes 5-10 minutes** - be patient!

---

## 📋 STEP 7: Configure GitHub Secrets

### 7.1. Go to GitHub Repository
1. Go to: https://github.com/abdurrahmanrussel/test
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** → **New repository secret**

### 7.2. Add Required Secrets

**Secret 1: EC2_HOST**
```
Name: EC2_HOST
Value: YOUR_EC2_PUBLIC_IP  (e.g., 3.85.123.456)
```

**Secret 2: EC2_SSH_KEY**
```
Name: EC2_SSH_KEY
Value: [Paste the ENTIRE content of your .pem file]
```

To get .pem file content:
```bash
# On Linux/Mac:
cat ~/.ssh/ec2-key.pem | pbcopy  # Copies to clipboard

# On Windows:
type C:\path\to\ec2-key.pem
# Copy everything
```

**Secret 3: PROD_API_URL**
```
Name: PROD_API_URL
Value: https://yourdomain.com
# OR if no domain: http://YOUR_EC2_PUBLIC_IP
```

**Secret 4: PROD_APP_URL**
```
Name: PROD_APP_URL
Value: https://yourdomain.com
# OR if no domain: http://YOUR_EC2_PUBLIC_IP
```

**Secret 5: PROD_N8N_WEBHOOK_URL**
```
Name: PROD_N8N_WEBHOOK_URL
Value: https://n8n.yourdomain.com/webhook
# OR if no domain: http://YOUR_EC2_PUBLIC_IP:5678/webhook
```

### 7.3. Enable GitHub Actions
1. Go to **Actions** tab in your repository
2. If prompted, click **I understand my workflows, go ahead and enable them**

---

## 📋 STEP 8: Deploy!

### Option A: GitHub Actions (Automatic)
```bash
# On your local machine, push to main branch
git push origin main
```

GitHub Actions will automatically deploy to EC2! 🚀

### Option B: Manual Deployment
```bash
# On EC2, run:
bash scripts/manual-deploy.sh
```

---

## 📋 STEP 9: Verify Deployment

### 9.1. Check PM2 Status
```bash
pm2 status
```

Expected:
```
┌────┬──────────┬──────┬─────────┬────────┬─────────┬────────┬────────┐
│ id │ name     │ mode │ status  │ cpu    │ memory  │ user   │ uptime │
├────┼──────────┼──────┼─────────┼────────┼─────────┼────────┼────────┤
│ 0  │ backend  │ fork │ online  │ 0%     │ 100MB   │ ubuntu │ 0:00:05│
│ 1  │ n8n      │ fork │ online  │ 0%     │ 150MB   │ ubuntu │ 0:00:05│
└────┴──────────┴──────┴─────────┴────────┴─────────┴────────┴────────┘
```

### 9.2. Check Nginx Status
```bash
sudo systemctl status nginx
```

Expected: `Active: active (running)`

### 9.3. Test Health Check
```bash
curl http://localhost:4242/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T15:00:00.000Z",
  "environment": "production",
  "cors": "https://yourdomain.com"
}
```

### 9.4. Test in Browser
Open your browser and visit:
- **Frontend**: `https://yourdomain.com` (or `http://YOUR_EC2_IP`)
- **Backend**: `https://yourdomain.com/health` (or `http://YOUR_EC2_IP/health`)
- **n8n**: `https://n8n.yourdomain.com` (or `http://YOUR_EC2_IP:5678`)

---

## 📋 STEP 10: Point Domain to EC2 (If You Have Domain)

### 10.1. Get EC2 IP
- Copy your EC2 **Public IPv4 address** (e.g., `3.85.123.456`)

### 10.2. Update DNS Records
Go to your domain registrar (Namecheap, GoDaddy, Route 53, etc.) and add:

**A Records:**
```
Type: A
Name: @
Value: 3.85.123.456  (your EC2 IP)
TTL: 3600 (or default)

Type: A
Name: www
Value: 3.85.123.456  (your EC2 IP)
TTL: 3600

Type: A
Name: n8n
Value: 3.85.123.456  (your EC2 IP)
TTL: 3600
```

### 10.3. Wait for DNS Propagation
DNS changes can take **5 minutes to 48 hours** to propagate worldwide.
Check status: https://www.whatsmydns.net/

### 10.4. Update SSL Certificates (After DNS Propagates)
```bash
# On EC2
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d n8n.yourdomain.com
```

---

## ✅ Summary of Steps

1. ✅ **Create EC2 instance** (Ubuntu 22.04, t2.medium)
2. ✅ **Download SSH key** (.pem file)
3. ✅ **Configure security group** (ports 22, 80, 443, 5678)
4. ✅ **SSH to EC2**
5. ✅ **Clone test repository**
6. ✅ **Update domain names** in config files (if you have domain)
7. ✅ **Update n8n passwords** in ecosystem.config.cjs
8. ✅ **Run setup script** (`bash scripts/setup-ec2.sh`)
9. ✅ **Add GitHub Secrets**
10. ✅ **Deploy!** (push to main or run manual deploy)

---

## 💰 Cost Estimate

### Free Tier (First 12 Months)
- **EC2 (t2.micro)**: $0 (750 hrs/month free)
- **Data Transfer**: 100 GB free
- **Total**: ~$0

### After Free Tier
- **EC2 (t2.medium)**: ~$30-35/month
- **Data Transfer**: $0.09/GB (after 100 GB)
- **Total**: ~$35-40/month

---

## 🆘 Common Issues & Solutions

### Issue: SSH Connection Refused
**Solution**: Check security group allows port 22 from your IP

### Issue: Nginx 502 Bad Gateway
**Solution**: Check PM2 is running: `pm2 status`

### Issue: Domain Not Loading
**Solution**: 
1. Wait for DNS propagation (5-48 hours)
2. Check A records point to correct EC2 IP
3. Check security group allows ports 80, 443

### Issue: GitHub Actions Fails
**Solution**:
1. Check EC2_HOST is correct
2. Check EC2_SSH_KEY has entire .pem content
3. Check EC2 instance is running

---

## 🎯 You're Ready!

Follow these steps in order and you'll have your app deployed to EC2! 

For detailed troubleshooting, see:
- `EC2_DEPLOYMENT_GUIDE.md`
- `TROUBLESHOOTING_LOGIN_ERROR.md`