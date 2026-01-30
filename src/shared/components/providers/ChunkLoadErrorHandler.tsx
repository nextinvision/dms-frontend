"use client";

import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "dms_chunk_reload_ts";

/**
 * Listens for chunk load failures (e.g. after deploy, stale cached HTML
 * references old chunk hashes that 404). Triggers a full reload once so
 * the user gets fresh HTML and correct chunks.
 */
export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = e?.message ?? "";
      const filename = e?.filename ?? "";
      
      // Check for chunk load errors in various formats
      const isChunk =
        /Loading chunk \d+ failed/i.test(msg) ||
        /ChunkLoadError/i.test(msg) ||
        /Loading CSS chunk \d+ failed/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /Failed to load module script/i.test(msg) ||
        // Check if error is from _next/static/chunks
        (filename.includes('_next/static/chunks') && e.error) ||
        // Check for 404 errors on chunk files
        (filename.includes('_next/static') && msg.includes('404'));

      if (!isChunk) return;

      const last = parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0", 10);
      const now = Date.now();
      if (now - last < 15_000) return; // avoid reload loop
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      
      console.warn('ChunkLoadError detected, reloading page...', { msg, filename });
      window.location.reload();
    };

    // Also listen for unhandled promise rejections (common with dynamic imports)
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e?.reason;
      const msg = reason?.message ?? String(reason ?? "");
      
      const isChunk =
        /Loading chunk \d+ failed/i.test(msg) ||
        /ChunkLoadError/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg);

      if (!isChunk) return;

      const last = parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0", 10);
      const now = Date.now();
      if (now - last < 15_000) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      
      console.warn('ChunkLoadError in promise rejection, reloading page...', { msg });
      window.location.reload();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
