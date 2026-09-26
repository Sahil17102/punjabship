#!/bin/bash

# Build and deploy script for admin-dashboard
# Usage: ./deploy.sh [vps_user@vps_ip]
# Example: ./deploy.sh user@your-vps-ip
# Note: You will be prompted for your VPS password during upload
# Or set environment variables: VPS_USER=user VPS_IP=ip ./deploy.sh

# Don't exit on error for SSH/rsync operations (they may prompt for password)
set +e

# VPS configuration
VPS_TARGET_PATH="/var/www/punjabship/admin-dashboard/build"

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

echo "🚀 Building admin-dashboard..."

# Navigate to project directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Run the build (this should exit on error)
set -e
echo "🔨 Running build with production environment variables..."

# Set production API URL
# React apps need REACT_APP_ prefix for environment variables
export REACT_APP_API_BASE_URL="http://127.0.0.1:5004/api"
export REACT_APP_SOCKET_URL="http://127.0.0.1:5004"

echo "📡 Using production API URL: ${REACT_APP_API_BASE_URL}"
echo ""

npm run build
set +e

# Check if build was successful
if [ ! -d "build" ]; then
  echo "❌ Build failed! 'build' folder not found."
  exit 1
fi

echo "✅ Build successful! Output size:"
du -sh build

# Upload to VPS
echo ""
echo "📤 Uploading to VPS: ${VPS_CONNECTION}:${VPS_TARGET_PATH}"
echo "🔐 You will be prompted for your VPS password"
echo ""

# Create build directory on VPS if it doesn't exist
echo "📁 Creating build directory on VPS if it doesn't exist..."
ssh "${VPS_CONNECTION}" "mkdir -p ${VPS_TARGET_PATH}"
SSH_EXIT_CODE=$?

if [ $SSH_EXIT_CODE -ne 0 ]; then
  echo "❌ Failed to connect to VPS. Please check your credentials."
  exit 1
fi

echo "✅ Build directory ready: ${VPS_TARGET_PATH}"

# Use rsync to upload build folder contents
# NO --delete flag = nothing will be deleted on VPS, all existing files are kept
# Only files from local build/ folder will be uploaded/updated
echo "📤 Uploading build files..."
echo "   (This will add/update build files and keep ALL existing files on VPS)"
rsync -avz --progress build/ "${VPS_CONNECTION}:${VPS_TARGET_PATH}/"
RSYNC_EXIT_CODE=$?

if [ $RSYNC_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Deployment complete!"
  echo "📁 Build files uploaded to: ${VPS_TARGET_PATH}"
  echo "📂 Structure: admin-dashboard/build/ (contains index.html, static/, asset-manifest.json, etc.)"
  echo "💡 All existing files in admin-dashboard/ are kept untouched"
else
  echo ""
  echo "❌ Upload failed. Please check your connection and try again."
  exit 1
fi
echo ""
