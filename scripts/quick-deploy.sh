#!/bin/bash

#############################################
# Quick Frontend Deploy Script
# Usage: bash scripts/quick-deploy.sh
#############################################

set -e

echo "🚀 Quick Frontend Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get EC2 host
EC2_HOST="51.20.107.134"

echo -e "${YELLOW}📦 Checking SSH key...${NC}"
if [ -z "$1" ]; then
    echo "Usage: bash scripts/quick-deploy.sh /path/to/ssh-key"
    exit 1
fi

SSH_KEY_PATH="$1"

echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd frontend
npm ci
npm run build
cd ..

echo -e "${YELLOW}📤 Deploying frontend to Nginx...${NC}"
rsync -avz --progress \
    -e "ssh -i $SSH_KEY_PATH" \
    frontend/dist/ \
    ubuntu@$EC2_HOST:/var/www/html/

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "${GREEN}🌐 Visit: http://$EC2_HOST${NC}"