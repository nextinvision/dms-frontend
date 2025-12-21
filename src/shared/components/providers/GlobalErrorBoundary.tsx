'use client';

import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReactNode } from 'react';

interface GlobalErrorBoundaryProps {
    children: ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
    const { reset } = useQueryErrorResetBoundary();

    return (
        <ErrorBoundary onReset={reset}>
            {children}
        </ErrorBoundary>
    );
}
