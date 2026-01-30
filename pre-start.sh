#!/bin/bash
# Pre-start script: Ensure build artifacts exist before starting Next.js server
# This prevents CSS/JS loading issues when .next/static is missing

set -e

cd /home/fortytwoev/dms-frontend

echo "Checking for build artifacts..."

# Check if critical build directories exist
if [ ! -d ".next/static" ] || [ ! -d ".next/static/css" ] || [ ! -d ".next/static/chunks" ]; then
    echo "Build artifacts missing! Rebuilding..."
    npm run build
    echo "Build completed successfully"
else
    # Verify CSS files exist
    CSS_COUNT=$(find .next/static/css -name "*.css" -type f 2>/dev/null | wc -l)
    if [ "$CSS_COUNT" -eq 0 ]; then
        echo "No CSS files found! Rebuilding..."
        npm run build
        echo "Build completed successfully"
    else
        echo "Build artifacts verified ($CSS_COUNT CSS files found)"
    fi
fi

# Verify critical files exist
if [ ! -f ".next/BUILD_ID" ]; then
    echo "BUILD_ID missing! Rebuilding..."
    npm run build
    echo "Build completed successfully"
fi

echo "Pre-start checks completed"
