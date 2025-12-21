import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeJobCard,
  normalizeAppointment,
  migrateToNormalizedStore,
} from '@/shared/utils/normalization.utils';
import { createMockJobCard } from '@/test/utils/mocks';
import type { JobCard } from '@/shared/types/job-card.types';
import type { Appointment } from '@/shared/types/appointment.types';

describe('normalization.utils', () => {
  describe('normalizeJobCard', () => {
    it('removes redundant master data from job card', () => {
      const jobCard = createMockJobCard({
        id: 'jc-1',
        customerName: 'John Doe',
        vehicle: 'Tesla Model 3',
        registration: 'ABC123',
        vehicleMake: 'Tesla',
        vehicleModel: 'Model 3',
        customerEmail: 'john@example.com',
        customerWhatsappNumber: '+1234567890',
        customerAlternateMobile: '+0987654321',
        status: 'Created',
        serviceCenterId: 'sc-001',
      });

      const normalized = normalizeJobCard(jobCard);

      expect(normalized.customerName).toBeUndefined();
      expect(normalized.vehicle).toBeUndefined();
      expect(normalized.registration).toBeUndefined();
      expect(normalized.vehicleMake).toBeUndefined();
      expect(normalized.vehicleModel).toBeUndefined();
      expect(normalized.customerEmail).toBeUndefined();
      expect(normalized.customerWhatsappNumber).toBeUndefined();
      expect(normalized.customerAlternateMobile).toBeUndefined();

      // Process data should remain
      expect(normalized.id).toBe('jc-1');
      expect(normalized.status).toBe('Created');
      expect(normalized.serviceCenterId).toBe('sc-001');
    });

    it('preserves all process data fields', () => {
      const jobCard = createMockJobCard({
        id: 'jc-1',
        jobCardNumber: 'JC-001',
        status: 'In Progress',
        priority: 'High',
        description: 'Test description',
        createdAt: '2024-01-01',
        part2: [],
      });

      const normalized = normalizeJobCard(jobCard);

      expect(normalized.id).toBe('jc-1');
      expect(normalized.jobCardNumber).toBe('JC-001');
      expect(normalized.status).toBe('In Progress');
      expect(normalized.priority).toBe('High');
      expect(normalized.description).toBe('Test description');
      expect(normalized.createdAt).toBe('2024-01-01');
      expect(normalized.part2).toEqual([]);
    });
  });

  describe('normalizeAppointment', () => {
    it('removes redundant master data from appointment', () => {
      const appointment: Appointment = {
        id: 'apt-1',
        customerName: 'John Doe',
        vehicle: 'Tesla Model 3',
        phone: '+1234567890',
        date: '2024-01-15',
        time: '10:00',
        status: 'scheduled',
      } as Appointment;

      const normalized = normalizeAppointment(appointment);

      expect(normalized.customerName).toBeUndefined();
      expect(normalized.vehicle).toBeUndefined();
      expect(normalized.phone).toBeUndefined();

      // Process data should remain
      expect(normalized.id).toBe('apt-1');
      expect(normalized.date).toBe('2024-01-15');
      expect(normalized.time).toBe('10:00');
      expect(normalized.status).toBe('scheduled');
    });
  });

  describe('migrateToNormalizedStore', () => {
    beforeEach(() => {
      // Mock localStorage
      const store: Record<string, string> = {};
      global.localStorage = {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          Object.keys(store).forEach(key => delete store[key]);
        }),
        length: 0,
        key: vi.fn(() => null),
      };
    });

    it('migrates array data to normalized format', () => {
      const rawData = [
        { id: '1', customerName: 'John', vehicle: 'Tesla' },
        { id: '2', customerName: 'Jane', vehicle: 'BMW' },
      ];

      global.localStorage.setItem('testKey', JSON.stringify(rawData));

      const normalizer = (item: any) => ({
        id: item.id,
        // Remove customerName and vehicle
      });

      migrateToNormalizedStore('testKey', normalizer);

      const migrated = JSON.parse(global.localStorage.getItem('testKey') || '[]');
      expect(migrated).toHaveLength(2);
      expect(migrated[0].customerName).toBeUndefined();
      expect(migrated[0].vehicle).toBeUndefined();
      expect(migrated[0].id).toBe('1');
    });

    it('handles missing data gracefully', () => {
      const normalizer = (item: any) => item;

      // Should not throw error
      expect(() => {
        migrateToNormalizedStore('nonexistent', normalizer);
      }).not.toThrow();
    });

    it('handles invalid JSON gracefully', () => {
      global.localStorage.setItem('invalidKey', 'invalid json');

      const normalizer = (item: any) => item;

      // Should not throw error
      expect(() => {
        migrateToNormalizedStore('invalidKey', normalizer);
      }).not.toThrow();
    });

    it('handles non-array data gracefully', () => {
      global.localStorage.setItem('nonArrayKey', JSON.stringify({ id: '1' }));

      const normalizer = (item: any) => item;

      // Should not throw error
      expect(() => {
        migrateToNormalizedStore('nonArrayKey', normalizer);
      }).not.toThrow();
    });
  });
});

