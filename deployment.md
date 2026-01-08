# Deployment Guide

## Issue Summary

The user was unable to log in to the application due to a `404 Not Found` error, which manifested as "Maximum retry attempts exceeded" on the frontend. This was caused by the backend server initially failing to start due to a port conflict, and later by the frontend not correctly utilizing its proxy configuration because it was being run in production mode (`npm run start`) instead of development mode (`npm run dev`). The `rewrites` configuration for proxying API requests is only active in the Next.js development server.

## Resolution Steps

1.  **Diagnosed Port Conflict (Backend):** The backend logs revealed an `EADDRINUSE` error, indicating that port 3001 was blocked. This was resolved by ensuring only one instance of the backend was running.
2.  **Identified Frontend Mode:** The `pm2 list` and `dms-frontend/package.json` revealed that the frontend was being started in production mode (`npm run start`), which bypasses development server `rewrites`.
3.  **Cleared Conflicting Processes:** All duplicate backend and frontend instances managed by `pm2` were stopped to ensure a clean environment.
4.  **Restarted Backend (Production Mode):** The `dms-backend` was built and started in production mode (`npm run build` then `npm run start:prod`) to ensure it's stable.
5.  **Restarted Frontend (Development Mode):** The `dms-frontend` was started using `npm run dev` to enable the proxy `rewrites` configured in `next.config.mjs`.

## Current Status

Both the frontend and backend applications are now running correctly:
*   The **backend server** is running in production mode on port `3001`.
*   The **frontend server** is running in development mode on port `3000`, with its proxy configuration correctly forwarding API requests to the backend.

The login functionality should now be fully restored.

### URLs
*   **Frontend:** [http://localhost:3000](http://localhost:3000)
*   **Backend:** [http://localhost:3001](http://localhost:3001)