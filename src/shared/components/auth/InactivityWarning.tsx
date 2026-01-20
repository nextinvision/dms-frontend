"use client";
import { useState, useEffect } from 'react';
import { inactivityService } from '@/core/auth/inactivity.service';

interface InactivityWarningProps {
    show: boolean;
    onDismiss: () => void;
}

export function InactivityWarning({ show, onDismiss }: InactivityWarningProps) {
    const [remainingTime, setRemainingTime] = useState('1:00');

    useEffect(() => {
        if (!show) {
            return;
        }

        // Update countdown every second
        const interval = setInterval(() => {
            setRemainingTime(inactivityService.formatRemainingTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [show]);

    if (!show) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg max-w-md">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-bold text-yellow-800">
                            Session Timeout Warning
                        </h3>
                        <p className="mt-1 text-sm text-yellow-700">
                            You will be logged out in <span className="font-mono font-bold">{remainingTime}</span> due to inactivity.
                        </p>
                        <p className="mt-1 text-xs text-yellow-600">
                            Move your mouse or press any key to stay logged in.
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={onDismiss}
                            className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
