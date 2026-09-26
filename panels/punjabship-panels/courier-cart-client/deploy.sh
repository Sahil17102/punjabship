#!/bin/bash

# Build and deploy script for courier-cart-client
# Usage: ./deploy.sh [vps_user@vps_ip]
# Example: ./deploy.sh user@your-vps-ip
# Note: You will be prompted for your VPS password during upload
# Or set environment variables: VPS_USER=user VPS_IP=ip ./deploy.sh

# Don't exit on error for SSH/rsync operations (they may prompt for password)
set +e

# VPS configuration
VPS_TARGET_PATH="/var/www/punjabship/courier-cart-client/dist"

# Get VPS connection details from argument or environment variables
if [ -n "$1" ]; then
  VPS_CONNECTION="$1"
elif [ -n "$VPS_USER" ] && [ -n "$VPS_IP" ]; then
  VPS_CONNECTION="${VPS_USER}@${VPS_IP}"
else
  echo "❌ Error: Please provide VPS connection details"
  echo ""
  echo "Usage:"
  echo "  $0 user@vps_ip"
  echo "  or"
  echo "  VPS_USER=user VPS_IP=ip $0"
  echo ""
  exit 1
fi

echo "🚀 Building courier-cart-client..."

# Navigate to project directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run the build (this should exit on error)
set -e
echo "🔨 Running build with production environment variables..."

# Set production environment variables
# Vite uses VITE_ prefix for environment variables
export VITE_API_URL="http://127.0.0.1:5004/api"
export VITE_APP_SOCKET_URL="http://127.0.0.1:5004"

# Keep other environment variables from .env if needed (Shopify, Google OAuth, etc.)
# These can be overridden here if you have different production values
# For now, we'll let them use values from .env if they exist, or set defaults
export VITE_GOOGLE_OAUTH_CLIENT_ID="${VITE_GOOGLE_OAUTH_CLIENT_ID:-826545993291-8cv3997ckrkj9ns33bfb1jpm917dfkl4.apps.googleusercontent.com}"

echo "📡 Using production API URL: ${VITE_API_URL}"
echo "📡 Using production Socket URL: ${VITE_APP_SOCKET_URL}"
echo ""

yarn build
set +e

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "❌ Build failed! 'dist' folder not found."
  exit 1
fi

echo "✅ Build successful! Output size:"
du -sh dist

# Upload to VPS
echo ""
echo "📤 Uploading to VPS: ${VPS_CONNECTION}:${VPS_TARGET_PATH}"
echo "🔐 You will be prompted for your VPS password"
echo ""

# Create dist directory on VPS if it doesn't exist
echo "📁 Creating dist directory on VPS if it doesn't exist..."
ssh "${VPS_CONNECTION}" "mkdir -p ${VPS_TARGET_PATH}"
SSH_EXIT_CODE=$?

if [ $SSH_EXIT_CODE -ne 0 ]; then
  echo "❌ Failed to connect to VPS. Please check your credentials."
  exit 1
fi

echo "✅ Dist directory ready: ${VPS_TARGET_PATH}"

# Use rsync to upload dist folder contents
# NO --delete flag = nothing will be deleted on VPS, all existing files are kept
# Only files from local dist/ folder will be uploaded/updated
echo "📤 Uploading dist files..."
echo "   (This will add/update dist files and keep ALL existing files on VPS)"
rsync -avz --progress dist/ "${VPS_CONNECTION}:${VPS_TARGET_PATH}/"
RSYNC_EXIT_CODE=$?

if [ $RSYNC_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Deployment complete!"
  echo "📁 Dist files uploaded to: ${VPS_TARGET_PATH}"
  echo "📂 Structure: courier-cart-client/dist/ (contains index.html, assets/, etc.)"
  echo "💡 All existing files in courier-cart-client/ are kept untouched"
else
  echo ""
  echo "❌ Upload failed. Please check your connection and try again."
  exit 1
fi
echo ""
