import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJobCardForm } from "@/features/job-cards/hooks/useJobCardForm";
import { createMockCustomer, createMockVehicle, createMockQuotation } from '@/test/utils/mocks';

// Mock the adapter
vi.mock('../utils/jobCardAdapter', () => ({
  jobCardAdapter: {
    createEmptyForm: () => ({
      customerId: '',
      customerName: '',
      vehicleId: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleRegistration: '',
      part2Items: [],
    }),
    mapQuotationToForm: (quotation: any, customer: any, vehicle: any) => ({
      customerId: customer.id,
      customerName: customer.name,
      vehicleId: vehicle?.id || '',
    }),
    mapCustomerToForm: (customer: any, vehicle: any) => ({
      customerId: customer.id,
      customerName: customer.name,
      vehicleId: vehicle?.id || '',
    }),
  },
}));

describe('useJobCardForm', () => {
  it('initializes with empty form', () => {
    const { result } = renderHook(() =>
      useJobCardForm({ serviceCenterId: 'sc-001' })
    );

    expect(result.current.form.customerId).toBe('');
    expect(result.current.form.customerName).toBe('');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('initializes with provided initial values', () => {
    const initialValues = {
      customerId: '1',
      customerName: 'John Doe',
    };

    const { result } = renderHook(() =>
      useJobCardForm({
        serviceCenterId: 'sc-001',
        initialValues,
      })
    );

    expect(result.current.form.customerId).toBe('1');
    expect(result.current.form.customerName).toBe('John Doe');
  });

  it('updates form field', () => {
    const { result } = renderHook(() =>
      useJobCardForm({ serviceCenterId: 'sc-001' })
    );

    act(() => {
      result.current.updateFormField('customerName', 'Jane Doe');
    });

    expect(result.current.form.customerName).toBe('Jane Doe');
  });

  it('handles customer selection', () => {
    const { result } = renderHook(() =>
      useJobCardForm({ serviceCenterId: 'sc-001' })
    );

    const customer = createMockCustomer({ id: '1', name: 'John Doe' });
    const vehicle = createMockVehicle({ id: '1' });

    act(() => {
      result.current.handleSelectCustomer(customer, vehicle);
    });

    expect(result.current.form.customerId).toBe('1');
    expect(result.current.form.customerName).toBe('John Doe');
    expect(result.current.selectedQuotation).toBeNull();
  });

  it('handles quotation selection', () => {
    const { result } = renderHook(() =>
      useJobCardForm({ serviceCenterId: 'sc-001' })
    );

    const quotation = createMockQuotation({ id: '1' });
    const customer = createMockCustomer({ id: '1', name: 'John Doe' });
    const vehicle = createMockVehicle({ id: '1' });

    act(() => {
      result.current.handleSelectQuotation(quotation, customer, vehicle);
    });

    expect(result.current.form.customerId).toBe('1');
    expect(result.current.selectedQuotation).toEqual(quotation);
  });

  it('resets form', () => {
    const { result } = renderHook(() =>
      useJobCardForm({
        serviceCenterId: 'sc-001',
        initialValues: { customerId: '1', customerName: 'John' },
      })
    );

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.form.customerId).toBe('');
    expect(result.current.form.customerName).toBe('');
    expect(result.current.selectedQuotation).toBeNull();
  });

  it('adds part item', () => {
    const { result } = renderHook(() =>
      useJobCardForm({ serviceCenterId: 'sc-001' })
    );

    const partItem = {
      srNo: 1,
      partName: 'Brake Pad',
      partCode: 'BP-001',
      qty: 2,
      amount: 1000,
      partWarrantyTag: false,
    };

    act(() => {
      result.current.handleAddPartItem(partItem);
    });

    expect(result.current.form.part2Items).toHaveLength(1);
    expect(result.current.form.part2Items[0].partName).toBe('Brake Pad');
  });

  it('removes part item', () => {
    const { result } = renderHook(() =>
      useJobCardForm({
        serviceCenterId: 'sc-001',
        initialValues: {
          part2Items: [
            { srNo: 1, partName: 'Part 1', partCode: 'P1', qty: 1, amount: 100, partWarrantyTag: false },
            { srNo: 2, partName: 'Part 2', partCode: 'P2', qty: 1, amount: 200, partWarrantyTag: false },
          ],
        },
      })
    );

    act(() => {
      result.current.handleRemovePartItem(0);
    });

    expect(result.current.form.part2Items).toHaveLength(1);
    expect(result.current.form.part2Items[0].partName).toBe('Part 2');
    expect(result.current.form.part2Items[0].srNo).toBe(1); // Re-indexed
  });

  it('sets isSubmitting state', () => {
    const { result } = renderHook(() =>
      useJobCardForm({ serviceCenterId: 'sc-001' })
    );

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);
  });
});

