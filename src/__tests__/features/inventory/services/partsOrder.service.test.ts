import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { partsOrderService } from '@/features/inventory/services/partsOrder.service';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import type { PartsOrder, PartsOrderItem } from '@/features/inventory/services/partsOrder.service';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

describe('PartsOrderService', () => {
  const mockOrderItems: PartsOrderItem[] = [
    {
      partId: 'part-1',
      partName: 'Brake Pad',
      requiredQty: 10,
      urgency: 'high',
      notes: 'Urgent requirement',
    },
  ];

  const mockOrder: PartsOrder = {
    id: 'order-1',
    orderNumber: 'PO-2024-01-0001',
    items: mockOrderItems,
    status: 'order',
    requestedBy: 'Inventory Manager',
    requestedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15'));
    vi.mocked(safeStorage.getItem).mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAll', () => {
    it('returns all orders', async () => {
      const mockOrders = [mockOrder];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockOrders);

      const orders = await partsOrderService.getAll();

      expect(orders).toEqual(mockOrders);
    });

    it('migrates old format to new format', async () => {
      const oldFormatOrder = {
        id: 'order-1',
        partId: 'part-1',
        partName: 'Brake Pad',
        requiredQty: 10,
        urgency: 'high',
        notes: 'Test',
      };
      vi.mocked(safeStorage.getItem).mockReturnValue([oldFormatOrder]);

      const orders = await partsOrderService.getAll();

      expect(orders[0].items).toBeDefined();
      expect(orders[0].items[0].partId).toBe('part-1');
    });
  });

  describe('getById', () => {
    it('returns order by id', async () => {
      const mockOrders = [mockOrder];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockOrders);

      const order = await partsOrderService.getById('order-1');

      expect(order).toEqual(mockOrder);
    });

    it('returns null if order not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      const order = await partsOrderService.getById('nonexistent');

      expect(order).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a new order', async () => {
      const order = await partsOrderService.create(mockOrderItems, 'Test notes', 'Manager');

      expect(order).toMatchObject({
        items: mockOrderItems,
        status: 'order',
        requestedBy: 'Manager',
        orderNotes: 'Test notes',
      });
      expect(order.id).toBeDefined();
      expect(order.orderNumber).toMatch(/^PO-\d{4}-\d{2}-\d{4}$/);
      expect(order.requestedAt).toBeDefined();
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    it('generates order number with correct format', async () => {
      const order = await partsOrderService.create(mockOrderItems);

      expect(order.orderNumber).toMatch(/^PO-\d{4}-\d{2}-\d{4}$/);
    });

    it('increments sequence for same month', async () => {
      const existingOrders = [
        { ...mockOrder, orderNumber: 'PO-2024-01-0001' },
        { ...mockOrder, id: 'order-2', orderNumber: 'PO-2024-01-0002' },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(existingOrders);

      const order = await partsOrderService.create(mockOrderItems);

      expect(order.orderNumber).toBe('PO-2024-01-0003');
    });

    it('throws error if no items provided', async () => {
      await expect(partsOrderService.create([])).rejects.toThrow(
        'At least one part is required'
      );
    });

    it('uses default requestedBy if not provided', async () => {
      const order = await partsOrderService.create(mockOrderItems);

      expect(order.requestedBy).toBe('Inventory Manager');
    });
  });

  describe('saveDraft', () => {
    it('creates new draft order', async () => {
      const order = await partsOrderService.saveDraft(mockOrderItems, 'Draft notes');

      expect(order.status).toBe('draft');
      expect(order.orderNotes).toBe('Draft notes');
    });

    it('updates existing draft if draftId provided', async () => {
      const existingDraft = {
        ...mockOrder,
        status: 'draft' as const,
      };
      vi.mocked(safeStorage.getItem).mockReturnValue([existingDraft]);

      const updated = await partsOrderService.saveDraft(
        [{ ...mockOrderItems[0], requiredQty: 20 }],
        'Updated notes',
        'Manager',
        'order-1'
      );

      expect(updated.items[0].requiredQty).toBe(20);
      expect(updated.orderNotes).toBe('Updated notes');
    });
  });

  describe('updateDraft', () => {
    it('updates existing draft', async () => {
      const existingDraft = {
        ...mockOrder,
        status: 'draft' as const,
      };
      vi.mocked(safeStorage.getItem).mockReturnValue([existingDraft]);

      const updated = await partsOrderService.updateDraft(
        'order-1',
        [{ ...mockOrderItems[0], requiredQty: 15 }],
        'Updated notes'
      );

      expect(updated.items[0].requiredQty).toBe(15);
      expect(updated.orderNotes).toBe('Updated notes');
    });

    it('throws error if draft not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        partsOrderService.updateDraft('nonexistent', mockOrderItems)
      ).rejects.toThrow('Draft order not found');
    });

    it('throws error if order is not a draft', async () => {
      const nonDraftOrder = { ...mockOrder, status: 'order' as const };
      vi.mocked(safeStorage.getItem).mockReturnValue([nonDraftOrder]);

      await expect(
        partsOrderService.updateDraft('order-1', mockOrderItems)
      ).rejects.toThrow('Can only update draft orders');
    });
  });

  describe('submitDraft', () => {
    it('submits draft order', async () => {
      const existingDraft = {
        ...mockOrder,
        status: 'draft' as const,
      };
      vi.mocked(safeStorage.getItem).mockReturnValue([existingDraft]);

      const submitted = await partsOrderService.submitDraft('order-1');

      expect(submitted.status).toBe('order');
    });

    it('throws error if draft not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(partsOrderService.submitDraft('nonexistent')).rejects.toThrow(
        'Draft order not found'
      );
    });

    it('throws error if order is not a draft', async () => {
      const nonDraftOrder = { ...mockOrder, status: 'order' as const };
      vi.mocked(safeStorage.getItem).mockReturnValue([nonDraftOrder]);

      await expect(partsOrderService.submitDraft('order-1')).rejects.toThrow(
        'Can only submit draft orders'
      );
    });
  });

  describe('acknowledgeOrder', () => {
    it('acknowledges order with status "order"', async () => {
      const orderToAcknowledge = { ...mockOrder, status: 'order' as const };
      vi.mocked(safeStorage.getItem).mockReturnValue([orderToAcknowledge]);

      const acknowledged = await partsOrderService.acknowledgeOrder('order-1', 'Manager');

      expect(acknowledged.status).toBe('acknowledge');
      expect(acknowledged.approvedBy).toBe('Manager');
      expect(acknowledged.approvedAt).toBeDefined();
    });

    it('acknowledges order with status "pending"', async () => {
      const orderToAcknowledge = { ...mockOrder, status: 'pending' as const };
      vi.mocked(safeStorage.getItem).mockReturnValue([orderToAcknowledge]);

      const acknowledged = await partsOrderService.acknowledgeOrder('order-1', 'Manager');

      expect(acknowledged.status).toBe('acknowledge');
    });

    it('throws error if order not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        partsOrderService.acknowledgeOrder('nonexistent', 'Manager')
      ).rejects.toThrow('Order not found');
    });

    it('throws error if order status is not "order" or "pending"', async () => {
      const completedOrder = { ...mockOrder, status: 'received' as const };
      vi.mocked(safeStorage.getItem).mockReturnValue([completedOrder]);

      await expect(
        partsOrderService.acknowledgeOrder('order-1', 'Manager')
      ).rejects.toThrow('Cannot acknowledge order with status: received');
    });
  });

  describe('updateStatus', () => {
    it('updates order status', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([mockOrder]);

      const updated = await partsOrderService.updateStatus('order-1', 'approved', 'Manager');

      expect(updated.status).toBe('approved');
      expect(updated.approvedBy).toBe('Manager');
      expect(updated.approvedAt).toBeDefined();
    });

    it('sets rejectedBy and rejectedAt for rejected status', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([mockOrder]);

      const updated = await partsOrderService.updateStatus('order-1', 'rejected', 'Manager', 'Not needed');

      expect(updated.status).toBe('rejected');
      expect(updated.rejectedBy).toBe('Manager');
      expect(updated.rejectedAt).toBeDefined();
    });

    it('sets receivedAt for received status', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([mockOrder]);

      const updated = await partsOrderService.updateStatus('order-1', 'received', 'Manager');

      expect(updated.status).toBe('received');
      expect(updated.receivedAt).toBeDefined();
    });

    it('throws error if order not found', async () => {
      vi.mocked(safeStorage.getItem).mockReturnValue([]);

      await expect(
        partsOrderService.updateStatus('nonexistent', 'approved', 'Manager')
      ).rejects.toThrow('Order not found');
    });
  });

  describe('getByStatus', () => {
    it('returns orders by status', async () => {
      const mockOrders = [
        { ...mockOrder, status: 'order' as const },
        { ...mockOrder, id: 'order-2', status: 'approved' as const },
        { ...mockOrder, id: 'order-3', status: 'order' as const },
      ];
      vi.mocked(safeStorage.getItem).mockReturnValue(mockOrders);

      const orders = await partsOrderService.getByStatus('order');

      expect(orders).toHaveLength(2);
      expect(orders.every(o => o.status === 'order')).toBe(true);
    });
  });

  describe('createSingle', () => {
    it('creates order with single part (legacy method)', async () => {
      const formData = {
        partId: 'part-1',
        requiredQty: 10,
        urgency: 'high' as const,
        notes: 'Test',
      };

      const order = await partsOrderService.createSingle(formData, 'Brake Pad', 'Manager');

      expect(order.items).toHaveLength(1);
      expect(order.items[0].partId).toBe('part-1');
      expect(order.items[0].partName).toBe('Brake Pad');
      expect(order.items[0].requiredQty).toBe(10);
    });
  });
});

