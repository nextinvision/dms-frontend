import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/core/api/client';

// Mock fetch
global.fetch = vi.fn();

it('canary test', () => {
    expect(true).toBe(true);
});

describe('ApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore - access private cache to clear it
        apiClient.cache.clear();
    });

    it('should make a GET request and return data', async () => {
        const mockData = { id: 1, name: 'Test' };
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({ data: mockData, success: true }),
            text: async () => JSON.stringify({ data: mockData, success: true }),
        };
        (fetch as any).mockResolvedValue(mockResponse);

        const response = await apiClient.get('/test');

        expect(response.data).toEqual(mockData);
        expect(fetch).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should cache GET requests', async () => {
        const mockData = { id: 1, name: 'Test' };
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({ data: mockData, success: true }),
            text: async () => JSON.stringify({ data: mockData, success: true }),
        };
        (fetch as any).mockResolvedValue(mockResponse);

        // First call
        await apiClient.get('/test');
        // Second call
        await apiClient.get('/test');

        expect(fetch).toHaveBeenCalledTimes(1); // Should hit cache second time
    }, 10000);

    it('should retry on failure', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: async () => ({ data: 'success', success: true }),
            text: async () => JSON.stringify({ data: 'success', success: true }),
        };
        (fetch as any)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce(mockResponse);

        const response = await apiClient.get('/retry-test', { retries: 1 });

        expect(response.data).toBe('success');
        expect(fetch).toHaveBeenCalledTimes(2);
    }, 10000);
});
