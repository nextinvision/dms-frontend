#!/bin/bash
# Complete restart script: Restarts PM2 and fixes assets
# Usage: bash restart-frontend.sh

set -e

cd /home/fortytwoev/dms-frontend

echo "=== Restarting Frontend ==="

# Restart PM2 (this will trigger pre-start.sh automatically)
pm2 restart dms-frontend

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 10

# Run asset fix script
echo "Fixing asset symlinks..."
bash fix-asset-symlinks.sh

echo "=== Restart Complete ==="
pm2 status
