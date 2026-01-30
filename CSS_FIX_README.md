# Asset Loading Fix (CSS & JavaScript Chunks)

## Issue
After rebuilding, the HTML may reference CSS files and JavaScript chunks with different hashes than what was actually generated. This causes 400/404 errors and the page may load without styles or fail to load JavaScript.

## Solution
A script `fix-asset-symlinks.sh` has been created to automatically create symlinks from the requested filenames to the actual files for:
- CSS files
- JavaScript layout chunks (`app/layout-*.js`)
- JavaScript page chunks (`app/page-*.js`)

## Usage
After rebuilding and restarting PM2, run:
```bash
./fix-asset-symlinks.sh
```

Or it will run automatically after PM2 starts (wait ~12 seconds for server to be ready).

## Manual Fix
If needed, manually create the symlinks:

### CSS
```bash
cd /home/fortytwoev/dms-frontend
REQUESTED_CSS=$(curl -s http://localhost:3000/ | grep -o 'href="/_next/static/css/[^"]*\.css' | sed 's|href="/_next/static/css/||' | sed 's|\.css||')
ACTUAL_CSS=$(ls .next/static/css/*.css | xargs -n1 basename | sed 's|\.css||' | head -1)
ln -sf ${ACTUAL_CSS}.css .next/static/css/${REQUESTED_CSS}.css
```

### JavaScript Chunks
```bash
cd /home/fortytwoev/dms-frontend
# For layout
REQUESTED_LAYOUT=$(curl -s http://localhost:3000/ | grep -oE 'src="/_next/static/chunks/app/layout-[^"]+\.js' | sed 's|.*layout-||' | sed 's|\.js||')
ACTUAL_LAYOUT=$(ls .next/static/chunks/app/layout-*.js | xargs -n1 basename | sed 's|layout-||' | sed 's|\.js||')
ln -sf layout-${ACTUAL_LAYOUT}.js .next/static/chunks/app/layout-${REQUESTED_LAYOUT}.js

# For page
REQUESTED_PAGE=$(curl -s http://localhost:3000/ | grep -oE 'src="/_next/static/chunks/app/page-[^"]+\.js' | sed 's|.*page-||' | sed 's|\.js||')
ACTUAL_PAGE=$(ls .next/static/chunks/app/page-*.js | xargs -n1 basename | sed 's|page-||' | sed 's|\.js||')
ln -sf page-${ACTUAL_PAGE}.js .next/static/chunks/app/page-${REQUESTED_PAGE}.js
```
