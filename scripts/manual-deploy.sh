#!/bin/bash

#############################################
# Manual Deployment Script for EC2
# Usage: bash scripts/manual-deploy.sh
# Run this from your local machine or EC2
#############################################

set -e

echo "🚀 Starting Manual Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running on EC2 or locally
if [ "$HOME" = "/home/ubuntu" ]; then
    echo -e "${YELLOW}📦 Running on EC2...${NC}"
    ON_EC2=true
else
    echo -e "${YELLOW}📦 Running locally...${NC}"
    ON_EC2=false
fi

if [ "$ON_EC2" = true ]; then
    # Deployment on EC2
    
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull origin main
    
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend
    npm ci --production
    cd ..
    
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend
    npm ci
    
    echo -e "${YELLOW}🔨 Building frontend...${NC}"
    npm run build
    cd ..
    
    echo -e "${YELLOW}🔄 Restarting services with PM2...${NC}"
    pm2 reload backend --update-env
    pm2 reload n8n --update-env
    
    echo -e "${YELLOW}🔍 Checking service status...${NC}"
    sleep 5
    pm2 status
    
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
else
    # Deployment from local to EC2
    echo -e "${YELLOW}🔧 Deploying to EC2...${NC}"
    
    read -p "Enter EC2 host IP or domain: " EC2_HOST
    read -p "Enter path to EC2 SSH key: " SSH_KEY_PATH
    
    # Build frontend locally
    echo -e "${YELLOW}🔨 Building frontend locally...${NC}"
    cd frontend
    npm ci
    npm run build
    cd ..
    
    # Deploy to EC2
    echo -e "${YELLOW}📤 Deploying to EC2...${NC}"
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH" \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.env.local' \
        --exclude 'frontend/dist' \
        --exclude 'logs' \
        --exclude '.env' \
        ./ \
        ubuntu@$EC2_HOST:/home/ubuntu/my-react-app/
    
    # Install dependencies and restart services
    ssh -i $SSH_KEY_PATH ubuntu@$EC2_HOST << 'ENDSSH'
        cd /home/ubuntu/my-react-app
        
        echo "Installing backend dependencies..."
        cd backend
        npm ci --production
        cd ..
        
        echo "Installing frontend dependencies..."
        cd frontend
        npm ci
        echo "Building frontend..."
        npm run build
        cd ..
        
        echo "Restarting services..."
        pm2 reload backend --update-env
        pm2 reload n8n --update-env
        pm2 save
        
        echo "Checking status..."
        pm2 status
ENDSSH
    
    echo -e "${GREEN}✅ Deployment to EC2 successful!${NC}"
fi

echo ""
echo -e "${GREEN}📊 Service URLs:${NC}"
if [ "$ON_EC2" = true ]; then
    echo "  Check with: pm2 monit"
    echo "  View logs: pm2 logs"
else
    echo "  SSH into EC2 to check status"
fi