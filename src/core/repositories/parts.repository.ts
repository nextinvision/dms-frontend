import { BaseRepository } from './base.repository';
import type { Part } from '@/shared/types/inventory.types';

class PartsRepository extends BaseRepository<Part> {
    protected endpoint = '/inventory/parts';

    async getLowStock(): Promise<Part[]> {
        const response = await this.getAll({ filter: 'low_stock' });
        return response;
    }
}

export const partsRepository = new PartsRepository();
