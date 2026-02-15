# 📁 Files to Upload to GitHub Test Repository

## ✅ Your EC2 Instance Details
- **Public IP**: `51.20.107.134`
- **Public DNS**: `ec2-51-20-107-134.eu-north-1.compute.amazonaws.com`
- **Instance Type**: t3.micro (FREE tier)
- **Region**: eu-north-1 (Europe)

---

## 📋 Files to Upload to Your Test Repository

### Required Files (MUST upload)

#### 1. GitHub Actions Workflow
**Path:** `.github/workflows/deploy.yml`
**Status:** ✅ Already created in this project
**Action:** Upload to `.github/workflows/` folder

#### 2. Environment Files (Frontend)
**Paths:**
- `frontend/.env.local`
- `frontend/.env.production`

**Status:** ✅ Already created
**Action:** Upload to `frontend/` folder

#### 3. Environment Files (Backend)
**Paths:**
- `backend/.env.local`
- `backend/.env.production`

**Status:** ✅ Already created
**Action:** Upload to `backend/` folder

#### 4. PM2 Configuration
**Path:** `ecosystem.config.cjs`
**Status:** ✅ Already created
**Action:** Upload to root folder

#### 5. Nginx Configuration
**Path:** `nginx.conf`
**Status:** ✅ Already created
**Action:** Upload to root folder

#### 6. Deployment Scripts
**Paths:**
- `scripts/setup-ec2.sh`
- `scripts/manual-deploy.sh`

**Status:** ✅ Already created
**Action:** Upload to `scripts/` folder (create folder if not exists)

#### 7. n8n Configuration
**Path:** `n8n/n8n.config.js`
**Status:** ✅ Already created
**Action:** Upload to `n8n/` folder (create folder if not exists)

---

## 🔧 Files to Update Before Uploading

### Option 1: Use EC2 Public IP (No Domain)

If you **don't have a domain**, use your EC2 IP:

**Update `frontend/.env.production`:**
```bash
VITE_API_URL=http://51.20.107.134
VITE_APP_URL=http://51.20.107.134
VITE_N8N_WEBHOOK_URL=http://51.20.107.134:5678/webhook
```

**Update `backend/.env.production`:**
```bash
FRONTEND_URL=http://51.20.107.134
N8N_WEBHOOK_URL=http://51.20.107.134:5678/webhook
```

**Update `nginx.conf`:**
```bash
server_name 51.20.107.134
```

**Update `ecosystem.config.cjs`:**
```bash
N8N_BASE_URL=http://51.20.107.134:5678
N8N_WEBHOOK_URL=http://51.20.107.134:5678/webhook
```

**⚠️ Note:** Without SSL, you'll use HTTP (not HTTPS)

---

### Option 2: Use Your Domain (Recommended)

If you **have a domain**, use it (better security with SSL):

**Update `frontend/.env.production`:**
```bash
VITE_API_URL=https://yourdomain.com
VITE_APP_URL=https://yourdomain.com
VITE_N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
```

**Update `backend/.env.production`:**
```bash
FRONTEND_URL=https://yourdomain.com
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
```

**Update `nginx.conf`:**
```bash
server_name yourdomain.com www.yourdomain.com
```

**Update `ecosystem.config.cjs`:**
```bash
N8N_BASE_URL=https://n8n.yourdomain.com
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
```

---

## 🚀 GitHub Actions Workflow

### ✅ YES! GitHub Actions YAML is Ready

**File:** `.github/workflows/deploy.yml`

**What it does:**
1. Checks out code from GitHub
2. Installs frontend dependencies
3. Builds frontend (production)
4. Installs backend dependencies
5. Creates production environment files
6. Copies files to EC2 via SSH
7. Installs dependencies on EC2
8. Restarts PM2 services
9. Verifies deployment

**Triggers:**
- Push to `main` branch
- Push to `master` branch
- Pull requests to `main` or `master`

**NO changes needed!** The workflow is ready to use.

---

## 🔑 GitHub Secrets to Add (After Uploading)

Go to: https://github.com/abdurrahmanrussel/test/settings/secrets/actions

### Required Secrets:

**1. EC2_HOST**
```
Name: EC2_HOST
Value: 51.20.107.134
```

**2. EC2_SSH_KEY**
```
Name: EC2_SSH_KEY
Value: [Paste ENTIRE content of your .pem file]
```

**3. PROD_API_URL**
```
Name: PROD_API_URL
Value: http://51.20.107.134
# Or if you have domain: https://yourdomain.com
```

**4. PROD_APP_URL**
```
Name: PROD_APP_URL
Value: http://51.20.107.134
# Or if you have domain: https://yourdomain.com
```

**5. PROD_N8N_WEBHOOK_URL**
```
Name: PROD_N8N_WEBHOOK_URL
Value: http://51.20.107.134:5678/webhook
# Or if you have domain: https://n8n.yourdomain.com/webhook
```

---

## 📝 Upload Checklist

### Step 1: Update Config Files
- [ ] Decide: Use EC2 IP or Domain?
- [ ] Update `frontend/.env.production` with URLs
- [ ] Update `backend/.env.production` with URLs
- [ ] Update `nginx.conf` with domain/IP
- [ ] Update `ecosystem.config.cjs` with domain/IP
- [ ] Update `ecosystem.config.cjs` n8n passwords (CHANGE_THEM!)

### Step 2: Upload Files to GitHub

**Create folder structure in test repo:**
```
test-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← Upload this
├── frontend/
│   ├── .env.local             ← Upload this
│   └── .env.production       ← Upload this
├── backend/
│   ├── .env.local             ← Upload this
│   └── .env.production       ← Upload this
├── scripts/
│   ├── setup-ec2.sh          ← Upload this
│   └── manual-deploy.sh      ← Upload this
├── n8n/
│   └── n8n.config.js        ← Upload this
├── ecosystem.config.cjs        ← Upload this
└── nginx.conf                 ← Upload this
```

**Upload options:**
1. **GitHub Web UI**: Create folders and upload files manually
2. **Git Command Line**: Clone test repo, copy files, push

### Step 3: Add GitHub Secrets
- [ ] Add EC2_HOST = `51.20.107.134`
- [ ] Add EC2_SSH_KEY = [your .pem file content]
- [ ] Add PROD_API_URL = `http://51.20.107.134` (or domain)
- [ ] Add PROD_APP_URL = `http://51.20.107.134` (or domain)
- [ ] Add PROD_N8N_WEBHOOK_URL = `http://51.20.107.134:5678/webhook` (or domain)

### Step 4: Deploy
- [ ] Push to `main` branch
- [ ] Watch GitHub Actions run
- [ ] Verify deployment on EC2

---

## ⚠️ Important Notes

### 1. Security Group
Make sure your EC2 security group allows:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 5678 (n8n)

### 2. Instance Type
Your instance is **t3.micro** (FREE tier):
- 2 vCPU, 1GB RAM
- May be sufficient for testing
- For production, consider **t2.medium** (2 vCPU, 4GB RAM)

### 3. Region
Your instance is in **eu-north-1** (Europe):
- Users in Asia may experience higher latency
- Consider us-east-1 (Virginia) for better Asia performance

### 4. Domain vs IP
**Using IP (no domain):**
- ✅ Easier, no DNS setup needed
- ⚠️ No SSL (HTTP only)
- ⚠️ Not as professional

**Using Domain:**
- ✅ SSL/HTTPS (secure)
- ✅ Professional appearance
- ✅ Better for production
- ⚠️ Requires DNS setup

---

## 🎯 Quick Upload Steps

### Using GitHub Web UI:

1. Go to: https://github.com/abdurrahmanrussel/test
2. Create folders: `.github/workflows/`, `scripts/`, `n8n/`
3. Upload files one by one
4. Commit changes
5. Push to main

### Using Git CLI:

```bash
# Clone test repo
git clone https://github.com/abdurrahmanrussel/test.git
cd test

# Copy files from this project
# Copy all the files listed above

# Commit and push
git add .
git commit -m "Add deployment configuration"
git push origin main
```

---

## ✅ Summary

**Files to upload:**
1. ✅ `.github/workflows/deploy.yml` - GitHub Actions
2. ✅ `frontend/.env.local` - Frontend dev env
3. ✅ `frontend/.env.production` - Frontend prod env
4. ✅ `backend/.env.local` - Backend dev env
5. ✅ `backend/.env.production` - Backend prod env
6. ✅ `ecosystem.config.cjs` - PM2 config
7. ✅ `nginx.conf` - Nginx config
8. ✅ `scripts/setup-ec2.sh` - Setup script
9. ✅ `scripts/manual-deploy.sh` - Deploy script
10. ✅ `n8n/n8n.config.js` - n8n config

**After uploading:**
1. Add GitHub Secrets (5 secrets needed)
2. Push to main branch
3. GitHub Actions will auto-deploy! 🚀

**Your EC2 IP:** `51.20.107.134`

**GitHub Actions YAML:** ✅ Ready (no changes needed)