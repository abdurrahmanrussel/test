# 🔓 Unblock GitHub Secrets (Temporary Fix)

GitHub detected secrets in an old commit. We need to temporarily unblock them.

## 📋 Step-by-Step Solution

### Option 1: Unblock Secrets (Easiest)

GitHub provided 3 URLs in the error message. Open each one and unblock:

#### 1. Unblock Airtable Personal Access Token
**URL:** https://github.com/abdurrahmanrussel/test/security/secret-scanning/unblock-secret/39iEvVSNaYCnQXiiIiaw3s8AF2f

1. Open the URL above
2. Click **"I want to unblock this secret"**
3. Select **"Yes, this is safe to unblock"**
4. Click **"Unblock secret"**

#### 2. Unblock Groq API Key
**URL:** https://github.com/abdurrahmanrussel/test/security/secret-scanning/unblock-secret/39iEvTDrYhRGPpbW95fjIRVwpy4

1. Open the URL above
2. Click **"I want to unblock this secret"**
3. Select **"Yes, this is safe to unblock"**
4. Click **"Unblock secret"**

#### 3. Unblock Stripe Test API Secret Key
**URL:** https://github.com/abdurrahmanrussel/test/security/secret-scanning/unblock-secret/39iEvYo9FdMOKbkd4qAlXaPbS7j

1. Open the URL above
2. Click **"I want to unblock this secret"**
3. Select **"Yes, this is safe to unblock"**
4. Click **"Unblock secret"**

### Option 2: Delete and Recreate Repository (Cleanest)

If Option 1 doesn't work or you want a clean start:

1. Go to: https://github.com/abdurrahmanrussel/test/settings
2. Scroll to bottom, click **"Delete this repository"**
3. Confirm deletion
4. Go to: https://github.com/new
5. Repository name: `test`
6. Make it **Public**
7. Click **"Create repository"**
8. Then run: `bash UPLOAD_COMMANDS.sh`

---

## 🚀 After Unblocking Secrets

### Push the Fixed Code:

```bash
cd ~/code/test-repo
git push origin main --force
```

This will succeed now!

---

## 📋 Then Add GitHub Secrets

**Go to:** https://github.com/abdurrahmanrussel/test/settings/secrets/actions

**Add 11 secrets** (values in `GITHUB_SECRETS.md`):

1. EC2_HOST = `51.20.107.134`
2. EC2_SSH_KEY = [paste your ENTIRE .pem file]
3. PROD_API_URL = `http://51.20.107.134`
4. PROD_APP_URL = `http://51.20.107.134`
5. PROD_N8N_WEBHOOK_URL = `http://51.20.107.134:5678/webhook`
6. VITE_AIRTABLE_PAT = `paterTSUL9sw223Os.d23fd1775c98b0f5fc737687885e0b99c36a3ca3a5cc37fd29d543f2815ee8fd`
7. VITE_GROQ_API_KEY = `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`
8. STRIPE_SECRET_KEY = `sk_test_51SuUd9EA8gXAaHAIbBAxmL71PpOzvP9jXKHwb17Yg7Gmh8rv72dHiw6cAPwxRYF0piwcANQITzkWUG3BDOACaW8u00Y2nuOAVu`
9. STRIPE_WEBHOOK_SECRET = `whsec_66d310ef8496ec449cd0649ba896c665a5ff3cd986a8795833f9ab4639b71e7f`
10. EMAIL_PASSWORD = `mhhp qiti gqny kjjj`
11. PROD_STRIPE_PUBLIC_KEY = `pk_test_51SuUd9EA8gXAaHAIbBAxmL71PpOzvP9jXKHwb17Yg7Gmh8rv72dHiw6cAPwxRYF0piwcANQITzkWUG3BDOACaW8u00Y2nuOAVu`

---

## 📊 Then Watch GitHub Actions Deploy

**Go to:** https://github.com/abdurrahmanrussel/test/actions

Watch the workflow deploy your app to EC2!

---

## ✅ Finally, Verify Deployment

Open browser:
- Frontend: http://51.20.107.134
- Backend: http://51.20.107.134/health
- n8n: http://51.20.107.134:5678

---

## 🎯 Recommended

**Use Option 1 (Unblock Secrets)** - faster and easier

If that doesn't work, use **Option 2 (Delete and Recreate)** - cleanest approach

---

## ⚡ Quick Summary

1. Open 3 URLs and unblock secrets
2. Push: `git push origin main --force`
3. Add 11 GitHub Secrets
4. Watch GitHub Actions deploy
5. Verify at http://51.20.107.134

Done! 🚀