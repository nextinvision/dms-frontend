/**
 * Currency utilities
 */

export function formatCurrency(amount: number | string, currency: string = "INR"): string {
  const numAmount = (typeof amount === "string" ? parseFloat(amount.replace(/[₹,]/g, "")) : amount) || 0;

  if (currency === "INR") {
    return `₹${(numAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(numAmount || 0);
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[₹,]/g, "")) || 0;
}

export function formatCurrencyCompact(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount.replace(/[₹,]/g, "")) : amount;

  if (numAmount >= 10000000) {
    return `₹${(numAmount / 10000000).toFixed(2)}Cr`;
  }
  if (numAmount >= 100000) {
    return `₹${(numAmount / 100000).toFixed(2)}L`;
  }
  if (numAmount >= 1000) {
    return `₹${(numAmount / 1000).toFixed(2)}K`;
  }

  return formatCurrency(numAmount);
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function calculateDiscount(original: number, discounted: number): number {
  return original - discounted;
}

export function calculateDiscountPercentage(original: number, discounted: number): number {
  if (original === 0) return 0;
  return ((original - discounted) / original) * 100;
}

