import { describe, it, expect } from 'vitest';
import {
  generateInvoiceNumber,
  calculateGST,
  populateInvoiceFromJobCard,
} from "@/shared/utils/invoice.utils";
import type { ServiceCenterInvoice, JobCard } from '@/shared/types';
import { createMockJobCard } from '@/test/utils/mocks';

describe('Invoice Utils', () => {
  describe('generateInvoiceNumber', () => {
    it('generates invoice number with correct format', () => {
      const result = generateInvoiceNumber('SC001', 2024, []);
      expect(result).toMatch(/^INV-SC001-2024-\d{4}$/);
    });

    it('starts sequence at 0001 for first invoice', () => {
      const result = generateInvoiceNumber('SC001', 2024, []);
      expect(result).toBe('INV-SC001-2024-0001');
    });

    it('increments sequence for existing invoices', () => {
      const existingInvoices: ServiceCenterInvoice[] = [
        { id: '1', invoiceNumber: 'INV-SC001-2024-0001' } as ServiceCenterInvoice,
        { id: '2', invoiceNumber: 'INV-SC001-2024-0002' } as ServiceCenterInvoice,
      ];
      const result = generateInvoiceNumber('SC001', 2024, existingInvoices);
      expect(result).toBe('INV-SC001-2024-0003');
    });

    it('only considers invoices for same service center and year', () => {
      const existingInvoices: ServiceCenterInvoice[] = [
        { id: '1', invoiceNumber: 'INV-SC001-2024-0005' } as ServiceCenterInvoice,
        { id: '2', invoiceNumber: 'INV-SC002-2024-0001' } as ServiceCenterInvoice, // Different SC
        { id: '3', invoiceNumber: 'INV-SC001-2023-0001' } as ServiceCenterInvoice, // Different year
      ];
      const result = generateInvoiceNumber('SC001', 2024, existingInvoices);
      expect(result).toBe('INV-SC001-2024-0006');
    });

    it('handles missing invoice numbers gracefully', () => {
      const existingInvoices: ServiceCenterInvoice[] = [
        { id: '1', invoiceNumber: undefined } as ServiceCenterInvoice,
        { id: '2', invoiceNumber: 'INV-SC001-2024-0002' } as ServiceCenterInvoice,
      ];
      const result = generateInvoiceNumber('SC001', 2024, existingInvoices);
      expect(result).toBe('INV-SC001-2024-0003');
    });
  });

  describe('calculateGST', () => {
    it('calculates CGST and SGST for same state', () => {
      const result = calculateGST(1000, 18, 'Maharashtra', 'Maharashtra');
      
      expect(result.cgst).toBe(90); // 9% of 1000
      expect(result.sgst).toBe(90); // 9% of 1000
      expect(result.igst).toBe(0);
      expect(result.cgst + result.sgst + result.igst).toBe(180);
    });

    it('calculates IGST for different states', () => {
      const result = calculateGST(1000, 18, 'Maharashtra', 'Karnataka');
      
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(180); // 18% of 1000
      expect(result.cgst + result.sgst + result.igst).toBe(180);
    });

    it('handles zero amount', () => {
      const result = calculateGST(0, 18, 'Maharashtra', 'Maharashtra');
      
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(0);
      expect(result.cgst + result.sgst + result.igst).toBe(0);
    });

    it('handles different GST rates', () => {
      const result5 = calculateGST(1000, 5, 'Maharashtra', 'Maharashtra');
      expect(result5.cgst).toBe(25); // 2.5% of 1000
      expect(result5.sgst).toBe(25);

      const result12 = calculateGST(1000, 12, 'Maharashtra', 'Maharashtra');
      expect(result12.cgst).toBe(60); // 6% of 1000
      expect(result12.sgst).toBe(60);

      const result28 = calculateGST(1000, 28, 'Maharashtra', 'Maharashtra');
      expect(result28.cgst).toBe(140); // 14% of 1000
      expect(result28.sgst).toBe(140);
    });

    it('rounds GST amounts correctly', () => {
      const result = calculateGST(100, 18, 'Maharashtra', 'Maharashtra');
      // 9% of 100 = 9
      expect(result.cgst).toBe(9);
      expect(result.sgst).toBe(9);
    });
  });

  describe('populateInvoiceFromJobCard', () => {
    it('creates invoice with correct structure', () => {
      const jobCard = createMockJobCard({
        id: '1',
        jobCardNumber: 'JC-001',
        customerName: 'John Doe',
        serviceCenterCode: 'SC001',
      });

      const serviceCenter = {
        id: 'sc-001',
        code: 'SC001',
        name: 'Service Center 1',
        state: 'Maharashtra',
        gstNumber: 'GST123',
      };

      const result = populateInvoiceFromJobCard(jobCard, serviceCenter);

      expect(result).toBeDefined();
      expect(result.jobCardId).toBe('1');
      expect(result.customerName).toBe('John Doe');
      expect(result.serviceCenterId).toBe('sc-001');
    });

    it('includes part2 items in enhanced items', () => {
      const jobCard = createMockJobCard({
        id: '1',
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

      const serviceCenter = {
        id: 'sc-001',
        name: 'Service Center 1',
        state: 'Maharashtra',
      };

      const result = populateInvoiceFromJobCard(jobCard, serviceCenter);

      expect(result.enhancedItems).toBeDefined();
      expect(result.enhancedItems?.length).toBeGreaterThan(0);
      expect(result.enhancedItems?.[0].name).toBe('Brake Pad');
    });

    it('calculates GST correctly for items', () => {
      const jobCard = createMockJobCard({
        id: '1',
        part2: [
          {
            srNo: 1,
            partName: 'Part 1',
            partCode: 'P1',
            qty: 1,
            amount: 1000,
            partWarrantyTag: false,
          },
        ],
      });

      const serviceCenter = {
        id: 'sc-001',
        name: 'Service Center 1',
        state: 'Maharashtra',
      };

      const result = populateInvoiceFromJobCard(jobCard, serviceCenter);

      if (result.enhancedItems && result.enhancedItems.length > 0) {
        const item = result.enhancedItems[0];
        expect(item.cgstAmount).toBeGreaterThan(0);
        expect(item.sgstAmount).toBeGreaterThan(0);
        expect(item.totalAmount).toBeGreaterThan(item.taxableAmount);
      }
    });

    it('handles job card without parts', () => {
      const jobCard = createMockJobCard({
        id: '1',
        part2: [],
      });

      const serviceCenter = {
        id: 'sc-001',
        name: 'Service Center 1',
        state: 'Maharashtra',
      };

      const result = populateInvoiceFromJobCard(jobCard, serviceCenter);

      expect(result).toBeDefined();
      expect(result.enhancedItems).toEqual([]);
    });

    it('handles warranty items correctly', () => {
      const jobCard = createMockJobCard({
        id: '1',
        part2: [
          {
            srNo: 1,
            partName: 'Warranty Part',
            partCode: 'WP-001',
            qty: 1,
            amount: 0,
            partWarrantyTag: true,
          },
        ],
      });

      const serviceCenter = {
        id: 'sc-001',
        name: 'Service Center 1',
        state: 'Maharashtra',
      };

      const result = populateInvoiceFromJobCard(jobCard, serviceCenter);

      if (result.enhancedItems && result.enhancedItems.length > 0) {
        const item = result.enhancedItems[0];
        // Warranty items should have name set correctly
        expect(item.name).toBeTruthy();
      }
    });
  });
});

