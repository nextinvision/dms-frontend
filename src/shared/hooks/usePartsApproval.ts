/**
 * Hook for managing parts approval requests
 */

import { useState, useEffect, useCallback } from "react";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import type { JobCardPartsRequest } from "@/shared/types/jobcard-inventory.types";

const STORAGE_KEY = "jobCardPartsRequests";

export function usePartsApproval() {
  const [pendingRequests, setPendingRequests] = useState<JobCardPartsRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    // Refresh every 30 seconds to catch new requests
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = useCallback(() => {
    try {
      const allRequests = safeStorage.getItem<JobCardPartsRequest[]>(STORAGE_KEY, []);
      const pending = allRequests.filter((r) => r.status === "pending");
      setPendingRequests(pending);
    } catch (error) {
      console.error("Failed to load parts approval requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approve = useCallback(async (id: string, approvedBy: string, notes?: string) => {
    try {
      const allRequests = safeStorage.getItem<JobCardPartsRequest[]>(STORAGE_KEY, []);
      const index = allRequests.findIndex((r) => r.id === id);
      if (index === -1) {
        throw new Error("Request not found");
      }
      allRequests[index] = {
        ...allRequests[index],
        status: "approved",
        approvedBy,
        approvedAt: new Date().toISOString(),
        notes: notes || allRequests[index].notes,
      };
      safeStorage.setItem(STORAGE_KEY, allRequests);
      loadRequests();
    } catch (error) {
      console.error("Failed to approve request:", error);
      throw error;
    }
  }, [loadRequests]);

  const reject = useCallback(async (id: string, rejectedBy: string, notes?: string) => {
    try {
      const allRequests = safeStorage.getItem<JobCardPartsRequest[]>(STORAGE_KEY, []);
      const index = allRequests.findIndex((r) => r.id === id);
      if (index === -1) {
        throw new Error("Request not found");
      }
      allRequests[index] = {
        ...allRequests[index],
        status: "rejected",
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        notes: notes || allRequests[index].notes,
      };
      safeStorage.setItem(STORAGE_KEY, allRequests);
      loadRequests();
    } catch (error) {
      console.error("Failed to reject request:", error);
      throw error;
    }
  }, [loadRequests]);

  return {
    pendingRequests,
    isLoading,
    approve,
    reject,
    refresh: loadRequests,
  };
}

