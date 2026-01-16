import { apiClient } from '@/core/api/client';
import type { ApiResponse, ApiRequestConfig } from '@/core/api/types';

export interface IBaseRepository<T> {
    getAll(params?: Record<string, unknown>, config?: ApiRequestConfig): Promise<T[]>;
    getById(id: string): Promise<T>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
    protected abstract endpoint: string;

    async getAll(params?: Record<string, unknown>, config?: ApiRequestConfig): Promise<T[]> {
        const response = await apiClient.get<T[] | { data: T[]; pagination?: any }>(this.endpoint, { params, ...config });
        // Handle both direct array response and paginated response {data: [], pagination: {}}
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            return response.data.data;
        }
        return [];
    }

    async getById(id: string): Promise<T> {
        const response = await apiClient.get<T>(`${this.endpoint}/${id}`);
        return response.data;
    }

    async create(data: Partial<T>): Promise<T> {
        const response = await apiClient.post<T>(this.endpoint, data);
        return response.data;
    }

    async update(id: string, data: Partial<T>): Promise<T> {
        const response = await apiClient.patch<T>(`${this.endpoint}/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.endpoint}/${id}`);
    }
}
