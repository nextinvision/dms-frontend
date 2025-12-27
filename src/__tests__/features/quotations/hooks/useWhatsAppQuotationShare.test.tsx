import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWhatsAppQuotationShare } from '@/features/quotations/hooks/useWhatsAppQuotationShare';
import { quotationsService } from '@/features/quotations/services/quotations.service';
import { createMockQuotation } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/quotations/services/quotations.service', () => ({
  quotationsService: {
    sendWhatsApp: vi.fn(),
  },
}));

describe('useWhatsAppQuotationShare', () => {
  const mockQuotation = createMockQuotation({
    id: 'quo-1',
    quotationNumber: 'QUO-001',
    totalAmount: 5000,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://example.com',
      },
      writable: true,
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useWhatsAppQuotationShare());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('shares quotation via WhatsApp successfully', async () => {
    vi.mocked(quotationsService.sendWhatsApp).mockResolvedValue({
      success: true,
      whatsappUrl: 'https://wa.me/?text=test',
    });

    const { result } = renderHook(() => useWhatsAppQuotationShare());

    let response: any = null;

    await act(async () => {
      response = await result.current.shareQuotation('quo-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(response.success).toBe(true);
    expect(response.whatsappUrl).toBeDefined();
    expect(quotationsService.sendWhatsApp).toHaveBeenCalledWith('quo-1');
    expect(result.current.error).toBeNull();
  });

  it('handles share error gracefully', async () => {
    vi.mocked(quotationsService.sendWhatsApp).mockRejectedValue(
      new Error('Failed to send')
    );

    const { result } = renderHook(() => useWhatsAppQuotationShare());

    let response: any = null;

    await act(async () => {
      response = await result.current.shareQuotation('quo-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(response.success).toBe(false);
    expect(response.message).toBe('Failed to send');
    expect(result.current.error).toBe('Failed to send');
  });

  it('generates WhatsApp URL correctly', () => {
    const { result } = renderHook(() => useWhatsAppQuotationShare());

    const url = result.current.generateWhatsAppUrl(mockQuotation as any);

    expect(url).toContain('wa.me');
    expect(url).toContain('text=');
    expect(url).toContain('QUO-001');
    expect(url).toContain('5000');
  });

  it('includes quotation confirmation link in WhatsApp message', () => {
    const { result } = renderHook(() => useWhatsAppQuotationShare());

    const url = result.current.generateWhatsAppUrl(mockQuotation as any);

    expect(url).toContain('/sc/quotations/quo-1/confirm');
  });

  it('formats currency correctly in WhatsApp message', () => {
    const { result } = renderHook(() => useWhatsAppQuotationShare());

    const url = result.current.generateWhatsAppUrl(mockQuotation as any);

    // Should contain formatted amount
    expect(url).toContain('5,000');
  });

  it('sets loading state during share', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(quotationsService.sendWhatsApp).mockReturnValue(promise as any);

    const { result } = renderHook(() => useWhatsAppQuotationShare());

    act(() => {
      result.current.shareQuotation('quo-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolvePromise!({ success: true });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

