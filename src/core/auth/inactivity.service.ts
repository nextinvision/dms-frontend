/**
 * Inactivity Monitor Service
 * Automatically logs out users after 15 minutes of inactivity
 */

import { authService } from './auth.service';

class InactivityService {
    private inactivityTimer: NodeJS.Timeout | null = null;
    private warningTimer: NodeJS.Timeout | null = null;
    private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
    private readonly WARNING_TIME = 14 * 60 * 1000; // Show warning at 14 minutes (1 min before logout)
    private isMonitoring = false;
    private warningCallback: (() => void) | null = null;

    /**
     * Start monitoring user activity
     */
    startMonitoring(onWarning?: () => void): void {
        if (this.isMonitoring) {
            console.log('[Inactivity] Already monitoring');
            return;
        }

        this.warningCallback = onWarning || null;
        this.isMonitoring = true;

        console.log('[Inactivity] Starting inactivity monitoring (15 min timeout)');

        // Set up activity listeners
        this.setupActivityListeners();

        // Start the initial timer
        this.resetTimer();
    }

    /**
     * Stop monitoring user activity
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        console.log('[Inactivity] Stopping inactivity monitoring');
        this.isMonitoring = false;

        // Clear timers
        this.clearTimers();

        // Remove activity listeners
        this.removeActivityListeners();

        this.warningCallback = null;
    }

    /**
     * Reset the inactivity timer
     */
    private resetTimer(): void {
        // Clear existing timers
        this.clearTimers();

        // Set warning timer (1 minute before logout)
        this.warningTimer = setTimeout(() => {
            console.log('[Inactivity] Warning: 1 minute until auto-logout');
            if (this.warningCallback) {
                this.warningCallback();
            }
        }, this.WARNING_TIME);

        // Set logout timer
        this.inactivityTimer = setTimeout(() => {
            this.handleInactiveLogout();
        }, this.INACTIVITY_TIMEOUT);

        // Update last activity timestamp in localStorage for cross-tab sync
        if (typeof window !== 'undefined') {
            localStorage.setItem('last_activity', Date.now().toString());
        }
    }

    /**
     * Clear all timers
     */
    private clearTimers(): void {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
    }

    /**
     * Handle activity events
     */
    private handleActivity = (): void => {
        if (this.isMonitoring) {
            this.resetTimer();
        }
    };

    /**
     * Set up event listeners for user activity
     */
    private setupActivityListeners(): void {
        if (typeof window === 'undefined') {
            return;
        }

        // Mouse events
        window.addEventListener('mousedown', this.handleActivity);
        window.addEventListener('mousemove', this.handleActivity);
        window.addEventListener('wheel', this.handleActivity);

        // Keyboard events
        window.addEventListener('keydown', this.handleActivity);
        window.addEventListener('keypress', this.handleActivity);

        // Touch events for mobile
        window.addEventListener('touchstart', this.handleActivity);
        window.addEventListener('touchmove', this.handleActivity);

        // Focus events
        window.addEventListener('focus', this.handleActivity);

        // Monitor localStorage changes from other tabs
        window.addEventListener('storage', this.handleStorageChange);
    }

    /**
     * Remove event listeners
     */
    private removeActivityListeners(): void {
        if (typeof window === 'undefined') {
            return;
        }

        window.removeEventListener('mousedown', this.handleActivity);
        window.removeEventListener('mousemove', this.handleActivity);
        window.removeEventListener('wheel', this.handleActivity);
        window.removeEventListener('keydown', this.handleActivity);
        window.removeEventListener('keypress', this.handleActivity);
        window.removeEventListener('touchstart', this.handleActivity);
        window.removeEventListener('touchmove', this.handleActivity);
        window.removeEventListener('focus', this.handleActivity);
        window.removeEventListener('storage', this.handleStorageChange);
    }

    /**
     * Handle storage changes from other tabs
     */
    private handleStorageChange = (e: StorageEvent): void => {
        // If another tab had activity, reset this tab's timer
        if (e.key === 'last_activity' && e.newValue) {
            const lastActivity = parseInt(e.newValue, 10);
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;

            // If activity was recent in another tab, reset timer
            if (timeSinceActivity < 1000) {
                this.resetTimer();
            }
        }
    };

    /**
     * Handle automatic logout due to inactivity
     */
    private handleInactiveLogout(): void {
        console.log('[Inactivity] User inactive for 15 minutes, logging out...');

        // Stop monitoring
        this.stopMonitoring();

        // Logout user
        authService.logout();

        // Redirect to login page
        if (typeof window !== 'undefined') {
            // Show notification
            alert('Your session has expired due to inactivity. Please login again.');
            
            // Get base path for correct redirect
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            window.location.href = `${basePath}/`;
        }
    }

    /**
     * Get remaining time until logout
     */
    getRemainingTime(): number {
        const lastActivity = localStorage.getItem('last_activity');
        if (!lastActivity) {
            return this.INACTIVITY_TIMEOUT;
        }

        const lastActivityTime = parseInt(lastActivity, 10);
        const elapsed = Date.now() - lastActivityTime;
        const remaining = this.INACTIVITY_TIMEOUT - elapsed;

        return Math.max(0, remaining);
    }

    /**
     * Format remaining time as string
     */
    formatRemainingTime(): string {
        const remaining = this.getRemainingTime();
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

export const inactivityService = new InactivityService();
