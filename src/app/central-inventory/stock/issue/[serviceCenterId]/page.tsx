"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Building } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";
import { centralInventoryRepository } from "@/core/repositories/central-inventory.repository";
import { PartsIssueForm } from "@/app/central-inventory/components/PartsIssueForm";
import type {
  ServiceCenterInfo,
  CentralStock,
  PurchaseOrder,
  PartsIssueFormData,
} from "@/shared/types/central-inventory.types";

export default function StockIssuePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const serviceCenterId = params.serviceCenterId as string;
  const poId = searchParams.get('poId');
  const itemsParam = searchParams.get('items');

  const [serviceCenter, setServiceCenter] = useState<ServiceCenterInfo | null>(null);
  const [availableStock, setAvailableStock] = useState<CentralStock[]>([]);
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [initialItems, setInitialItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch service center info from purchase order
        let sc: ServiceCenterInfo | null = null;
        if (poId) {
          // If coming from purchase order, get service center from PO
          const po = await centralInventoryRepository.getPurchaseOrderById(poId);
          if (po && po.serviceCenterId) {
            sc = {
              id: po.serviceCenterId,
              name: po.serviceCenterName,
              location: `${po.serviceCenterCity || ''} ${po.serviceCenterState || ''}`.trim(),
              contactPerson: po.requestedBy,
              contactEmail: po.serviceCenterEmail,
              contactPhone: po.serviceCenterPhone,
              active: true,
            };
          }
        } else {
          // If no PO ID, create basic service center info from serviceCenterId
          sc = {
            id: serviceCenterId,
            name: 'Service Center',
            location: '',
            active: true,
          };
        }
        
        if (!sc) {
          showError("Service center information not found");
          router.push("/central-inventory/purchase-orders");
          return;
        }
        setServiceCenter(sc);

        // Fetch available stock
        const stock = await centralInventoryRepository.getAllStock();
        setAvailableStock(stock.filter((s) => s.stockQuantity > 0));

        // Parse initial items from query params if available
        if (itemsParam) {
          try {
            const items = JSON.parse(decodeURIComponent(itemsParam));
            // Map items to match PartsIssueForm format
            const mappedItems = items.map((item: any) => {
              // Find matching stock item
              const stockItem = stock.find(s => s.id === item.partId || s.partNumber === item.partNumber);
              return {
                partId: item.partId || stockItem?.id || '',
                partName: item.partName || stockItem?.partName || '',
                hsnCode: stockItem?.hsnCode || '',
                fromStock: stockItem?.id || item.partId || '',
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || stockItem?.unitPrice || 0,
                availableQty: stockItem?.stockQuantity || 0,
              };
            }).filter((item: any) => item.fromStock && item.quantity > 0);
            setInitialItems(mappedItems);
          } catch (e) {
            console.error("Failed to parse items from query params:", e);
          }
        }

        // Fetch purchase orders for this service center if needed
        if (poId) {
          const po = await centralInventoryRepository.getPurchaseOrderById(poId);
          if (po) {
            setAvailablePOs([po]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceCenterId) {
      fetchData();
    }
  }, [serviceCenterId, poId, itemsParam, router, showError]);

  const handleSubmit = async (formData: PartsIssueFormData) => {
    setIsSubmitting(true);
    try {
      const userInfo = typeof window !== "undefined" 
        ? JSON.parse(localStorage.getItem("userInfo") || '{"name": "Central Inventory Manager"}')
        : { name: "Central Inventory Manager" };
      
      // Create parts issue (will be pending admin approval)
      const issue = await centralInventoryRepository.createPartsIssue(
        formData,
        userInfo.name || "Central Inventory Manager"
      );
      
      showSuccess("Parts issue created successfully! This issue is now pending admin approval before parts can be dispatched.");
      setTimeout(() => {
        router.push("/central-inventory/parts-issue-requests");
      }, 2000);
    } catch (error) {
      console.error("Failed to create parts issue:", error);
      showError(error instanceof Error ? error.message : "Failed to create parts issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/central-inventory/stock/issue");
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!serviceCenter) {
    return null;
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Building className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">Issue Parts</h1>
          </div>
          <p className="text-gray-500">
            Issue parts from central warehouse to {serviceCenter.name}
          </p>
        </div>

        <PartsIssueForm
          serviceCenter={serviceCenter}
          availableStock={availableStock}
          availablePurchaseOrders={availablePOs}
          initialItems={initialItems}
          initialPurchaseOrderId={poId || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
