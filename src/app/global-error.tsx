
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Critical System Error
                    </h1>
                    <p className="text-red-600 font-mono text-xs text-left overflow-auto max-h-40 mb-4 p-2 bg-gray-100 border max-w-lg mx-auto">
                        {error.name}: {error.message}
                        {error.digest && <br />}{error.digest && `Digest: ${error.digest}`}
                    </p>
                    <Button onClick={() => reset()}>Try Again</Button>
                </div>
            </body>
        </html>
    );
}
