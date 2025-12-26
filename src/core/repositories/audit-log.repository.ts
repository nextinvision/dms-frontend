import { BaseRepository } from './base.repository';
import type { AuditLog, AuditLogFilters } from '@/shared/types/audit-log.types';

// Temporary mock data until backend endpoint /api/audit-logs is implemented
const MOCK_LOGS: AuditLog[] = [
    {
        id: "1",
        userId: "user1",
        userName: "Rajesh Kumar Singh",
        action: "CREATE",
        entityType: "User",
        entityId: "user123",
        status: "success",
        ipAddress: "192.168.1.100",
        userAgent: "Chrome/120.0",
        timestamp: "2024-11-15T10:30:25",
        details: "Created new user: Delhi Manager",
    },
    {
        id: "2",
        userId: "user2",
        userName: "Delhi Manager",
        action: "UPDATE",
        entityType: "JobCard",
        entityId: "jc456",
        status: "success",
        ipAddress: "192.168.1.101",
        userAgent: "Firefox/121.0",
        timestamp: "2024-11-15T11:15:42",
        details: "Updated job card status to In Progress",
    },
    {
        id: "3",
        userId: "user1",
        userName: "Rajesh Kumar Singh",
        action: "DELETE",
        entityType: "Inventory",
        entityId: "inv789",
        status: "warning",
        ipAddress: "192.168.1.100",
        userAgent: "Chrome/120.0",
        timestamp: "2024-11-15T09:20:10",
        details: "Deleted inventory item: Engine Oil",
    },
    {
        id: "4",
        userId: "user3",
        userName: "Finance Manager",
        action: "LOGIN",
        entityType: "Auth",
        entityId: "auth001",
        status: "failure",
        ipAddress: "192.168.1.102",
        userAgent: "Safari/17.0",
        timestamp: "2024-11-15T08:45:33",
        details: "Failed login attempt - Invalid password",
    },
    {
        id: "5",
        userId: "user1",
        userName: "Rajesh Kumar Singh",
        action: "UPDATE",
        entityType: "User",
        entityId: "user123",
        status: "success",
        ipAddress: "192.168.1.100",
        userAgent: "Chrome/120.0",
        timestamp: new Date().toISOString(), // Shows current time for realism
        details: "Updated role permissions",
    }
];

class AuditLogRepository extends BaseRepository<AuditLog> {
    protected endpoint = '/audit-logs';

    // Override to return mock data
    async getAll(params?: Record<string, unknown>, config?: any): Promise<AuditLog[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_LOGS;
    }

    // Specific method to get logs with typed filters
    async getLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
        return this.getAll(filters as Record<string, unknown>);
    }
}

export const auditLogRepository = new AuditLogRepository();
