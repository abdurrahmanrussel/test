# ⚡ Quick Upload Commands (Bash)

## 🚀 One Command to Upload Everything!

```bash
bash UPLOAD_COMMANDS.sh
```

**That's it!** The script will:
1. Clone test repository
2. Copy all configuration files
3. Ask if you want to copy source code
4. Commit changes
5. Push to GitHub

---

## 📝 Or Copy-Paste These Commands Manually

### Option 1: Upload Configuration Files Only (Fastest)

```bash
# Clone test repository
cd ~/code
git clone https://github.com/abdurrahmanrussel/test.git test-repo
cd test-repo

# Copy configuration files
cp ~/code/my-react-app/ecosystem.config.cjs .
cp ~/code/my-react-app/nginx.conf .

# Create folders and copy files
mkdir -p .github/workflows scripts n8n frontend backend

# Copy GitHub Actions
cp ~/code/my-react-app/.github/workflows/deploy.yml .github/workflows/

# Copy scripts
cp ~/code/my-react-app/scripts/setup-ec2.sh scripts/
cp ~/code/my-react-app/scripts/manual-deploy.sh scripts/

# Copy n8n config
cp ~/code/my-react-app/n8n/n8n.config.js n8n/

# Copy frontend env files
cp ~/code/my-react-app/frontend/.env.local frontend/
cp ~/code/my-react-app/frontend/.env.production frontend/

# Copy backend env files
cp ~/code/my-react-app/backend/.env.local backend/
cp ~/code/my-react-app/backend/.env.production backend/

# Commit and push
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Option 2: Upload Everything Including Source Code

```bash
# Clone test repository
cd ~/code
git clone https://github.com/abdurrahmanrussel/test.git test-repo
cd test-repo

# Copy everything (excluding node_modules and .git)
rsync -av --exclude=node_modules --exclude=.git ~/code/my-react-app/ .

# Commit and push
git add .
git commit -m "Add deployment configuration and source code"
git push origin main
```

---

## ✅ After Upload: Add GitHub Secrets

### Go to: https://github.com/abdurrahmanrussel/test/settings/secrets/actions

Add these 5 secrets:

```
1. EC2_HOST
   Value: 51.20.107.134

2. EC2_SSH_KEY
   Get content: cat ~/.ssh/ec2-key.pem | pbcopy  (Mac)
   Get content: type C:\path\to\ec2-key.pem  (Windows)
   Paste ENTIRE content

3. PROD_API_URL
   Value: http://51.20.107.134

4. PROD_APP_URL
   Value: http://51.20.107.134

5. PROD_N8N_WEBHOOK_URL
   Value: http://51.20.107.134:5678/webhook
```

---

## 🚀 Then Deploy!

Push to main branch and watch GitHub Actions deploy!

```bash
# Already done if you used the script
# If you used manual commands, push is done!

# Watch deployment at:
# https://github.com/abdurrahmanrussel/test/actions
```

---

## 🌐 Verify Deployment

After GitHub Actions completes:

```bash
# SSH to EC2
ssh -i ~/.ssh/ec2-key.pem ubuntu@51.20.107.134

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check backend health
curl http://localhost:4242/health

# Exit SSH
exit
```

Open browser:
- Frontend: http://51.20.107.134
- Backend: http://51.20.107.134/health
- n8n: http://51.20.107.134:5678

---

## 🎯 Recommended

**Use the automated script:**
```bash
bash UPLOAD_COMMANDS.sh
```

It's the easiest way! Just run it and answer the prompts.

---

## 📝 What the Script Does

1. ✅ Clones test repository
2. ✅ Copies all 10 configuration files
3. ✅ Asks if you want to copy source code (answer y/n)
4. ✅ Commits changes with descriptive message
5. ✅ Pushes to GitHub

**Total time:** ~2-3 minutes

---

## ⚡ Quick Start

```bash
# Just run this one command:
bash UPLOAD_COMMANDS.sh

# Then add GitHub Secrets (5 secrets)
# Then watch GitHub Actions deploy
# Then verify at: http://51.20.107.134
```

Done! 🚀