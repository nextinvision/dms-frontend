/**
 * Utility functions for calculating Purchase Order fulfillment and issued quantities
 */

import type { PartsIssueItem, PurchaseOrderItem } from "@/shared/types/central-inventory.types";
import { findMatchingPOItem } from "./po-item-matching.utils";

/**
 * Calculates the issued quantity from a parts issue item
 * Dispatch records are the source of truth - they represent what was actually dispatched
 * 
 * @param issueItem - Parts issue item with dispatch records
 * @returns The total issued quantity (from dispatches or issuedQty field)
 */
export function calculateIssuedQuantity(issueItem: PartsIssueItem): number {
  // If dispatch records are available, use them (most accurate)
  if (issueItem.dispatches && Array.isArray(issueItem.dispatches) && issueItem.dispatches.length > 0) {
    // Sum all dispatch quantities - this is the actual issued quantity
    return issueItem.dispatches.reduce((sum: number, dispatch: any) => {
      return sum + (Number(dispatch.quantity) || 0);
    }, 0);
  }
  
  // Fallback to issuedQty field if no dispatch records exist
  // This handles cases where parts were issued before dispatch tracking was added
  return Number(issueItem.issuedQty) || 0;
}

/**
 * Calculates issued quantities for all items in a purchase order
 * by aggregating quantities from related parts issues
 * 
 * @param poItems - Purchase order items
 * @param relatedIssues - Related parts issues (filtered by purchaseOrderId)
 * @returns Map of PO item ID to total issued quantity
 */
export function calculatePOItemIssuedQuantities(
  poItems: PurchaseOrderItem[],
  relatedIssues: Array<{ items: PartsIssueItem[] }>
): Map<string, number> {
  const itemIssuedQty = new Map<string, number>();
  
  relatedIssues.forEach(issue => {
    issue.items.forEach(issueItem => {
      // Use utility function for matching
      const poItem = findMatchingPOItem(issueItem, poItems);
      
      if (poItem) {
        const currentIssued = itemIssuedQty.get(poItem.id) || 0;
        const issueQty = calculateIssuedQuantity(issueItem);
        itemIssuedQty.set(poItem.id, currentIssued + issueQty);
      }
    });
  });
  
  return itemIssuedQty;
}

/**
 * Calculates remaining quantity for a purchase order item
 * 
 * @param requestedQty - Requested quantity from PO
 * @param issuedQty - Total issued quantity (from parts issues)
 * @returns Remaining quantity (max 0 if negative)
 */
export function calculateRemainingQuantity(
  requestedQty: number,
  issuedQty: number
): number {
  return Math.max(0, requestedQty - issuedQty);
}

/**
 * Checks if a parts issue item has a closed sub-PO (ending with 'C')
 * 
 * @param issueItem - Parts issue item
 * @returns true if sub-PO is closed
 */
export function hasClosedSubPo(issueItem: PartsIssueItem): boolean {
  return (
    (issueItem.subPoNumber && (issueItem.subPoNumber.endsWith('C') || issueItem.subPoNumber.includes('_C'))) ||
    (issueItem.dispatches && Array.isArray(issueItem.dispatches) && 
     issueItem.dispatches.some((d: any) => 
       d.subPoNumber && (d.subPoNumber.endsWith('C') || d.subPoNumber.includes('_C'))
     ))
  );
}

