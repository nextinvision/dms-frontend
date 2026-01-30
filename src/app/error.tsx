'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Always log errors for debugging, but do NOT auto‑reload.
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  // Detect chunk loading / runtime bundle issues
  const isChunkLoadError =
    error.name === 'ChunkLoadError' ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Importing a module script failed') ||
    /Loading chunk \d+ failed/i.test(error.message || '') ||
    /Loading CSS chunk \d+ failed/i.test(error.message || '') ||
    /Cannot read properties of undefined \(reading 'call'\)/i.test(error.message || '');

  // DEBUGGING: Force show error details to diagnose "inventory@sc001.com" crash
  // if (isChunkLoadError) {
  //   // Show a clear message and let the user decide when to reload.
  //   return (
  //     <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
  //       <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
  //         <h1 className="text-2xl font-bold text-gray-900 mb-4">
  //           Updating application failed
  //         </h1>
  //         <p className="text-gray-600 mb-4">
  //           A new version was deployed but your browser is still using old files.
  //         </p>
  //         <p className="text-red-600 font-mono text-xs text-left overflow-auto max-h-40 mb-4 p-2 bg-gray-100 border">
  //           DEBUG INFO: {error.name}: {error.message}
  //         </p>
  //         <div className="flex gap-4 justify-center">
  //           <Button
  //             onClick={() => window.location.reload()}
  //             className="bg-indigo-600 hover:bg-indigo-700 text-white"
  //           >
  //             Hard reload now
  //           </Button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong!
          </h1>
          <p className="text-gray-600 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={reset}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              Go to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

