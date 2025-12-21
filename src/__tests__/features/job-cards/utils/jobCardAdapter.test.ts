import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockJobCard, createMockCustomer, createMockVehicle, createMockQuotation } from '@/test/utils/mocks';
import type { JobCard } from '@/shared/types/job-card.types';

// Mock the modules that jobCardAdapter uses with require()
const mockGenerateJobCardNumber = vi.fn(() => 'SC-001-2024-01-0001');
const mockGenerateSrNo = vi.fn((items: any) => items);

// Mock the modules BEFORE importing jobCardAdapter
vi.mock('@/shared/utils/job-card.utils', () => ({
  generateJobCardNumber: mockGenerateJobCardNumber,
}));

vi.mock('../jobCardUtils', () => ({
  generateSrNoForPart2Items: mockGenerateSrNo,
}));

// Import after mocks
import { jobCardAdapter } from "@/features/job-cards/utils/jobCardAdapter";

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateJobCardNumber.mockReturnValue('SC-001-2024-01-0001');
  mockGenerateSrNo.mockImplementation((items: any) => items);
});

describe('jobCardAdapter', () => {
  describe('createEmptyForm', () => {
    it('creates empty form with all required fields', () => {
      const form = jobCardAdapter.createEmptyForm();

      expect(form).toHaveProperty('customerId');
      expect(form).toHaveProperty('customerName');
      expect(form).toHaveProperty('vehicleId');
      expect(form).toHaveProperty('part2Items');
      expect(form.customerId).toBe('');
      expect(form.part2Items).toEqual([]);
    });
  });

  describe('mapJobCardToForm', () => {
    it('maps job card to form correctly', () => {
      const jobCard = createMockJobCard({
        id: '1',
        customerId: '1',
        customerName: 'John Doe',
        vehicleId: '1',
        vehicleMake: 'Tesla',
        vehicleModel: 'Model 3',
        registration: 'ABC123',
      });

      const form = jobCardAdapter.mapJobCardToForm(jobCard);

      expect(form.customerId).toBe('1');
      expect(form.customerName).toBe('John Doe');
      expect(form.vehicleId).toBe('1');
      expect(form.vehicleMake).toBe('Tesla');
      expect(form.vehicleModel).toBe('Model 3');
      expect(form.vehicleRegistration).toBe('ABC123');
    });

    it('maps part2 items correctly', () => {
      const jobCard = createMockJobCard({
        part2: [
          {
            srNo: 1,
            partName: 'Brake Pad',
            partCode: 'BP-001',
            qty: 2,
            amount: 1000,
            partWarrantyTag: false,
          },
        ],
      });

      const form = jobCardAdapter.mapJobCardToForm(jobCard);

      expect(form.part2Items).toHaveLength(1);
      expect(form.part2Items[0].partName).toBe('Brake Pad');
    });
  });

  describe('mapCustomerToForm', () => {
    it('maps customer to form correctly', () => {
      const customer = createMockCustomer({
        id: '1',
        name: 'John Doe',
        phone: '+1234567890',
      });
      const vehicle = createMockVehicle({
        id: '1',
        vehicleMake: 'Tesla',
        vehicleModel: 'Model 3',
        registration: 'ABC123',
      });

      const form = jobCardAdapter.mapCustomerToForm(customer, vehicle);

      expect(form.customerId).toBe('1');
      expect(form.customerName).toBe('John Doe');
      expect(form.vehicleId).toBe('1');
      expect(form.vehicleMake).toBe('Tesla');
      expect(form.vehicleModel).toBe('Model 3');
      expect(form.vehicleRegistration).toBe('ABC123');
    });

    it('handles customer without vehicle', () => {
      const customer = createMockCustomer({
        id: '1',
        name: 'John Doe',
      });

      const form = jobCardAdapter.mapCustomerToForm(customer);

      expect(form.customerId).toBe('1');
      expect(form.customerName).toBe('John Doe');
      expect(form.vehicleId).toBe('');
    });
  });

  describe('mapQuotationToForm', () => {
    it('maps quotation to form correctly', () => {
      const quotation = createMockQuotation({
        id: '1',
        customerId: '1',
        vehicleId: '1',
      });
      const customer = createMockCustomer({
        id: '1',
        name: 'John Doe',
      });
      const vehicle = createMockVehicle({
        id: '1',
        vehicleMake: 'Tesla',
        vehicleModel: 'Model 3',
      });

      const form = jobCardAdapter.mapQuotationToForm(quotation, customer, vehicle);

      expect(form.customerId).toBe('1');
      expect(form.vehicleId).toBe('1');
    });
  });

  describe('mapFormToJobCard', () => {
    it('maps form to job card correctly', () => {
      const form = {
        customerId: '1',
        customerName: 'John Doe',
        vehicleId: '1',
        vehicleMake: 'Tesla',
        vehicleModel: 'Model 3',
        vehicleRegistration: 'ABC123',
        part2Items: [],
      };

      const jobCard = jobCardAdapter.mapFormToJobCard(
        form,
        'sc-001',
        'SC-001',
        null
      );

      expect(jobCard.customerId).toBe('1');
      expect(jobCard.customerName).toBe('John Doe');
      expect(jobCard.serviceCenterId).toBe('sc-001');
      expect(jobCard.serviceCenterCode).toBe('SC-001');
    });

    it('generates job card number for new job card', () => {
      const form = jobCardAdapter.createEmptyForm();
      const jobCard = jobCardAdapter.mapFormToJobCard(
        form,
        'sc-001',
        'SC-001',
        null
      );

      expect(jobCard.jobCardNumber).toBeDefined();
      expect(jobCard.jobCardNumber).toMatch(/^SC-001-/);
    });

    it('preserves job card number for existing job card', () => {
      const existingJobCard = createMockJobCard({
        id: '1',
        jobCardNumber: 'SC-001-2024-01-0001',
      });

      const form = jobCardAdapter.createEmptyForm();
      const jobCard = jobCardAdapter.mapFormToJobCard(
        form,
        'sc-001',
        'SC-001',
        existingJobCard
      );

      expect(jobCard.jobCardNumber).toBe('SC-001-2024-01-0001');
    });
  });
});

