#!/bin/bash
# ============================================
# Upload Files to Test Repository
# ============================================

# Variables
CURRENT_PROJECT="$HOME/code/my-react-app"
TEST_REPO="$HOME/code/test-repo"
GITHUB_REPO="https://github.com/abdurrahmanrussel/test.git"

echo "🚀 Starting upload to test repository..."
echo ""

# ============================================
# Step 1: Clone Test Repository
# ============================================
echo "📥 Step 1/5: Cloning test repository..."
cd "$HOME/code"

# Check if repo already exists
if [ -d "test-repo" ]; then
    echo "⚠️  Test repository already exists. Pulling latest changes..."
    cd test-repo
    git pull origin main
else
    echo "✅ Cloning new test repository..."
    git clone "$GITHUB_REPO" test-repo
    cd test-repo
fi

echo ""

# ============================================
# Step 2: Copy Configuration Files
# ============================================
echo "📋 Step 2/5: Copying configuration files..."

# Copy root config files
cp "$CURRENT_PROJECT/ecosystem.config.cjs" .
cp "$CURRENT_PROJECT/nginx.conf" .

# Create folders and copy files
mkdir -p .github/workflows
mkdir -p scripts
mkdir -p n8n
mkdir -p frontend
mkdir -p backend

# Copy GitHub Actions
cp "$CURRENT_PROJECT/.github/workflows/deploy.yml" .github/workflows/

# Copy scripts
cp "$CURRENT_PROJECT/scripts/setup-ec2.sh" scripts/
cp "$CURRENT_PROJECT/scripts/manual-deploy.sh" scripts/

# Copy n8n config
cp "$CURRENT_PROJECT/n8n/n8n.config.js" n8n/

# Copy frontend env files
cp "$CURRENT_PROJECT/frontend/.env.local" frontend/
cp "$CURRENT_PROJECT/frontend/.env.production" frontend/

# Copy backend env files
cp "$CURRENT_PROJECT/backend/.env.local" backend/
cp "$CURRENT_PROJECT/backend/.env.production" backend/

echo "✅ Configuration files copied!"

# ============================================
# Step 3: Copy Source Code (Optional)
# ============================================
echo ""
echo "📝 Step 3/5: Copying source code..."

# Ask if user wants to copy source code
read -p "Do you want to copy backend source code? (y/n): " copy_backend
if [ "$copy_backend" = "y" ] || [ "$copy_backend" = "Y" ]; then
    echo "📥 Copying backend source code..."
    cp -r "$CURRENT_PROJECT/backend/"* backend/
    rm -rf backend/node_modules
    rm -f backend/.env
    echo "✅ Backend source code copied!"
else
    echo "⏭️  Skipping backend source code"
fi

read -p "Do you want to copy frontend source code? (y/n): " copy_frontend
if [ "$copy_frontend" = "y" ] || [ "$copy_frontend" = "Y" ]; then
    echo "📥 Copying frontend source code..."
    cp -r "$CURRENT_PROJECT/frontend/"* frontend/
    rm -rf frontend/node_modules
    rm -f frontend/.env
    echo "✅ Frontend source code copied!"
else
    echo "⏭️  Skipping frontend source code"
fi

# ============================================
# Step 4: Commit Changes
# ============================================
echo ""
echo "💾 Step 4/5: Committing changes..."

git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "⚠️  No changes to commit. Exiting..."
    exit 0
fi

git commit -m "Add deployment configuration and source code

- Added GitHub Actions workflow
- Added environment files (local & production)
- Added PM2 configuration
- Added Nginx configuration
- Added deployment scripts
- Added n8n configuration
- Updated with EC2 IP: 51.20.107.134"

echo "✅ Changes committed!"

# ============================================
# Step 5: Push to GitHub
# ============================================
echo ""
echo "📤 Step 5/5: Pushing to GitHub..."

git push origin main

echo ""
echo "✅ Upload complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to: https://github.com/abdurrahmanrussel/test/settings/secrets/actions"
echo "2. Add 5 GitHub Secrets (see UPLOAD_TO_TEST_REPO.md)"
echo "3. Watch GitHub Actions deploy at: https://github.com/abdurrahmanrussel/test/actions"
echo "4. Verify deployment at: http://51.20.107.134"
echo ""