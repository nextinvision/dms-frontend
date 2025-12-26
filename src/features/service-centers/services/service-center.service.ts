import { serviceCenterRepository } from "@/core/repositories/service-center.repository";
import type { ServiceCenter, CreateServiceCenterDTO, UpdateServiceCenterDTO } from "@/shared/types/service-center.types";
import type { ApiRequestConfig } from "@/core/api/types";

class ServiceCenterService {
    async getAll(config?: ApiRequestConfig): Promise<ServiceCenter[]> {
        return serviceCenterRepository.getAll(undefined, config);
    }

    async getById(id: string): Promise<ServiceCenter> {
        return serviceCenterRepository.getById(id);
    }

    async create(data: CreateServiceCenterDTO): Promise<ServiceCenter> {
        return serviceCenterRepository.create(data as unknown as Partial<ServiceCenter>);
    }

    async update(id: string, data: UpdateServiceCenterDTO): Promise<ServiceCenter> {
        return serviceCenterRepository.update(id, data as unknown as Partial<ServiceCenter>);
    }
}

export const serviceCenterService = new ServiceCenterService();
