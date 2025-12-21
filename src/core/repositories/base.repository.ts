import { apiClient } from '@/core/api/client';
import type { ApiResponse } from '@/core/api/types';

export interface IBaseRepository<T> {
    getAll(params?: Record<string, unknown>): Promise<T[]>;
    getById(id: string): Promise<T>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
    protected abstract endpoint: string;

    async getAll(params?: Record<string, unknown>): Promise<T[]> {
        const response = await apiClient.get<T[]>(this.endpoint, { params });
        return response.data;
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
        const response = await apiClient.put<T>(`${this.endpoint}/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.endpoint}/${id}`);
    }
}
