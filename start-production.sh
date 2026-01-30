#!/bin/bash
# Production start script: Ensures build exists before starting server
# This is the main entry point for PM2

set -e

cd /home/fortytwoev/dms-frontend

echo "=== Production Start Script ==="

# Step 1: Run pre-start checks (rebuilds if needed)
bash pre-start.sh

# Step 2: Start Next.js server (PM2 will manage this process)
echo "Starting Next.js server..."
exec npm start
