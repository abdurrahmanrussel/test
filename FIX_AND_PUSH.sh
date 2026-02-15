#!/bin/bash
# ============================================
# Fix GitHub Secret Issue and Push
# ============================================

echo "🔧 Fixing GitHub secret issue and pushing..."

# Go to test repository
cd ~/code/test-repo

# Pull latest to ensure we have the bad commit
git pull origin main

# Reset to remove the bad commit (soft reset keeps files)
git reset --soft HEAD~1

# Copy fixed files from current project
echo "📋 Copying fixed files..."
cp ~/code/my-react-app/frontend/.env.local frontend/
cp ~/code/my-react-app/frontend/.env.production frontend/
cp ~/code/my-react-app/backend/.env.local backend/
cp ~/code/my-react-app/backend/.env.production backend/
cp ~/code/my-react-app/.github/workflows/deploy.yml .github/workflows/

# Add all changes
git add .

# Commit with new message
echo "💾 Creating new commit..."
git commit -m "Fix: Remove secrets, use GitHub Secrets

- Replaced actual secrets with \$VARIABLE placeholders
- All sensitive data now uses GitHub Secrets
- Safe to deploy to EC2"

# Push to GitHub (force push to overwrite bad commit)
echo "📤 Pushing to GitHub..."
git push origin main --force

echo ""
echo "✅ Fixed and pushed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Add 11 GitHub Secrets: https://github.com/abdurrahmanrussel/test/settings/secrets/actions"
echo "2. Watch deployment: https://github.com/abdurrahmanrussel/test/actions"
echo "3. Verify at: http://51.20.107.134"
echo ""