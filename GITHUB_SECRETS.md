# 🔐 GitHub Secrets to Add

## 📋 Go to: https://github.com/abdurrahmanrussel/test/settings/secrets/actions

## Add These 11 GitHub Secrets:

### 1. EC2_HOST
```
Value: 51.20.107.134
```

### 2. EC2_SSH_KEY
```
Value: [Paste your ENTIRE .pem file content]
```

**How to get your .pem file content:**
```bash
# Mac
cat ~/.ssh/ec2-key.pem | pbcopy

# Linux
cat ~/.ssh/ec2-key.pem
# Then copy everything from -----BEGIN RSA PRIVATE KEY----- to -----END RSA PRIVATE KEY-----

# Windows
type C:\path\to\ec2-key.pem
# Then copy everything from -----BEGIN RSA PRIVATE KEY----- to -----END RSA PRIVATE KEY-----
```

**IMPORTANT:** Paste the ENTIRE file including the BEGIN and END lines!

### 3. PROD_API_URL
```
Value: http://51.20.107.134
```

### 4. PROD_APP_URL
```
Value: http://51.20.107.134
```

### 5. PROD_N8N_WEBHOOK_URL
```
Value: http://51.20.107.134:5678/webhook
```

### 6. VITE_AIRTABLE_PAT
```
Value: paterTSUL9sw223Os.d23fd1775c98b0f5fc737687885e0b99c36a3ca3a5cc37fd29d543f2815ee8fd
```

### 7. VITE_GROQ_API_KEY
```
Value: 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
```

### 8. STRIPE_SECRET_KEY
```
Value: sk_test_51SuUd9EA8gXAaHAIbBAxmL71PpOzvP9jXKHwb17Yg7Gmh8rv72dHiw6cAPwxRYF0piwcANQITzkWUG3BDOACaW8u00Y2nuOAVu
```

### 9. STRIPE_WEBHOOK_SECRET
```
Value: whsec_66d310ef8496ec449cd0649ba896c665a5ff3cd986a8795833f9ab4639b71e7f
```

### 10. EMAIL_PASSWORD
```
Value: mhhp qiti gqny kjjj
```

### 11. PROD_STRIPE_PUBLIC_KEY
```
Value: pk_test_51SuUd9EA8gXAaHAIbBAxmL71PpOzvP9jXKHwb17Yg7Gmh8rv72dHiw6cAPwxRYF0piwcANQITzkWUG3BDOACaW8u00Y2nuOAVu
```

---

## 🚀 After Adding Secrets:

1. **Re-run the upload script:**
   ```bash
   cd ~/code/my-react-app
   bash UPLOAD_COMMANDS.sh
   ```

2. **Watch GitHub Actions deploy:**
   - Go to: https://github.com/abdurrahmanrussel/test/actions
   - Click on the latest workflow run
   - Watch it deploy to EC2

3. **Verify deployment:**
   - Frontend: http://51.20.107.134
   - Backend: http://51.20.107.134/health
   - n8n: http://51.20.107.134:5678

---

## ⚠️ Important Notes

### Security
- **NEVER** commit actual secrets to GitHub!
- **ALWAYS** use GitHub Secrets for sensitive data
- The files I updated now use `$VARIABLE` placeholders
- GitHub Actions replaces these with your actual secrets

### Why GitHub Blocked the Push
GitHub has secret scanning that detected:
- Airtable Personal Access Token
- Groq API Key
- Stripe API Keys
- Email Password

These are now replaced with `$VARIABLE` placeholders and added as GitHub Secrets.

### For Production
When you go to production, update these secrets:
- Use **live** Stripe keys instead of test keys
- Use stronger JWT secrets
- Use stronger n8n encryption key
- Use stronger passwords

---

## ✅ Checklist

- [ ] Go to GitHub Secrets page
- [ ] Add EC2_HOST
- [ ] Add EC2_SSH_KEY (paste ENTIRE .pem file)
- [ ] Add PROD_API_URL
- [ ] Add PROD_APP_URL
- [ ] Add PROD_N8N_WEBHOOK_URL
- [ ] Add VITE_AIRTABLE_PAT
- [ ] Add VITE_GROQ_API_KEY
- [ ] Add STRIPE_SECRET_KEY
- [ ] Add STRIPE_WEBHOOK_SECRET
- [ ] Add EMAIL_PASSWORD
- [ ] Add PROD_STRIPE_PUBLIC_KEY
- [ ] Re-run upload script
- [ ] Watch GitHub Actions deploy
- [ ] Verify at http://51.20.107.134

---

## 🎯 Quick Summary

**11 secrets to add:** All listed above

**After adding:** Run `bash UPLOAD_COMMANDS.sh` again

**Then:** Watch deployment at GitHub Actions

**Finally:** Verify at http://51.20.107.134

Done! 🚀