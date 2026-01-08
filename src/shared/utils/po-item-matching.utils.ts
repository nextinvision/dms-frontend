/**
 * Utility functions for matching Purchase Order items with Parts Issue items
 */

export interface POItem {
  id: string;
  partId?: string;
  centralInventoryPartId?: string;
  partName?: string;
  partNumber?: string;
  hsnCode?: string;
}

export interface PartsIssueItem {
  partId?: string;
  fromStock?: string;
  partName?: string;
  partNumber?: string;
  hsnCode?: string;
}

/**
 * Matches a PO item to a parts issue item using multiple strategies
 * Returns true if any matching strategy succeeds
 * 
 * @param poItem - Purchase Order item
 * @param issueItem - Parts Issue item
 * @returns true if items match
 */
export function matchPOItemToIssueItem(
  poItem: POItem,
  issueItem: PartsIssueItem
): boolean {
  // Strategy 1: Match by centralInventoryPartId (most reliable)
  if (poItem.centralInventoryPartId && issueItem.partId && 
      poItem.centralInventoryPartId === issueItem.partId) {
    return true;
  }
  
  // Strategy 2: Match by partId
  if (poItem.partId && issueItem.partId && poItem.partId === issueItem.partId) {
    return true;
  }
  
  // Strategy 3: Match by fromStock (parts issue item's fromStock should match PO item's partId)
  if (poItem.partId && issueItem.fromStock && poItem.partId === issueItem.fromStock) {
    return true;
  }
  if (poItem.centralInventoryPartId && issueItem.fromStock && 
      poItem.centralInventoryPartId === issueItem.fromStock) {
    return true;
  }
  
  // Strategy 4: Match by partName (case-insensitive, trimmed)
  if (poItem.partName && issueItem.partName) {
    const poName = poItem.partName.toLowerCase().trim();
    const issueName = issueItem.partName.toLowerCase().trim();
    if (poName === issueName && poName !== '') {
      return true;
    }
  }
  
  // Strategy 5: Match by partNumber (case-insensitive, trimmed)
  if (poItem.partNumber && issueItem.partNumber) {
    const poNumber = poItem.partNumber.toLowerCase().trim();
    const issueNumber = issueItem.partNumber.toLowerCase().trim();
    if (poNumber === issueNumber && poNumber !== '') {
      return true;
    }
  }
  
  // Strategy 6: Match by HSN code as fallback
  if (poItem.hsnCode && issueItem.hsnCode && 
      poItem.hsnCode.toLowerCase().trim() === issueItem.hsnCode.toLowerCase().trim()) {
    return true;
  }
  
  return false;
}

/**
 * Finds a matching PO item for a given parts issue item
 * 
 * @param issueItem - Parts Issue item to match
 * @param poItems - Array of Purchase Order items to search
 * @returns Matching PO item or undefined
 */
export function findMatchingPOItem(
  issueItem: PartsIssueItem,
  poItems: POItem[]
): POItem | undefined {
  return poItems.find(poItem => matchPOItemToIssueItem(poItem, issueItem));
}

