import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface GlobalErrorFallbackProps {
    error: Error | null;
    resetErrorBoundary: () => void;
}

export const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                <p className="text-gray-600 mb-6">
                    We encountered an unexpected error. Please try refreshing the page.
                </p>

                {/* ApiError Handling could go here if we cast error */}
                {error && (error as any).code && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">
                        Error Code: {(error as any).code}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={resetErrorBoundary}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        <Home size={18} />
                        Back to Home
                    </button>
                </div>

                {process.env.NODE_ENV === "development" && error && (
                    <details className="text-left mt-8 p-4 bg-gray-50 rounded-lg">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                            Error Details (Development Only)
                        </summary>
                        <pre className="text-xs text-red-600 overflow-auto max-h-48 whitespace-pre-wrap">
                            {error.toString()}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};
