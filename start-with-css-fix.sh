#!/bin/bash
# Start Next.js server and fix CSS symlink after startup
cd /home/fortytwoev/dms-frontend

# Start the server in background
npm start &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 10

# Fix CSS symlink
./fix-css-symlink.sh

# Wait for the server process
wait $SERVER_PID
