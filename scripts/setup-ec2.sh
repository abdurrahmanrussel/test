#!/bin/bash

#############################################
# EC2 Setup Script for My React App
# Usage: bash scripts/setup-ec2.sh
#############################################

set -e  # Exit on any error

echo "🚀 Starting EC2 Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
sudo apt install -y curl git nginx build-essential python3 software-properties-common

# Install Node.js 20.x
echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
echo -e "${GREEN}✅ Node version: $(node -v)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm -v)${NC}"

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Setup PM2 to start on boot
echo -e "${YELLOW}🔧 Setting up PM2 startup...${NC}"
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Create project directory
echo -e "${YELLOW}📁 Creating project directory...${NC}"
sudo mkdir -p /home/ubuntu/my-react-app
sudo chown -R ubuntu:ubuntu /home/ubuntu/my-react-app
cd /home/ubuntu/my-react-app

# Create logs directory
mkdir -p logs

# Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone https://github.com/abdurrahmanrussel/aa.git .
else
    echo -e "${GREEN}✅ Repository already exists${NC}"
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm ci --production
cd ..

# Install frontend dependencies and build
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
npm ci
echo -e "${YELLOW}🔨 Building frontend...${NC}
npm run build
cd ..

# Install n8n globally
echo -e "${YELLOW}📦 Installing n8n...${NC}"
npm install -g n8n

# Setup Nginx
echo -e "${YELLOW}🔧 Configuring Nginx...${NC}"
sudo cp /home/ubuntu/my-react-app/nginx.conf /etc/nginx/sites-available/yourdomain.com
sudo ln -sf /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d n8n.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Update Nginx config with actual domain
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/yourdomain.com
sudo nginx -t && sudo systemctl reload nginx

# Setup auto-renewal for SSL
echo -e "${YELLOW}🔄 Setting up SSL auto-renewal...${NC}"
sudo certbot renew --dry-run

# Start PM2 processes
echo -e "${YELLOW}🚀 Starting PM2 processes...${NC}"
pm2 start ecosystem.config.cjs --env production
pm2 save

# Configure firewall
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create health check endpoint in backend if not exists
echo -e "${YELLOW}🔧 Adding health check endpoint...${NC}"
if ! grep -q "app.get('/health'" backend/server.js; then
    echo '
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});
' >> backend/server.js
    pm2 reload backend
fi

# Final status
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${GREEN}📊 Status:${NC}"
pm2 status
echo ""
echo -e "${GREEN}🔗 URLs:${NC}"
echo "  Frontend: https://$DOMAIN"
echo "  Backend:  https://$DOMAIN/api"
echo "  n8n:      https://n8n.$DOMAIN"
echo ""
echo -e "${GREEN}📝 Next Steps:${NC}"
echo "  1. Configure environment variables in backend/.env and frontend/.env"
echo "  2. Set up GitHub Secrets for CI/CD"
echo "  3. Push code to trigger deployment"
echo "  4. Monitor logs: pm2 logs"
echo "  5. Monitor services: pm2 monit"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Make sure to update all .env files with real values"
echo "  - Update nginx.conf with your actual domain name"
echo "  - Set up database (MongoDB/PostgreSQL) if needed"
echo "  - Configure Stripe live keys in production"
echo "  - Set up proper n8n authentication"
echo ""