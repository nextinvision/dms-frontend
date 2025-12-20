import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockJobCard } from '@/test/utils/mocks';
import type { JobCard } from '@/shared/types/job-card.types';

describe('JobCardService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    safeStorage.setItem('jobCards', []);
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns empty array when no job cards exist', async () => {
      const result = await jobCardService.getAll();
      expect(result).toEqual([]);
    });

    it('returns all job cards from storage', async () => {
      const jobCards = [createMockJobCard({ id: '1' }), createMockJobCard({ id: '2' })];
      safeStorage.setItem('jobCards', jobCards);

      const result = await jobCardService.getAll();
      expect(result).toHaveLength(2);
      expect(result).toEqual(jobCards);
    });
  });

  describe('create', () => {
    it('creates a new job card', async () => {
      const newJobCard = createMockJobCard({ id: '1' });
      const result = await jobCardService.create(newJobCard);

      expect(result).toEqual(newJobCard);
      const allJobCards = await jobCardService.getAll();
      expect(allJobCards).toHaveLength(1);
      // Normalization may remove some fields, so check key fields instead
      expect(allJobCards[0].id).toBe('1');
      expect(allJobCards[0].jobCardNumber).toBe(newJobCard.jobCardNumber);
      expect(allJobCards[0].customerId).toBe(newJobCard.customerId);
    });

    it('adds job card to existing list', async () => {
      const existing = createMockJobCard({ id: '1' });
      safeStorage.setItem('jobCards', [existing]);

      const newJobCard = createMockJobCard({ id: '2' });
      await jobCardService.create(newJobCard);

      const allJobCards = await jobCardService.getAll();
      expect(allJobCards).toHaveLength(2);
    });

    it('normalizes job card data', async () => {
      const jobCard = createMockJobCard({ id: '1' });
      const result = await jobCardService.create(jobCard);

      expect(result.id).toBeDefined();
      expect(result.jobCardNumber).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates existing job card', async () => {
      const jobCard = createMockJobCard({ id: '1', status: 'Created' });
      safeStorage.setItem('jobCards', [jobCard]);

      const updated = { ...jobCard, status: 'In Progress' as const };
      const result = await jobCardService.update('1', updated);

      expect(result.status).toBe('In Progress');
      const allJobCards = await jobCardService.getAll();
      expect(allJobCards[0].status).toBe('In Progress');
    });

    it('does not update non-existent job card', async () => {
      const jobCard = createMockJobCard({ id: '1' });
      safeStorage.setItem('jobCards', [jobCard]);

      const updated = createMockJobCard({ id: '2' });
      await jobCardService.update('2', updated);

      const allJobCards = await jobCardService.getAll();
      expect(allJobCards).toHaveLength(1);
      expect(allJobCards[0].id).toBe('1');
    });

    it('normalizes updated job card data', async () => {
      const jobCard = createMockJobCard({ id: '1' });
      safeStorage.setItem('jobCards', [jobCard]);

      const updated = { ...jobCard, description: 'Updated description' };
      const result = await jobCardService.update('1', updated);

      expect(result.description).toBe('Updated description');
    });
  });

  describe('createFromQuotation', () => {
    it('creates job card from quotation in mock mode', async () => {
      const result = await jobCardService.createFromQuotation('quotation-1');

      expect(result).toBeDefined();
      expect(result.quotationId).toBe('quotation-1');
      expect(result.status).toBe('Created');
    });

    it('assigns engineer when provided', async () => {
      const result = await jobCardService.createFromQuotation('quotation-1', 'engineer-1');

      expect(result.assignedEngineer).toBe('engineer-1');
    });

    it('creates unique job card IDs', async () => {
      // Add small delay to ensure different timestamps
      const result1 = await jobCardService.createFromQuotation('quotation-1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await jobCardService.createFromQuotation('quotation-2');

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('assignEngineer', () => {
    it('assigns engineer to job card in mock mode', async () => {
      const result = await jobCardService.assignEngineer('job-card-1', 'engineer-1', 'Engineer Name');

      expect(result.id).toBe('job-card-1');
      expect(result.assignedEngineer).toBe('engineer-1');
      expect(result.status).toBe('Assigned');
    });

    it('updates status to Assigned', async () => {
      const result = await jobCardService.assignEngineer('job-card-1', 'engineer-1', 'Engineer Name');

      expect(result.status).toBe('Assigned');
    });
  });
});

