import { getApiUrl } from '@/config/api.config';
import { apiClient } from '@/core/api/client';

export interface SystemSetting {
    key: string;
    value: string;
    category?: string;
    description?: string;
}

class SystemSettingsService {
    async getAll(): Promise<SystemSetting[]> {
        const response = await apiClient.get<SystemSetting[]>('/system-settings');
        return response.data;
    }

    async save(settings: SystemSetting[]): Promise<SystemSetting[]> {
        const response = await apiClient.post<SystemSetting[]>('/system-settings', settings);
        return response.data;
    }
}

export const systemSettingsService = new SystemSettingsService();
