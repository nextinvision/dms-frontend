export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string; // e.g., CREATE, UPDATE, DELETE, LOGIN
    entityType: string; // e.g., User, JobCard, Inventory
    entityId: string;
    status: "success" | "failure" | "warning";
    ipAddress?: string;
    userAgent?: string;
    timestamp: string; // ISO Date string
    details?: string;
    metadata?: Record<string, any>; // For extra flexible data
}

export interface AuditLogFilters {
    search?: string;
    status?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
}
