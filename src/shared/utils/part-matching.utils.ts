/**
 * Utility functions for matching parts in Central Inventory
 */

export interface StockItem {
  id: string;
  partId?: string; // Some stock items have a separate partId field (e.g., CentralStock)
  partNumber?: string | null;
  partName?: string | null;
  stockQuantity?: number; // Some items use stockQuantity instead of currentQty
  currentQty?: number; // Some items use currentQty
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
 * Finds a matching part in the stock array by comparing partId, partNumber, and partName
 * Priority: partId > partNumber > partName (with fallbacks)
 * 
 * @param item - Item with partId, partNumber, and/or partName to match
 * @param stock - Array of stock items to search
 * @returns PartMatchResult with matched status and matched part details
 */
export function findMatchingPartInStock<T extends StockItem = StockItem>(
  item: { partId?: string | null; partNumber?: string | null; partName?: string | null },
  stock: T[]
): PartMatchResult<T> {
  // Priority 1: Match by partId if available (most reliable)
  if (item.partId) {
    // Try matching against stock.id (stock entry ID) first
    let matchById = stock.find(s => s.id === item.partId);
    
    // If no match, try matching against stock.partId (part master ID) if it exists
    // This handles cases like CentralStock where both id and partId exist
    if (!matchById) {
      matchById = stock.find(s => s.partId === item.partId);
    }
    
    if (matchById) {
      console.log(`[Part Matching] Matched by partId ${item.partId}:`, matchById);
      return {
        matched: true,
        matchedPartId: matchById.id,
        matchedPart: matchById,
      };
    } else {
      console.log(`[Part Matching] No match found for partId ${item.partId}. Available stock IDs:`, 
        stock.map(s => ({ id: s.id, partId: s.partId, partName: s.partName })).slice(0, 5)
      );
    }
  }
  
  // Priority 2: Match by partNumber if available (and partName if both provided)
  if (item.partNumber) {
    // Try exact match on partNumber first
    let matchingPart = stock.find(s => {
      if (!s.partNumber) return false;
      const stockPartNum = s.partNumber.toLowerCase().trim();
      const itemPartNum = item.partNumber.toLowerCase().trim();
      return stockPartNum === itemPartNum;
    });
    
    // If partName is also provided, prefer matches that also have matching partName
    if (item.partName && matchingPart) {
      const itemPartName = item.partName.toLowerCase().trim();
      const matchingPartName = matchingPart.partName?.toLowerCase().trim();
      if (matchingPartName && matchingPartName === itemPartName) {
        // Both partNumber and partName match - perfect match
        return {
          matched: true,
          matchedPartId: matchingPart.id,
          matchedPart: matchingPart,
        };
      }
      // PartNumber matches but partName doesn't - still use it as fallback
      return {
        matched: true,
        matchedPartId: matchingPart.id,
        matchedPart: matchingPart,
      };
    }
    
    // Return partNumber match even if partName doesn't match
    if (matchingPart) {
      return {
        matched: true,
        matchedPartId: matchingPart.id,
        matchedPart: matchingPart,
      };
    }
  }
  
  // Priority 3: Match by partName alone (if partNumber not available or didn't match)
  if (item.partName) {
    const itemPartName = item.partName.toLowerCase().trim();
    
    // First try exact match
    let matchingPart = stock.find(s => {
      if (!s.partName) return false;
      const stockPartName = s.partName.toLowerCase().trim();
      return stockPartName === itemPartName;
    });
    
    // If no exact match, try partial/fuzzy matching
    // This handles cases like "Cabin Air Filter - HEPA" matching "Cabin Air Filter"
    if (!matchingPart) {
      matchingPart = stock.find(s => {
        if (!s.partName) return false;
        const stockPartName = s.partName.toLowerCase().trim();
        
        // Check if item name starts with stock name (e.g., "Cabin Air Filter - HEPA" starts with "Cabin Air Filter")
        if (itemPartName.startsWith(stockPartName)) {
          return true;
        }
        
        // Check if stock name starts with item name (e.g., "Cabin Air Filter" starts with "Cabin Air Filter - HEPA" - reversed)
        if (stockPartName.startsWith(itemPartName)) {
          return true;
        }
        
        // Check if either contains the other (for more flexible matching)
        if (itemPartName.includes(stockPartName) || stockPartName.includes(itemPartName)) {
          return true;
        }
        
        return false;
      });
    }
    
    if (matchingPart) {
      console.log(`[Part Matching] Matched by partName "${item.partName}" to "${matchingPart.partName}":`, matchingPart);
      return {
        matched: true,
        matchedPartId: matchingPart.id,
        matchedPart: matchingPart,
      };
    } else {
      console.log(`[Part Matching] No match found for partName "${item.partName}". Available stock part names:`, 
        stock.map(s => s.partName).filter(Boolean).slice(0, 10)
      );
    }
  }
  
  // No match found
  return {
    matched: false,
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

