import { BaseRepository } from './base.repository';
import type { Lead } from '@/shared/types/lead.types';

class LeadRepository extends BaseRepository<Lead> {
    protected endpoint = '/leads';
}

export const leadRepository = new LeadRepository();
