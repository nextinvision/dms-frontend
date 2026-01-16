/**
 * Hook for sharing quotation via WhatsApp
 */

import { useState, useCallback, useEffect } from "react";
import { quotationsService } from "@/features/quotations/services/quotations.service";
import type { Quotation } from "@/shared/types/quotation.types";

export function useWhatsAppQuotationShare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareQuotation = useCallback(
    async (quotationId: string): Promise<{ success: boolean; whatsappUrl?: string; message?: string }> => {
      setLoading(true);
      setError(null);

      try {
        const result = await quotationsService.sendWhatsApp(quotationId);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send quotation via WhatsApp";
        setError(errorMessage);
        console.error("Error sharing quotation via WhatsApp:", err);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const [messageTemplate, setMessageTemplate] = useState<string>("Quotation {quotationNumber}\nTotal: ₹{totalAmount}\n\nView and confirm: {link}");

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.42evservice.cloud'}/system-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const settings = await res.json();
          const t = settings.find((s: any) => s.key === 'whatsapp.quotation_template');
          if (t) setMessageTemplate(t.value);
        }
      } catch (e) {
        console.error("Failed to fetch whatsapp template", e);
      }
    };
    fetchTemplate();
  }, []);

  const generateWhatsAppUrl = useCallback((quotation: Quotation): string => {
    let message = messageTemplate
      .replace(/{quotationNumber}/g, quotation.quotationNumber)
      .replace(/{totalAmount}/g, quotation.totalAmount.toLocaleString("en-IN"));

    // Add link if placeholder exists, otherwise append it
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/sc/quotations/${quotation.id}/confirm`;

    if (message.includes("{link}")) {
      message = message.replace(/{link}/g, link);
    } else {
      message += `\n\nView and confirm: ${link}`;
    }

    return `https://wa.me/${quotation.customer?.phone || ""}?text=${encodeURIComponent(message)}`;
  }, [messageTemplate]);

  return {
    shareQuotation,
    generateWhatsAppUrl,
    loading,
    error,
  };
}

