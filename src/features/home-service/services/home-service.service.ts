import { apiClient } from '@/core/api/client';

export interface HomeServiceResponse {
  id: string;
  serviceNumber: string;
  serviceCenterId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  vehicleId?: string;
  vehicleModel: string;
  registration: string;
  serviceAddress: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedCost: number;
  assignedEngineerId?: string;
  assignedEngineer?: {
    id: string;
    name: string;
  };
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeServiceStats {
  scheduled: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface CreateHomeServiceDto {
  serviceCenterId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  vehicleId?: string;
  vehicleModel: string;
  registration: string;
  serviceAddress: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedCost: number;
  assignedEngineerId?: string;
}

class HomeServiceService {
  async getAll(params?: { 
    serviceCenterId?: string;
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: HomeServiceResponse[]; pagination: any }> {
    try {
      const response = await apiClient.get<any>('/home-services', { params });
      
      // API client extracts: data: responseData.data || responseData
      // Backend returns: { data: [...], pagination: {...} }
      // So response.data might be:
      // 1. Array (extracted) - when backend returns { data: [...], pagination: {...} }
      // 2. Object with 'data' property - when double-wrapped
      // 3. Full backend response object - if extraction didn't happen
      
      let servicesData: HomeServiceResponse[] = [];
      let pagination: any = {};
      
      // Check for nested data structure (like quotations service)
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        servicesData = Array.isArray(response.data.data) ? response.data.data : [];
        pagination = response.data.pagination || {};
      }
      // Check if response.data is directly an array (extracted)
      else if (Array.isArray(response.data)) {
        servicesData = response.data;
        // Pagination was lost, provide defaults
        pagination = {
          total: servicesData.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalPages: Math.ceil(servicesData.length / (params?.limit || 20))
        };
      }
      // Fallback
      else {
        servicesData = [];
        pagination = {};
      }
      
      return { data: servicesData, pagination };
    } catch (error) {
      console.error('Error fetching home services:', error);
      return { data: [], pagination: {} };
    }
  }

  async getById(id: string): Promise<HomeServiceResponse> {
    const response = await apiClient.get<HomeServiceResponse>(`/home-services/${id}`);
    return response.data;
  }

  async create(data: CreateHomeServiceDto): Promise<HomeServiceResponse> {
    const response = await apiClient.post<HomeServiceResponse>('/home-services', data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateHomeServiceDto & { status?: string; startTime?: string; completedAt?: string }>): Promise<HomeServiceResponse> {
    const response = await apiClient.patch<HomeServiceResponse>(`/home-services/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/home-services/${id}`);
  }

  async getStats(serviceCenterId?: string): Promise<HomeServiceStats> {
    const response = await apiClient.get<HomeServiceStats>('/home-services/stats', {
      params: serviceCenterId ? { serviceCenterId } : undefined
    });
    return response.data;
  }
}

export const homeServiceService = new HomeServiceService();

