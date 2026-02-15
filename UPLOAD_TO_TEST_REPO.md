# 📤 Upload Files to Test Repository

## 🎯 Target Repository
**URL:** https://github.com/abdurrahmanrussel/test

---

## 📂 Current Project Has All Files Ready

✅ Folders already exist in this project:
- `.github/workflows/`
- `scripts/`
- `n8n/`

✅ All files are ready to upload!

---

## 🚀 Step-by-Step Upload Instructions

### Option A: Use GitHub Web UI (Easiest)

#### Step 1: Open Test Repository
1. Go to: https://github.com/abdurrahmanrussel/test
2. Click **Code** → **Create new file**

#### Step 2: Create Folder Structure

**Create `.github/workflows/` folder:**
1. In the "Name your file" field, type: `.github/workflows/deploy.yml`
2. Paste the content from this project's `.github/workflows/deploy.yml`
3. Scroll down and click **Commit changes**
4. Message: "Add GitHub Actions workflow"
5. Click **Commit changes**

**Create `scripts/` folder:**
1. Click **Add file** → **Create new file**
2. Name: `scripts/setup-ec2.sh`
3. Paste content from `scripts/setup-ec2.sh`
4. Commit

**Create `scripts/manual-deploy.sh`:**
1. Click **Add file** → **Create new file**
2. Name: `scripts/manual-deploy.sh`
3. Paste content from `scripts/manual-deploy.sh`
4. Commit

**Create `n8n/` folder:**
1. Click **Add file** → **Create new file**
2. Name: `n8n/n8n.config.js`
3. Paste content from `n8n/n8n.config.js`
4. Commit

#### Step 3: Upload Root Files

Upload these files to root directory:

1. **`ecosystem.config.cjs`**
   - Click **Add file** → **Upload files**
   - Drag and drop: `ecosystem.config.cjs`
   - Commit: "Add PM2 configuration"

2. **`nginx.conf`**
   - Click **Add file** → **Upload files**
   - Drag and drop: `nginx.conf`
   - Commit: "Add Nginx configuration"

#### Step 4: Upload Frontend Files

Upload to `frontend/` folder:

1. **`frontend/.env.local`**
   - Click **Add file** → **Upload files**
   - Name: `frontend/.env.local`
   - Paste content from this project
   - Commit: "Add frontend dev env"

2. **`frontend/.env.production`**
   - Click **Add file** → **Upload files**
   - Name: `frontend/.env.production`
   - Paste content from this project
   - Commit: "Add frontend prod env"

#### Step 5: Upload Backend Files

Upload to `backend/` folder:

1. **`backend/.env.local`**
   - Click **Add file** → **Upload files**
   - Name: `backend/.env.local`
   - Paste content from this project
   - Commit: "Add backend dev env"

2. **`backend/.env.production`**
   - Click **Add file** → **Upload files**
   - Name: `backend/.env.production`
   - Paste content from this project
   - Commit: "Add backend prod env"

#### Step 6: Upload Your Source Code

If your test repo doesn't have your source code yet, upload:

**Backend:**
```bash
# From this project, copy all backend files
backend/
├── server.js
├── package.json
├── package-lock.json
├── .env (if exists)
├── controllers/
├── middleware/
└── services/
```

**Frontend:**
```bash
# From this project, copy all frontend files (except node_modules)
frontend/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env (if exists)
├── public/
└── src/
```

---

### Option B: Use Git CLI (Faster)

#### Step 1: Clone Test Repository
```bash
# Go to your workspace
cd ~/code

# Clone the test repository
git clone https://github.com/abdurrahmanrussel/test.git
cd test
```

#### Step 2: Copy Files from This Project

```bash
# Copy configuration files
cp ~/code/my-react-app/ecosystem.config.cjs .
cp ~/code/my-react-app/nginx.conf .

# Copy GitHub Actions
mkdir -p .github/workflows
cp ~/code/my-react-app/.github/workflows/deploy.yml .github/workflows/

# Copy scripts
mkdir -p scripts
cp ~/code/my-react-app/scripts/setup-ec2.sh scripts/
cp ~/code/my-react-app/scripts/manual-deploy.sh scripts/

# Copy n8n config
mkdir -p n8n
cp ~/code/my-react-app/n8n/n8n.config.js n8n/

# Copy frontend env files
mkdir -p frontend
cp ~/code/my-react-app/frontend/.env.local frontend/
cp ~/code/my-react-app/frontend/.env.production frontend/

# Copy backend env files
mkdir -p backend
cp ~/code/my-react-app/backend/.env.local backend/
cp ~/code/my-react-app/backend/.env.production backend/
```

#### Step 3: Copy Source Code (If Needed)

```bash
# Copy backend source code
cp -r ~/code/my-react-app/backend/* backend/
# Remove if not needed
rm -f backend/node_modules backend/.env

# Copy frontend source code
cp -r ~/code/my-react-app/frontend/* frontend/
# Remove if not needed
rm -rf frontend/node_modules frontend/.env
```

#### Step 4: Commit and Push
```bash
# Add all files
git add .

# Commit
git commit -m "Add deployment configuration and source code"

# Push to test repository
git push origin main
```

---

### Option C: Copy All Files at Once (Fastest)

```bash
# Go to workspace
cd ~/code

# Clone test repository
git clone https://github.com/abdurrahmanrussel/test.git test-repo
cd test-repo

# Copy everything from current project (except node_modules and .git)
rsync -av --exclude=node_modules --exclude=.git ~/code/my-react-app/ .

# Add, commit, push
git add .
git commit -m "Add all files from my-react-app"
git push origin main
```

---

## ✅ Upload Checklist

### Files to Upload (10 files):

- [ ] `.github/workflows/deploy.yml`
- [ ] `frontend/.env.local`
- [ ] `frontend/.env.production`
- [ ] `backend/.env.local`
- [ ] `backend/.env.production`
- [ ] `ecosystem.config.cjs`
- [ ] `nginx.conf`
- [ ] `scripts/setup-ec2.sh`
- [ ] `scripts/manual-deploy.sh`
- [ ] `n8n/n8n.config.js`

### Source Code (If Not Already in Test Repo):

- [ ] All backend files (`server.js`, `controllers/`, `services/`, etc.)
- [ ] All frontend files (`src/`, `public/`, `index.html`, etc.)

---

## 📝 After Uploading Files

### Step 1: Add GitHub Secrets

Go to: https://github.com/abdurrahmanrussel/test/settings/secrets/actions

**Add 5 secrets:**

```
1. EC2_HOST
   Value: 51.20.107.134

2. EC2_SSH_KEY
   Value: [Paste your .pem file content]
   To get .pem content:
   cat ~/.ssh/ec2-key.pem | pbcopy  (Mac)
   type C:\path\to\ec2-key.pem (Windows)
   
3. PROD_API_URL
   Value: http://51.20.107.134

4. PROD_APP_URL
   Value: http://51.20.107.134

5. PROD_N8N_WEBHOOK_URL
   Value: http://51.20.107.134:5678/webhook
```

### Step 2: Deploy!

Push to `main` branch:
```bash
git push origin main
```

Or if using GitHub web UI, push your last commit.

### Step 3: Watch GitHub Actions

Go to: https://github.com/abdurrahmanrussel/test/actions

Watch the workflow run. It will:
1. Build frontend
2. Deploy to EC2
3. Restart services

### Step 4: Verify Deployment

After workflow completes:
```bash
# SSH to EC2
ssh -i ~/.ssh/ec2-key.pem ubuntu@51.20.107.134

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check backend health
curl http://localhost:4242/health
```

Open browser:
- Frontend: http://51.20.107.134
- Backend: http://51.20.107.134/health
- n8n: http://51.20.107.134:5678

---

## 🎯 Recommended Method

**For beginners:** Use Option A (GitHub Web UI) - easier to understand

**For faster upload:** Use Option C (rsync) - copies everything at once

**For control:** Use Option B (Git CLI) - selective file copying

---

## ⚠️ Important Notes

### 1. Source Code
If your test repository already has source code, you only need to upload:
- Configuration files (ecosystem.config.cjs, nginx.conf)
- Environment files (.env files)
- Deployment scripts
- GitHub Actions workflow

### 2. .env Files
Make sure NOT to commit `.env` files (use `.env.local` and `.env.production` instead).

### 3. node_modules
Never upload `node_modules` folders! They will be installed automatically during deployment.

### 4. .pem File
Don't upload your .pem file to GitHub! Add it as a GitHub Secret instead.

---

## 🆘 Troubleshooting

### Issue: Can't upload to GitHub
**Solution:**
- Check you're authenticated: `git config user.name` and `git config user.email`
- Check repository URL: `git remote -v`
- Use personal access token if needed

### Issue: File already exists
**Solution:**
- Edit the file instead of creating new one
- Or delete and re-upload

### Issue: GitHub Actions fails
**Solution:**
- Check GitHub Secrets are correct
- Check EC2 instance is running
- Check security group allows ports 22, 80, 5678

---

## ✅ Summary

**Upload these 10 files to: https://github.com/abdurrahmanrussel/test**

**After uploading:**
1. Add 5 GitHub Secrets
2. Push to main
3. Watch GitHub Actions deploy
4. Verify at: http://51.20.107.134

Good luck! 🚀