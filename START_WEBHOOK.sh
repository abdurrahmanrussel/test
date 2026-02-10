#!/bin/bash

# This script sets up Stripe webhook forwarding for local development

echo "=== STRIPE WEBHOOK SETUP FOR LOCAL DEVELOPMENT ==="
echo ""
echo "You need TWO terminal windows:"
echo ""
echo "Terminal 1: Backend Server"
echo "  cd backend"
echo "  npm start"
echo ""
echo "Terminal 2: Stripe Webhook Forwarding (run this command):"
echo "  stripe listen --api-key sk_test_51SuUd9EA8gXAaHAIbBAxmL71PpOzvP9jXKHwb17Yg7Gmh8rv72dHiw6cAPwxRYF0piwcANQITzkWUG3BDOACaW8u00Y2nuOAVu --forward-to http://localhost:4242/api/stripe-webhook"
echo ""
echo "Once both are running, you can test Stripe payments!"
echo "=============================================="