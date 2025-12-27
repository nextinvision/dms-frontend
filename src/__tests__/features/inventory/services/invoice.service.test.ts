import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceService } from '@/features/inventory/services/invoice.service';
import { centralInventoryRepository } from '@/__mocks__/repositories/central-inventory.repository';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import type { PartsIssue, InvoiceFormData } from '@/shared/types/central-inventory.types';
import type { Invoice } from '@/shared/types/invoice.types';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('@/__mocks__/repositories/central-inventory.repository', () => ({
  centralInventoryRepository: {
    getPurchaseOrderById: vi.fn(),
  },
}));

describe('InvoiceService', () => {
  const mockPartsIssue: PartsIssue = {
    id: 'issue-1',
    issueNumber: 'ISSUE-001',
    serviceCenterId: 'sc-001',
    serviceCenterName: 'Service Center 1',
    items: [
      {
        partId: 'part-1',
        partName: 'Brake Pad',
        partNumber: 'BP-001',
        hsnCode: '8708',
        quantity: 10,
        unitPrice: 1000,
        totalPrice: 10000,
      },
    ],
    totalAmount: 10000,
    issuedBy: 'Inventory Manager',
    issuedAt: new Date().toISOString(),
  } as PartsIssue;

  const mockFormData: InvoiceFormData = {
    paymentMethod: 'bank_transfer',
    paymentReference: 'REF-001',
    notes: 'Test invoice',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  describe('createInvoice', () => {
    it('creates invoice from parts issue', async () => {
      const invoice = await invoiceService.createInvoice(mockPartsIssue, mockFormData);

      expect(invoice).toMatchObject({
        invoiceNumber: expect.stringMatching(/^INV-\d{4}-\d{4}$/),
        serviceCenterId: 'sc-001',
        partsIssueId: 'issue-1',
        partsIssueNumber: 'ISSUE-001',
        status: 'sent',
        subtotal: 10000,
        totalAmount: 10000,
      });
      expect(invoice.id).toBeDefined();
      expect(invoice.items).toHaveLength(1);
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('generates invoice number with correct format', async () => {
      const invoice = await invoiceService.createInvoice(mockPartsIssue, mockFormData);

      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('increments invoice number sequence', async () => {
      const existingInvoices = [
        { invoiceNumber: 'INV-2024-0001' },
        { invoiceNumber: 'INV-2024-0002' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingInvoices as any);

      const invoice = await invoiceService.createInvoice(mockPartsIssue, mockFormData);

      expect(invoice.invoiceNumber).toBe('INV-2024-0003');
    });

    it('sets status to paid if payment screenshot provided', async () => {
      const formDataWithPayment = {
        ...mockFormData,
        paymentScreenshot: 'base64-image-data',
      };

      const invoice = await invoiceService.createInvoice(mockPartsIssue, formDataWithPayment);

      expect(invoice.status).toBe('paid');
      expect(invoice.paidAt).toBeDefined();
      expect(invoice.paidBy).toBe('Inventory Manager');
    });

    it('creates invoice items from parts issue items', async () => {
      const invoice = await invoiceService.createInvoice(mockPartsIssue, mockFormData);

      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0]).toMatchObject({
        partId: 'part-1',
        partName: 'Brake Pad',
        partNumber: 'BP-001',
        quantity: 10,
        unitPrice: 1000,
        totalPrice: 10000,
      });
    });
  });

  describe('getAllInvoices', () => {
    it('returns all invoices', () => {
      const mockInvoices = [
        { id: 'inv-1', invoiceNumber: 'INV-001' },
        { id: 'inv-2', invoiceNumber: 'INV-002' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockInvoices as any);

      const invoices = invoiceService.getAllInvoices();

      expect(invoices).toEqual(mockInvoices);
    });
  });

  describe('getInvoiceById', () => {
    it('returns invoice by id', async () => {
      const mockInvoices = [
        { id: 'inv-1', invoiceNumber: 'INV-001' },
        { id: 'inv-2', invoiceNumber: 'INV-002' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockInvoices as any);

      const invoice = await invoiceService.getInvoiceById('inv-1');

      expect(invoice).toEqual(mockInvoices[0]);
    });

    it('returns null if invoice not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const invoice = await invoiceService.getInvoiceById('nonexistent');

      expect(invoice).toBeNull();
    });
  });

  describe('getInvoicesByServiceCenter', () => {
    it('returns invoices for specific service center', async () => {
      const mockInvoices = [
        { id: 'inv-1', serviceCenterId: 'sc-001' },
        { id: 'inv-2', serviceCenterId: 'sc-002' },
        { id: 'inv-3', serviceCenterId: 'sc-001' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockInvoices as any);

      const invoices = await invoiceService.getInvoicesByServiceCenter('sc-001');

      expect(invoices).toHaveLength(2);
      expect(invoices.every(inv => inv.serviceCenterId === 'sc-001')).toBe(true);
    });
  });

  describe('getInvoiceByPartsIssue', () => {
    it('returns invoice by parts issue id', async () => {
      const mockInvoices = [
        { id: 'inv-1', partsIssueId: 'issue-1' },
        { id: 'inv-2', partsIssueId: 'issue-2' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockInvoices as any);

      const invoice = await invoiceService.getInvoiceByPartsIssue('issue-1');

      expect(invoice).toEqual(mockInvoices[0]);
    });

    it('returns null if invoice not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const invoice = await invoiceService.getInvoiceByPartsIssue('nonexistent');

      expect(invoice).toBeNull();
    });
  });

  describe('updateInvoicePayment', () => {
    it('updates invoice payment status', async () => {
      const mockInvoice = {
        id: 'inv-1',
        status: 'sent',
        issuedBy: 'Manager',
      };
      vi.mocked(safeStorage.getItem).mockReturnValue([mockInvoice] as any);

      const updated = await invoiceService.updateInvoicePayment(
        'inv-1',
        'base64-image',
        'bank_transfer',
        'REF-001'
      );

      expect(updated.status).toBe('paid');
      expect(updated.paymentScreenshot).toBe('base64-image');
      expect(updated.paymentMethod).toBe('bank_transfer');
      expect(updated.paymentReference).toBe('REF-001');
      expect(updated.paidAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('throws error if invoice not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        invoiceService.updateInvoicePayment('nonexistent', 'base64-image')
      ).rejects.toThrow('Invoice not found');
    });
  });
});

