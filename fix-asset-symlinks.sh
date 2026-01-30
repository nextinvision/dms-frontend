#!/bin/bash
# Fix CSS and JS chunk symlinks after build
cd /home/fortytwoev/dms-frontend

# Verify build artifacts exist before fixing symlinks
if [ ! -d ".next/static" ] || [ ! -d ".next/static/css" ] || [ ! -d ".next/static/chunks" ]; then
    echo "ERROR: Build artifacts missing! Run 'npm run build' first."
    exit 1
fi

# Wait for server to be ready
sleep 5

# Fix CSS symlink
REQUESTED_CSS=$(curl -s http://localhost:3000/ 2>/dev/null | grep -o 'href="/_next/static/css/[^"]*\.css' | head -1 | sed 's|href="/_next/static/css/||' | sed 's|\.css||')

# Try to detect actual CSS file:
# 1) Any top-level hashed CSS in .next/static/css
# 2) Fallback to app/layout.css (App Router global stylesheet)
ACTUAL_CSS_BASENAME=""
ACTUAL_CSS_PATH=""

TOP_LEVEL_CSS=$(ls -1 .next/static/css/*.css 2>/dev/null | grep -v "^\.next/static/css/b22b" | head -1 || true)
if [ -n "$TOP_LEVEL_CSS" ]; then
  ACTUAL_CSS_PATH="$TOP_LEVEL_CSS"
  ACTUAL_CSS_BASENAME=$(basename "$TOP_LEVEL_CSS" .css)
elif [ -f ".next/static/css/app/layout.css" ]; then
  ACTUAL_CSS_PATH=".next/static/css/app/layout.css"
  ACTUAL_CSS_BASENAME="app/layout"
fi

if [ -n "$REQUESTED_CSS" ] && [ -n "$ACTUAL_CSS_PATH" ] && [ "$REQUESTED_CSS" != "$ACTUAL_CSS_BASENAME" ]; then
    # Use relative path for symlink (relative to .next/static/css/)
    if [ "$ACTUAL_CSS_BASENAME" = "app/layout" ]; then
        SYMLINK_TARGET="app/layout.css"
    else
        SYMLINK_TARGET=$(basename "$ACTUAL_CSS_PATH")
    fi
    echo "Creating CSS symlink: $REQUESTED_CSS.css -> $SYMLINK_TARGET"
    rm -f ".next/static/css/${REQUESTED_CSS}.css"
    ln -sf "$SYMLINK_TARGET" ".next/static/css/${REQUESTED_CSS}.css"
    echo "CSS symlink created successfully"
fi

# Fix JS chunk symlinks
# Check multiple pages to catch all chunk requests
HTML=$(curl -s http://localhost:3000/ 2>/dev/null)
JOB_CARDS_HTML=$(curl -s http://localhost:3000/sc/job-cards 2>/dev/null)
DASHBOARD_HTML=$(curl -s http://localhost:3000/sc/dashboard 2>/dev/null)
# Combine all HTML sources
HTML="${HTML} ${JOB_CARDS_HTML} ${DASHBOARD_HTML}"

# Fix layout.js
REQUESTED_LAYOUT=$(echo "$HTML" | grep -oE 'src="/_next/static/chunks/app/layout-[^"]+\.js' | sed 's|src="/_next/static/chunks/app/layout-||' | sed 's|\.js||' | head -1)
if [ -n "$REQUESTED_LAYOUT" ]; then
    ACTUAL_LAYOUT=$(ls -1 .next/static/chunks/app/layout-*.js 2>/dev/null | xargs -n1 basename | sed 's|layout-||' | sed 's|\.js||' | head -1)
    if [ -n "$ACTUAL_LAYOUT" ] && [ "$REQUESTED_LAYOUT" != "$ACTUAL_LAYOUT" ]; then
        echo "Creating layout symlink: layout-${REQUESTED_LAYOUT}.js -> layout-${ACTUAL_LAYOUT}.js"
        rm -f .next/static/chunks/app/layout-${REQUESTED_LAYOUT}.js
        ln -sf layout-${ACTUAL_LAYOUT}.js .next/static/chunks/app/layout-${REQUESTED_LAYOUT}.js
        echo "Layout symlink created successfully"
    fi
fi

# Fix page.js
REQUESTED_PAGE=$(echo "$HTML" | grep -oE 'src="/_next/static/chunks/app/page-[^"]+\.js' | sed 's|src="/_next/static/chunks/app/page-||' | sed 's|\.js||' | head -1)
if [ -n "$REQUESTED_PAGE" ]; then
    ACTUAL_PAGE=$(ls -1 .next/static/chunks/app/page-*.js 2>/dev/null | xargs -n1 basename | sed 's|page-||' | sed 's|\.js||' | head -1)
    if [ -n "$ACTUAL_PAGE" ] && [ "$REQUESTED_PAGE" != "$ACTUAL_PAGE" ]; then
        echo "Creating page symlink: page-${REQUESTED_PAGE}.js -> page-${ACTUAL_PAGE}.js"
        rm -f .next/static/chunks/app/page-${REQUESTED_PAGE}.js
        ln -sf page-${ACTUAL_PAGE}.js .next/static/chunks/app/page-${REQUESTED_PAGE}.js
        echo "Page symlink created successfully"
    fi
fi

# Fix error.js (app error boundary chunk)
REQUESTED_ERROR=$(echo "$HTML" | grep -oE 'src="/_next/static/chunks/app/error-[^"]+\.js' | sed 's|src="/_next/static/chunks/app/error-||' | sed 's|\.js||' | head -1)
if [ -n "$REQUESTED_ERROR" ]; then
    ACTUAL_ERROR=$(ls -1 .next/static/chunks/app/error-*.js 2>/dev/null | xargs -n1 basename | sed 's|error-||' | sed 's|\.js||' | head -1)
    if [ -n "$ACTUAL_ERROR" ] && [ "$REQUESTED_ERROR" != "$ACTUAL_ERROR" ]; then
        echo "Creating error symlink: error-${REQUESTED_ERROR}.js -> error-${ACTUAL_ERROR}.js"
        rm -f .next/static/chunks/app/error-${REQUESTED_ERROR}.js
        ln -sf error-${ACTUAL_ERROR}.js .next/static/chunks/app/error-${REQUESTED_ERROR}.js
        echo "Error chunk symlink created successfully"
    fi
fi

# Fix webpack.js
REQUESTED_WEBPACK=$(echo "$HTML" | grep -oE 'src="/_next/static/chunks/webpack-[^"]+\.js' | sed 's|src="/_next/static/chunks/webpack-||' | sed 's|\.js||' | head -1)
if [ -n "$REQUESTED_WEBPACK" ]; then
    ACTUAL_WEBPACK=$(ls -1 .next/static/chunks/webpack-*.js 2>/dev/null | xargs -n1 basename | sed 's|webpack-||' | sed 's|\.js||' | head -1)
    if [ -n "$ACTUAL_WEBPACK" ] && [ "$REQUESTED_WEBPACK" != "$ACTUAL_WEBPACK" ]; then
        echo "Creating webpack symlink: webpack-${REQUESTED_WEBPACK}.js -> webpack-${ACTUAL_WEBPACK}.js"
        rm -f .next/static/chunks/webpack-${REQUESTED_WEBPACK}.js
        ln -sf webpack-${ACTUAL_WEBPACK}.js .next/static/chunks/webpack-${REQUESTED_WEBPACK}.js
        echo "Webpack symlink created successfully"
    fi
fi

# Fix dashboard page chunk
REQUESTED_DASHBOARD_PAGE=$(echo "$HTML" | grep -oE 'src="/_next/static/chunks/app/\(service-center\)/sc/dashboard/page-[^"]+\.js' | sed 's|.*page-||' | sed 's|\.js||' | head -1)
if [ -n "$REQUESTED_DASHBOARD_PAGE" ]; then
    ACTUAL_DASHBOARD_PAGE=$(ls -1 .next/static/chunks/app/\(service-center\)/sc/dashboard/page-*.js 2>/dev/null | xargs -n1 basename | sed 's|page-||' | sed 's|\.js||' | head -1)
    if [ -n "$ACTUAL_DASHBOARD_PAGE" ] && [ "$REQUESTED_DASHBOARD_PAGE" != "$ACTUAL_DASHBOARD_PAGE" ]; then
        echo "Creating dashboard page symlink: page-${REQUESTED_DASHBOARD_PAGE}.js -> page-${ACTUAL_DASHBOARD_PAGE}.js"
        rm -f .next/static/chunks/app/\(service-center\)/sc/dashboard/page-${REQUESTED_DASHBOARD_PAGE}.js
        ln -sf page-${ACTUAL_DASHBOARD_PAGE}.js .next/static/chunks/app/\(service-center\)/sc/dashboard/page-${REQUESTED_DASHBOARD_PAGE}.js
        echo "Dashboard page symlink created successfully"
    fi
fi

# Fix numbered chunks (like 6283, 1473, 4686)
# Strategy:
# 1) If a real chunk with the same numeric prefix exists, symlink the requested name to it.
# 2) If NO such real chunk exists (removed in a newer build), create a tiny stub chunk that
#    registers an empty module for that numeric id. This prevents ChunkLoadError loops without
#    touching core runtime chunks like webpack/main.
REQUESTED_CHUNKS=$(echo "$HTML" | grep -oE 'src="/_next/static/chunks/[0-9]+[^"]*\.js' | sed 's|src="/_next/static/chunks/||' | sed 's|\.js||' | sort -u)
for CHUNK in $REQUESTED_CHUNKS; do
    CHUNK_NUM=$(echo "$CHUNK" | cut -d'.' -f1 | cut -d'-' -f1)
    # Try to find actual chunk with matching number
    ACTUAL_CHUNK=$(ls -1 .next/static/chunks/${CHUNK_NUM}*.js 2>/dev/null | xargs -n1 basename 2>/dev/null | head -1)
    if [ -n "$ACTUAL_CHUNK" ] && [ "${CHUNK}.js" != "$ACTUAL_CHUNK" ]; then
        echo "Creating chunk symlink: ${CHUNK}.js -> ${ACTUAL_CHUNK}"
        rm -f .next/static/chunks/${CHUNK}.js
        ln -sf ${ACTUAL_CHUNK} .next/static/chunks/${CHUNK}.js
        echo "Chunk ${CHUNK} symlink created successfully"
    elif [ -z "$ACTUAL_CHUNK" ]; then
        # No real chunk with this numeric prefix exists in the current build.
        # Create a minimal, safe stub that registers an empty module for this chunk id.
        TARGET_PATH=".next/static/chunks/${CHUNK}.js"
        if [ ! -f "$TARGET_PATH" ] && [ ! -L "$TARGET_PATH" ]; then
            echo "Creating safe stub chunk for removed chunk: ${CHUNK}.js (id: ${CHUNK_NUM})"
            cat > "$TARGET_PATH" << CHUNKEOF
(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[${CHUNK_NUM}],{${CHUNK_NUM}:(module,exports,__webpack_require__)=>{}}]);
CHUNKEOF
            echo "Stub chunk ${CHUNK}.js created successfully"
        fi
    fi
done

echo "All symlinks fixed"
