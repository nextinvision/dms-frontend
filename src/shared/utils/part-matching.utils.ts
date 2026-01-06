/**
 * Utility functions for matching parts in Central Inventory
 */

export interface StockItem {
  id: string;
  partNumber?: string | null;
  partName?: string | null;
  [key: string]: any; // Allow additional properties
}

export interface PartMatchResult<T extends StockItem = StockItem> {
  matched: boolean;
  matchedPartId?: string;
  matchedPart?: T;
}

/**
 * Checks if a part matches in Central Inventory by comparing both partNumber and partName
 * Both fields must match exactly (case-insensitive, trimmed) for validation to pass
 * 
 * @param itemPartNumber - Part number from the item
 * @param itemPartName - Part name from the item
 * @param stockPartNumber - Part number from stock
 * @param stockPartName - Part name from stock
 * @returns true if both partNumber and partName match
 */
export function matchesPartExactly(
  itemPartNumber: string | undefined | null,
  itemPartName: string | undefined | null,
  stockPartNumber: string | undefined | null,
  stockPartName: string | undefined | null
): boolean {
  // Both partNumber and partName must be provided and match
  const partNumberMatch = itemPartNumber && stockPartNumber
    ? stockPartNumber.toLowerCase().trim() === itemPartNumber.toLowerCase().trim()
    : false;
  
  const partNameMatch = itemPartName && stockPartName
    ? stockPartName.toLowerCase().trim() === itemPartName.toLowerCase().trim()
    : false;
  
  // Both must match for validation to pass
  return partNumberMatch && partNameMatch;
}

/**
 * Finds a matching part in the stock array by comparing both partNumber and partName
 * 
 * @param item - Item with partNumber and partName to match
 * @param stock - Array of stock items to search
 * @returns PartMatchResult with matched status and matched part details
 */
export function findMatchingPartInStock<T extends StockItem = StockItem>(
  item: { partNumber?: string | null; partName?: string | null },
  stock: T[]
): PartMatchResult<T> {
  const matchingPart = stock.find(s => 
    matchesPartExactly(item.partNumber, item.partName, s.partNumber, s.partName)
  );
  
  return {
    matched: !!matchingPart,
    matchedPartId: matchingPart?.id,
    matchedPart: matchingPart || undefined,
  };
}

/**
 * Validates multiple items against stock and separates them into valid and invalid
 * 
 * @param items - Array of items to validate
 * @param stock - Array of stock items to match against
 * @returns Object with validItems and invalidItems arrays
 */
export function validateItemsAgainstStock<
  T extends { partNumber?: string | null; partName?: string | null },
  S extends StockItem = StockItem
>(
  items: T[],
  stock: S[]
): {
  validItems: Array<T & { matchedPartId: string }>;
  invalidItems: T[];
} {
  const validItems: Array<T & { matchedPartId: string }> = [];
  const invalidItems: T[] = [];
  
  for (const item of items) {
    const match = findMatchingPartInStock(item, stock);
    if (match.matched && match.matchedPartId) {
      validItems.push({ ...item, matchedPartId: match.matchedPartId });
    } else {
      invalidItems.push(item);
    }
  }
  
  return { validItems, invalidItems };
}

