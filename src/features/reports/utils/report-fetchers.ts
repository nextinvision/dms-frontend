/**
 * Shared report fetching utilities
 * Used by both admin and service center manager report pages
 */

import { apiClient } from "@/core/api/client";
import { inventoryRepository } from "@/core/repositories/inventory.repository";
import { partsMasterService } from "@/features/inventory/services/partsMaster.service";
import type { Part } from "@/features/inventory/types/inventory.types";

interface DateRange {
  from: string;
  to: string;
}

interface ReportData {
  sales?: {
    totalRevenue: number;
    totalInvoices: number;
    avgInvoiceValue: number;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  };
  serviceVolume?: {
    totalJobCards: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgCompletionTime: string;
  };
  technicianPerformance?: {
    technicians: Array<{
      name: string;
      completedJobs: number;
      avgRating: number;
      efficiency: number;
    }>;
  };
  inventory?: {
    totalParts: number;
    lowStockCount: number;
    totalValue: number;
    topMovingParts: Array<{
      name: string;
      quantity: number;
      usageCount: number;
      price: number;
      value: number;
    }>;
    lowMovingParts: Array<{
      name: string;
      quantity: number;
      usageCount: number;
      price: number;
      value: number;
    }>;
    allParts: Array<{
      name: string;
      partNumber: string;
      category: string;
      quantity: number;
      minStockLevel: number;
      price: number;
      value: number;
      usageCount: number;
      status: string;
    }>;
  };
}

// Helper function to filter by date range
export const filterByDateRange = <T extends { createdAt?: string; date?: string; invoiceDate?: string }>(
  items: T[],
  dateRange: DateRange
): T[] => {
  if (!dateRange.from || !dateRange.to) return items;
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  toDate.setHours(23, 59, 59, 999);

  return items.filter((item) => {
    const itemDate = new Date(item.createdAt || item.date || item.invoiceDate || '');
    return itemDate >= fromDate && itemDate <= toDate;
  });
};

// Helper function to get price from part
const getPrice = (part: Part): number => {
  // Try to get price from part.price first
  if (part.price !== undefined && part.price !== null) {
    if (typeof part.price === 'number') {
      return part.price;
    }
  }

  // Fall back to unitPrice
  if (part.unitPrice !== undefined && part.unitPrice !== null) {
    if (typeof part.unitPrice === 'number') {
      return part.unitPrice;
    }
  }

  return 0;
};

// Helper function to calculate part status
const calculatePartStatus = (stockQty: number, minLevel: number): string => {
  if (stockQty <= 0) return "Out of Stock";
  if (minLevel > 0 && stockQty <= minLevel) return "Low Stock";
  return "In Stock";
};

/**
 * Fetch Sales Report
 */
export const fetchSalesReport = async (
  serviceCenterId: string,
  dateRange: DateRange
): Promise<ReportData['sales']> => {
  try {
    // Fetch revenue stats
    const revenueResponse = await apiClient.get(`/analytics/revenue?serviceCenterId=${serviceCenterId}&months=6`);
    const revenueData = revenueResponse.data || revenueResponse;

    // Fetch invoices for detailed analysis
    const invoicesResponse = await apiClient.get(`/invoices?serviceCenterId=${serviceCenterId}`);
    const invoices = Array.isArray(invoicesResponse.data)
      ? invoicesResponse.data
      : invoicesResponse.data?.data || [];

    console.log(`[Sales Report] Total invoices fetched: ${invoices.length}`);

    // Filter by date range
    const filteredInvoices = filterByDateRange(invoices, dateRange);
    console.log(`[Sales Report] Filtered invoices (by date): ${filteredInvoices.length}`);

    const totalRevenue = filteredInvoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + (Number(inv.grandTotal) || 0), 0);

    const totalInvoices = filteredInvoices.length;
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    console.log(`[Sales Report] Report generated - Revenue: ₹${totalRevenue}, Invoices: ${totalInvoices}, Avg: ₹${avgInvoiceValue.toFixed(2)}`);

    return {
      totalRevenue,
      totalInvoices,
      avgInvoiceValue,
      revenueByMonth: Array.isArray(revenueData) ? revenueData : [],
    };
  } catch (error) {
    console.error('[Sales Report] Error fetching report:', error);
    // Return empty data instead of throwing
    return {
      totalRevenue: 0,
      totalInvoices: 0,
      avgInvoiceValue: 0,
      revenueByMonth: [],
    };
  }
};

/**
 * Fetch Service Volume Report
 */
export const fetchServiceVolumeReport = async (
  serviceCenterId: string,
  dateRange: DateRange
): Promise<ReportData['serviceVolume']> => {
  try {
    // Fetch job cards
    const jobCardsResponse = await apiClient.get(`/job-cards?serviceCenterId=${serviceCenterId}`);
    const jobCards = Array.isArray(jobCardsResponse.data)
      ? jobCardsResponse.data
      : jobCardsResponse.data?.data || [];

    console.log(`[Service Volume Report] Total job cards fetched: ${jobCards.length}`);

    // Filter by date range
    const filteredJobCards = filterByDateRange(jobCards, dateRange);
    console.log(`[Service Volume Report] Filtered job cards (by date): ${filteredJobCards.length}`);

    const totalJobCards = filteredJobCards.length;

    // Use case-insensitive status checks
    const completed = filteredJobCards.filter((jc: any) => {
      const status = (jc.status || '').toUpperCase();
      return status === 'COMPLETED' || status === 'INVOICED';
    }).length;

    const inProgress = filteredJobCards.filter((jc: any) => {
      const status = (jc.status || '').toUpperCase();
      return status === 'IN_PROGRESS';
    }).length;

    const pending = filteredJobCards.filter((jc: any) => {
      const status = (jc.status || '').toUpperCase();
      return status === 'PENDING' || status === 'APPROVED';
    }).length;

    // Calculate average completion time
    const completedCards = filteredJobCards.filter((jc: any) => {
      const status = (jc.status || '').toUpperCase();
      return status === 'COMPLETED' && jc.completedAt && jc.createdAt;
    });

    let avgCompletionTime = "N/A";
    if (completedCards.length > 0) {
      const totalTime = completedCards.reduce((sum: number, jc: any) => {
        const created = new Date(jc.createdAt).getTime();
        const completed = new Date(jc.completedAt).getTime();
        return sum + (completed - created);
      }, 0);
      const avgMs = totalTime / completedCards.length;
      const avgHours = Math.round(avgMs / (1000 * 60 * 60) * 10) / 10;
      avgCompletionTime = `${avgHours} hours`;
    }

    console.log(`[Service Volume Report] Report generated - Total: ${totalJobCards}, Completed: ${completed}, In Progress: ${inProgress}, Pending: ${pending}`);

    return {
      totalJobCards,
      completed,
      inProgress,
      pending,
      avgCompletionTime,
    };
  } catch (error) {
    console.error('[Service Volume Report] Error fetching report:', error);
    // Return empty data instead of throwing
    return {
      totalJobCards: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      avgCompletionTime: "N/A",
    };
  }
};

/**
 * Fetch Technician Performance Report
 */
export const fetchTechnicianPerformanceReport = async (
  serviceCenterId: string,
  dateRange: DateRange
): Promise<ReportData['technicianPerformance']> => {
  try {
    // Fetch job cards with assigned technicians
    const jobCardsResponse = await apiClient.get(`/job-cards?serviceCenterId=${serviceCenterId}&expand=assignedTechnician`);
    const jobCards = Array.isArray(jobCardsResponse.data)
      ? jobCardsResponse.data
      : jobCardsResponse.data?.data || [];

    console.log(`[Technician Performance Report] Total job cards fetched: ${jobCards.length}`);

    // Filter by date range
    const filteredJobCards = filterByDateRange(jobCards, dateRange);
    console.log(`[Technician Performance Report] Filtered job cards (by date): ${filteredJobCards.length}`);

    // Define completed statuses - include all states that represent completed work
    const completedStatuses = ['COMPLETED', 'INVOICED'];

    // Group by technician
    const technicianMap = new Map<string, { name: string; completedJobs: number; totalJobs: number }>();

    filteredJobCards.forEach((jc: any) => {
      // Get technician info from various possible fields
      const techId = jc.assignedTechnicianId || jc.assignedTechnician?.id || jc.assignedEngineer?.id;
      const techName = jc.assignedTechnician?.name || jc.assignedTechnicianName || jc.assignedEngineer?.name || jc.assignedEngineer || "Unassigned";

      // Only process if we have a valid technician ID or name
      if (techId || (techName && techName !== "Unassigned")) {
        // Use technician ID as key, or fall back to name if ID not available
        const mapKey = techId || techName;

        const existing = technicianMap.get(mapKey) || { name: techName, completedJobs: 0, totalJobs: 0 };
        existing.totalJobs++;

        // Check if job card is completed - handle case insensitivity
        const status = (jc.status || '').toUpperCase();
        if (completedStatuses.includes(status)) {
          existing.completedJobs++;
        }

        technicianMap.set(mapKey, existing);
      }
    });

    console.log(`[Technician Performance Report] Technicians found: ${technicianMap.size}`);

    // Convert map to array
    const technicians = Array.from(technicianMap.values()).map((tech) => {
      const efficiency = tech.totalJobs > 0 ? Math.round((tech.completedJobs / tech.totalJobs) * 100) : 0;
      return {
        name: tech.name,
        completedJobs: tech.completedJobs,
        avgRating: 4.5, // Placeholder - would need ratings data
        efficiency: efficiency,
      };
    });

    // Sort by completed jobs (descending)
    const sortedTechnicians = technicians.sort((a, b) => b.completedJobs - a.completedJobs);

    console.log(`[Technician Performance Report] Report generated with ${sortedTechnicians.length} technicians`);

    return {
      technicians: sortedTechnicians,
    };
  } catch (error) {
    console.error('[Technician Performance Report] Error fetching report:', error);
    // Return empty data instead of throwing to prevent report generation from failing
    return {
      technicians: [],
    };
  }
};

/**
 * Fetch Inventory Report
 * @param serviceCenterId - Service center ID (for admin) or null (for SC manager to use context)
 * @param dateRange - Date range for filtering
 * @param useInventoryRepository - Whether to use inventoryRepository (admin) or partsMasterService (SC manager)
 */
export const fetchInventoryReport = async (
  serviceCenterId: string | null,
  dateRange: DateRange,
  useInventoryRepository: boolean = false
): Promise<ReportData['inventory']> => {
  let parts: Part[];

  if (useInventoryRepository && serviceCenterId) {
    // Admin: Fetch from inventory repository
    const inventoryItems = await inventoryRepository.getAll({ serviceCenterId });
    parts = inventoryItems.map((item: any) => ({
      id: item.id,
      partId: item.partId || item.id,
      partName: item.partName,
      partNumber: item.partNumber || '',
      category: item.category || '',
      stockQuantity: item.stockQuantity ?? item.quantity ?? 0,
      minStockLevel: item.minStockLevel ?? item.minLevel ?? 0,
      maxStockLevel: item.maxStockLevel ?? item.maxLevel ?? 0,
      unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice ?? 0),
      price: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice ?? 0),
    }));
  } else {
    // SC Manager: Fetch from parts master service
    parts = await partsMasterService.getAll();
  }

  // Fetch job cards to calculate part usage/movement
  let jobCards: any[] = [];
  if (serviceCenterId) {
    try {
      const jobCardsResponse = await apiClient.get(`/job-cards?serviceCenterId=${serviceCenterId}&expand=items`);
      jobCards = Array.isArray(jobCardsResponse.data)
        ? jobCardsResponse.data
        : jobCardsResponse.data?.data || [];
    } catch (error) {
      // Silently fail - usage calculation is optional
    }
  }

  // Filter job cards by date range
  const filteredJobCards = filterByDateRange(jobCards, dateRange);

  // Calculate part usage from job card items
  const partUsageMap = new Map<string, number>();
  filteredJobCards.forEach((jobCard: any) => {
    const items = jobCard.items || [];
    items.forEach((item: any) => {
      if (item.itemType === 'part' && item.partCode) {
        const partCode = item.partCode;
        const qty = item.qty || 0;
        partUsageMap.set(partCode, (partUsageMap.get(partCode) || 0) + qty);
      }
    });
  });

  const totalParts = parts.length;

  // Calculate low stock
  const lowStockCount = parts.filter((part: Part) => {
    const stockQty = part.stockQuantity ?? 0;
    const minLevel = part.minStockLevel ?? 0;
    return minLevel > 0 && stockQty <= minLevel;
  }).length;

  // Calculate total inventory value
  const totalValue = parts.reduce((sum: number, part: Part) => {
    const stockQty = part.stockQuantity ?? 0;
    const price = getPrice(part);
    return sum + (stockQty * price);
  }, 0);

  // Process all parts with usage data
  const partsWithUsage = parts.map((part: Part) => {
    const stockQty = part.stockQuantity ?? 0;
    const price = getPrice(part);
    const value = stockQty * price;
    const usageCount = partUsageMap.get(part.partNumber || part.partId || '') || 0;
    const minLevel = part.minStockLevel ?? 0;

    return {
      name: part.partName || "Unknown",
      partNumber: part.partNumber || part.partId || "N/A",
      category: part.category || "Uncategorized",
      quantity: stockQty,
      minStockLevel: minLevel,
      price: price,
      value: value,
      usageCount: usageCount,
      status: calculatePartStatus(stockQty, minLevel),
    };
  });

  // Top moving parts
  const topMovingParts = partsWithUsage
    .filter((p) => p.usageCount > 0)
    .sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return b.quantity - a.quantity;
    })
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      quantity: p.quantity,
      usageCount: p.usageCount,
      price: p.price,
      value: p.value,
    }));

  // Low moving parts
  const lowMovingParts = partsWithUsage
    .filter((p) => p.usageCount === 0 || p.usageCount <= 2)
    .sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return a.usageCount - b.usageCount;
      }
      return b.quantity - a.quantity;
    })
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      quantity: p.quantity,
      usageCount: p.usageCount,
      price: p.price,
      value: p.value,
    }));

  // All parts sorted by name
  const allParts = partsWithUsage.sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalParts,
    lowStockCount,
    totalValue,
    topMovingParts,
    lowMovingParts,
    allParts,
  };
};

