# Deployment Guide

## Permanent CSS/Asset Loading Fix

This project includes safeguards to prevent CSS and JS chunk loading issues:

### Key Scripts

1. **`pre-start.sh`**: Verifies build artifacts exist and rebuilds if missing
2. **`start-production.sh`**: Main entry point for PM2 - ensures build exists before starting
3. **`fix-asset-symlinks.sh`**: Fixes CSS/JS chunk hash mismatches after server starts

### How It Works

1. **Pre-start verification**: Before starting the server, `pre-start.sh` checks if `.next/static` exists
2. **Auto-rebuild**: If build artifacts are missing, it automatically rebuilds
3. **Asset fixing**: After server starts, symlinks are created for any hash mismatches

### Deployment Process

#### Recommended: Using restart script (Handles everything)
```bash
npm run restart:pm2
# or
bash restart-frontend.sh
```

This will:
- Restart PM2 (triggers pre-start.sh automatically)
- Wait for server to start
- Fix asset symlinks automatically

#### Standard Deployment
```bash
npm run build
pm2 restart dms-frontend
bash fix-asset-symlinks.sh
```

#### PM2 Auto-Start (On server reboot)
PM2 is configured to use `start-production.sh` which:
- Checks for build artifacts before starting
- Rebuilds automatically if `.next/static` is missing
- Prevents CSS/JS loading issues

When PM2 restarts (auto-restart or manual), `pre-start.sh` runs automatically.

### Manual Commands

- **Build only**: `npm run build`
- **Deploy (build + fix)**: `npm run deploy`
- **Start production**: `npm run start:production`
- **Fix assets only**: `bash fix-asset-symlinks.sh`

### Troubleshooting

If CSS still doesn't load:
1. Check build exists: `ls -la .next/static/css/`
2. Rebuild: `npm run build`
3. Restart PM2: `pm2 restart dms-frontend`
4. Run fix script: `bash fix-asset-symlinks.sh`
5. Hard refresh browser (Ctrl+Shift+R)

### PM2 Configuration

The `ecosystem.config.js` uses `start-production.sh` which ensures:
- Build artifacts exist before starting
- Server starts correctly
- Asset symlinks are created automatically
