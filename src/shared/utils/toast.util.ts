/**
 * Toast utility functions
 * This file provides helper functions to replace alert() calls with toast messages
 */

import { useToast as useToastHook } from "@/contexts/ToastContext";

/**
 * Hook wrapper that provides toast functions
 * Use this in components that need to show toast messages
 */
export function useToast() {
  return useToastHook();
}

/**
 * Helper function to determine toast type based on message content
 * This can be used for automatic conversion from alert() to toast
 */
export function getToastType(message: string): "success" | "error" | "warning" | "info" {
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes("success") ||
    lowerMessage.includes("approved") ||
    lowerMessage.includes("saved") ||
    lowerMessage.includes("created") ||
    lowerMessage.includes("updated") ||
    lowerMessage.includes("deleted") ||
    lowerMessage.includes("sent") ||
    lowerMessage.includes("assigned")
  ) {
    return "success";
  }
  
  if (
    lowerMessage.includes("error") ||
    lowerMessage.includes("failed") ||
    lowerMessage.includes("rejected") ||
    lowerMessage.includes("denied") ||
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("not found")
  ) {
    return "error";
  }
  
  if (
    lowerMessage.includes("warning") ||
    lowerMessage.includes("please") ||
    lowerMessage.includes("required") ||
    lowerMessage.includes("missing")
  ) {
    return "warning";
  }
  
  return "info";
}

