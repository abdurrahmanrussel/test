#!/bin/bash
# ============================================
# Delete and Recreate Repository - Fresh Start
# ============================================

echo "🗑️  Creating fresh repository..."

# Delete old test-repo directory
if [ -d "$HOME/code/test-repo" ]; then
    echo "📁 Removing old test-repo directory..."
    rm -rf ~/code/test-repo
fi

echo ""
echo "✅ Old repository removed!"

echo ""
echo "📋 Manual Steps Required:"
echo ""
echo "1. Go to: https://github.com/abdurrahmanrussel/test/settings"
echo "2. Scroll to bottom"
echo "3. Click 'Delete this repository'"
echo "4. Confirm deletion"
echo "5. Go to: https://github.com/new"
echo "6. Repository name: test"
echo "7. Make it PUBLIC"
echo "8. Click 'Create repository'"
echo ""
echo "⏸️  PAUSE: Please complete steps above before continuing..."
read -p "Press Enter after you've recreated the repository..."

echo ""
echo "🚀 Cloning new repository and uploading files..."

# Clone new repository
cd ~/code
git clone https://github.com/abdurrahmanrussel/test.git test-repo
cd test-repo

# Copy all files from current project (excluding node_modules and .git)
echo "📋 Copying files..."
rsync -av --exclude=node_modules --exclude=.git --exclude=dist ~/code/my-react-app/ .

# Add all files
echo "💾 Committing files..."
git add .
git commit -m "Fresh deployment configuration

- GitHub Actions workflow
- Environment files (secrets in \$VARIABLE placeholders)
- PM2 configuration
- Nginx configuration
- Deployment scripts
- Source code
- Updated with EC2 IP: 51.20.107.134"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Fresh repository created and files uploaded!"
echo ""
echo "🎯 Next steps:"
echo "1. GitHub Secrets are already added - no need to add again!"
echo "2. Watch deployment at: https://github.com/abdurrahmanrussel/test/actions"
echo "3. Verify at: http://51.20.107.134"
echo ""
echo "🎉 Ready to deploy!"