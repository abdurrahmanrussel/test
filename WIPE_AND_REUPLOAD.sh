#!/bin/bash
# ============================================
# Delete All Files and Re-upload Fresh
# ============================================

echo "🗑️  Wiping repository clean..."

# Go to test repository
cd ~/code/test-repo

# Delete all files and folders (except .git directory)
echo "📁 Removing all files..."
rm -rf .github
rm -rf backend
rm -rf frontend
rm -rf n8n
rm -rf scripts
rm -f .env*
rm -f *.md
rm -f *.sh
rm -f *.cjs
rm -f *.conf
rm -f *.js
rm -f *.json
rm -f *.yml
rm -f *.yaml

echo "✅ All files deleted!"

echo ""
echo "📋 Copying fresh files from my-react-app..."

# Copy all files from my-react-app (excluding node_modules, .git, dist)
rsync -av --exclude=node_modules --exclude=.git --exclude=dist ~/code/my-react-app/ .

echo "✅ Fresh files copied!"

echo ""
echo "💾 Committing changes..."
git add .

# Check if there are changes
if git diff --cached --quiet; then
    echo "⚠️  No changes to commit. Exiting..."
    exit 0
fi

git commit -m "Clean upload: Remove all files, re-upload fresh configuration

- GitHub Actions workflow (with \$VARIABLE placeholders)
- Environment files (local and production, no secrets)
- PM2 configuration
- Nginx configuration
- Deployment scripts
- n8n configuration
- Source code (frontend and backend)
- Documentation files
- Updated with EC2 IP: 51.20.107.134

All secrets removed, using GitHub Secrets."

echo "✅ Changes committed!"

echo ""
echo "📤 Pushing to GitHub..."
git push origin main --force

echo ""
echo "✅ Fresh upload complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Watch deployment: https://github.com/abdurrahmanrussel/test/actions"
echo "2. GitHub Secrets already added - no need to add again!"
echo "3. Verify deployment at: http://51.20.107.134"
echo ""
echo "🎉 Ready to deploy!"