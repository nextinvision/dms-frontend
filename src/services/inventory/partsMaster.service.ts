/**
 * Parts Master Service - Business logic layer for parts master operations
 */

import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import type { Part, PartFormData } from "@/shared/types/inventory.types";
import { PARTS_MASTER_STORAGE_KEYS } from "@/app/inventory-manager/parts-master/storage.constants";

/**
 * Generate unique part ID
 */
function generatePartId(prefix: string = ""): string {
  return `PART-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}${prefix}`;
}

/**
 * Generate unique internal part ID
 */
function generateInternalId(prefix: string = ""): string {
  return `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${prefix}`;
}

/**
 * Map PartFormData to Part entity (only includes fields with values)
 */
function mapPartFormDataToPart(data: PartFormData, id: string): Part {
  // Generate partId if not provided
  const partId = data.partId?.trim() || generatePartId();
  const partNumber = data.partNumber?.trim() || "";
  const category = data.category?.trim() || "";

  // Calculate price from totalPrice if available, otherwise use purchasePrice or default
  const calculatedPrice = data.totalPrice
    ? data.totalPrice
    : (data.price || (data.purchasePrice ? parseFloat(data.purchasePrice) : 0));

  const part: Part = {
    id,
    partId, // Always set (auto-generated if not provided)
    partName: data.partName.trim(),
    partNumber, // Always set (empty string if not provided)
    category, // Always set (empty string if not provided)
    price: calculatedPrice,
    stockQuantity: data.stockQuantity || 0,
    minStockLevel: data.minStockLevel || 0,
    unit: data.unit || "piece",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // New fields from image
    ...(data.oemPartNumber && { oemPartNumber: data.oemPartNumber }),
    ...(data.originType && { originType: data.originType }),
    ...(data.purchasePrice && { purchasePrice: data.purchasePrice }),
    ...(data.description && { description: data.description }),
    // Basic Part Info
    ...(data.brandName && { brandName: data.brandName }),
    ...(data.variant && { variant: data.variant }),
    ...(data.partType && { partType: data.partType }),
    ...(data.color && { color: data.color }),
    // GST and Pricing
    ...(data.gstAmount && { gstAmount: data.gstAmount }),
    ...(data.gstRateInput && { gstRateInput: data.gstRateInput }),
    ...(data.pricePreGst && { pricePreGst: data.pricePreGst }),
    ...(data.gstRateOutput && { gstRateOutput: data.gstRateOutput }),
    // Labour Information
    ...(data.estimatedLabour && { estimatedLabour: data.estimatedLabour }),
    ...(data.estimatedLabourWorkTime && { estimatedLabourWorkTime: data.estimatedLabourWorkTime }),
    ...(data.labourRate && { labourRate: data.labourRate }),
    ...(data.labourGstRate && { labourGstRate: data.labourGstRate }),
    ...(data.labourPrice && { labourPrice: data.labourPrice }),
    // Calculated Totals
    ...(data.gstInput && { gstInput: data.gstInput }),
    ...(data.totalPrice && { totalPrice: data.totalPrice }),
    ...(data.totalGst && { totalGst: data.totalGst }),
    // High Value Part
    ...(data.highValuePart !== undefined && { highValuePart: data.highValuePart }),
    // Service Center
    ...(data.serviceCenterId && { serviceCenterId: data.serviceCenterId }),
  };

  return part;
}

class PartsMasterService {
  private storageKey = PARTS_MASTER_STORAGE_KEYS.PARTS_MASTER;

  async getAll(): Promise<Part[]> {
    const parts = safeStorage.getItem<Part[]>(this.storageKey, []);
    return parts;
  }

  async getById(id: string): Promise<Part | null> {
    const parts = await this.getAll();
    return parts.find((p) => p.id === id) || null;
  }

  /**
   * Find a duplicate part based on partId, partNumber, and partName
   * Returns the existing part if all three match
   */
  private findDuplicatePart(parts: Part[], partId: string, partNumber: string, partName: string): Part | null {
    return parts.find(
      (p) =>
        (p.partId || "") === partId &&
        p.partNumber === partNumber &&
        p.partName.toLowerCase().trim() === partName.toLowerCase().trim()
    ) || null;
  }

  async create(data: PartFormData): Promise<Part> {
    // Only require partName for identification
    if (!data.partName?.trim()) {
      throw new Error("Part Name is required to save a part");
    }

    const parts = await this.getAll();

    // Generate partId if not provided
    const partId = data.partId?.trim() || generatePartId();
    const partNumber = data.partNumber?.trim() || "";
    const partName = data.partName.trim();

    // Check if a duplicate part exists (same partId, partNumber, and partName)
    const duplicatePart = this.findDuplicatePart(parts, partId, partNumber, partName);

    if (duplicatePart) {
      // Merge: Add stock quantities together
      const index = parts.findIndex((p) => p.id === duplicatePart.id);
      const incomingStock = data.stockQuantity || 0;
      parts[index] = {
        ...duplicatePart,
        stockQuantity: duplicatePart.stockQuantity + incomingStock,
        updatedAt: new Date().toISOString(),
      };
      safeStorage.setItem(this.storageKey, parts);
      return parts[index];
    }

    // No duplicate found, create new part
    const newPart = mapPartFormDataToPart(data, generateInternalId());
    parts.push(newPart);
    safeStorage.setItem(this.storageKey, parts);
    return newPart;
  }

  async update(id: string, data: Partial<PartFormData>): Promise<Part> {
    const parts = await this.getAll();
    const index = parts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Part not found");
    }

    const existingPart = parts[index];

    // Only update fields that are provided in data, preserving existing values for everything else
    // Handle price calculation if totalPrice is provided
    const updatedPrice = data.totalPrice
      ? data.totalPrice
      : data.price !== undefined
        ? data.price
        : data.purchasePrice
          ? parseFloat(data.purchasePrice)
          : existingPart.price;

    parts[index] = {
      ...existingPart,
      // Only spread data fields that are actually defined to avoid overwriting with undefined
      ...(data.partId !== undefined && { partId: data.partId }),
      ...(data.partName !== undefined && { partName: data.partName }),
      ...(data.partNumber !== undefined && { partNumber: data.partNumber }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.oemPartNumber !== undefined && { oemPartNumber: data.oemPartNumber }),
      ...(data.originType !== undefined && { originType: data.originType }),
      ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
      ...(data.brandName !== undefined && { brandName: data.brandName }),
      ...(data.variant !== undefined && { variant: data.variant }),
      ...(data.partType !== undefined && { partType: data.partType }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.minStockLevel !== undefined && { minStockLevel: data.minStockLevel }),
      ...(data.maxStockLevel !== undefined && { maxStockLevel: data.maxStockLevel }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.pricePreGst !== undefined && { pricePreGst: data.pricePreGst }),
      ...(data.gstRateInput !== undefined && { gstRateInput: data.gstRateInput }),
      ...(data.gstInput !== undefined && { gstInput: data.gstInput }),
      ...(data.gstAmount !== undefined && { gstAmount: data.gstAmount }),
      ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
      ...(data.gstRate !== undefined && { gstRate: data.gstRate }),
      ...(data.gstRateOutput !== undefined && { gstRateOutput: data.gstRateOutput }),
      ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
      ...(data.totalGst !== undefined && { totalGst: data.totalGst }),
      ...(data.estimatedLabour !== undefined && { estimatedLabour: data.estimatedLabour }),
      ...(data.estimatedLabourWorkTime !== undefined && { estimatedLabourWorkTime: data.estimatedLabourWorkTime }),
      ...(data.labourRate !== undefined && { labourRate: data.labourRate }),
      ...(data.labourGstRate !== undefined && { labourGstRate: data.labourGstRate }),
      ...(data.labourPrice !== undefined && { labourPrice: data.labourPrice }),
      ...(data.highValuePart !== undefined && { highValuePart: data.highValuePart }),
      ...(data.serviceCenterId !== undefined && { serviceCenterId: data.serviceCenterId }),
      // Update price if any price-related field was provided
      ...(updatedPrice !== undefined && updatedPrice !== existingPart.price && { price: updatedPrice }),
      updatedAt: new Date().toISOString(),
    };

    safeStorage.setItem(this.storageKey, parts);
    return parts[index];
  }

  async delete(id: string): Promise<void> {
    const parts = await this.getAll();
    const filtered = parts.filter((p) => p.id !== id);
    safeStorage.setItem(this.storageKey, filtered);
  }

  async updateStock(id: string, quantity: number, operation: "add" | "subtract" | "set"): Promise<Part> {
    const parts = await this.getAll();
    const index = parts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Part not found");
    }
    const part = parts[index];
    let newQuantity = part.stockQuantity;
    if (operation === "add") {
      newQuantity += quantity;
    } else if (operation === "subtract") {
      newQuantity = Math.max(0, newQuantity - quantity);
    } else {
      newQuantity = quantity;
    }
    parts[index] = {
      ...part,
      stockQuantity: newQuantity,
      updatedAt: new Date().toISOString(),
    };
    safeStorage.setItem(this.storageKey, parts);
    return parts[index];
  }

  async bulkCreate(partsData: PartFormData[]): Promise<{ success: number; failed: number; errors: string[]; merged: number }> {
    const existingParts = await this.getAll();

    let success = 0;
    let failed = 0;
    let merged = 0;
    const errors: string[] = [];
    const newParts: Part[] = [];
    const partsToUpdate = new Map<string, Part>(); // Track parts to update by their ID

    partsData.forEach((data, index) => {
      // Validate required field (only partName is required)
      if (!data.partName?.trim()) {
        failed++;
        errors.push(`Row ${index + 2}: Part Name is required`);
        return;
      }

      // Generate partId if not provided
      const partId = data.partId?.trim() || generatePartId(`-${index}`);
      const partNumber = data.partNumber?.trim() || "";
      const partName = data.partName.trim();

      // Check if a duplicate part exists
      const duplicatePart = this.findDuplicatePart(existingParts, partId, partNumber, partName);

      if (duplicatePart) {
        // Merge: Add stock quantities together
        const incomingStock = data.stockQuantity || 0;
        const existingInMap = partsToUpdate.get(duplicatePart.id);
        const currentStock = existingInMap ? existingInMap.stockQuantity : duplicatePart.stockQuantity;

        partsToUpdate.set(duplicatePart.id, {
          ...duplicatePart,
          stockQuantity: currentStock + incomingStock,
          updatedAt: new Date().toISOString(),
        });
        merged++;
        success++;
        return;
      }

      // Create new part using utility function
      const newPart = mapPartFormDataToPart(data, generateInternalId(`-${index}`));
      newParts.push(newPart);
      success++;
    });

    // Apply updates to existing parts
    let updatedParts = existingParts.map((part) => {
      const update = partsToUpdate.get(part.id);
      return update || part;
    });

    // Add new parts
    if (newParts.length > 0) {
      updatedParts = [...updatedParts, ...newParts];
    }

    // Save all changes
    if (newParts.length > 0 || partsToUpdate.size > 0) {
      safeStorage.setItem(this.storageKey, updatedParts);
    }

    return { success, failed, errors, merged };
  }
}

export const partsMasterService = new PartsMasterService();

