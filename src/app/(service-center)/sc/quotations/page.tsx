"use client";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Car,
  Building2,
  Calculator,
  FileCheck,
  ArrowRight,
  X,
  Trash2,
  Edit,
  Download,
  Loader2,
  Printer,
  MessageCircle,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useRole } from "@/shared/hooks";
import { useToast } from "@/core/contexts/ToastContext";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { useSearchParams } from "next/navigation";
import type {
  Quotation,
  QuotationItem,
  QuotationFilterType,
  Insurer,
  NoteTemplate,
  CreateQuotationForm,
  CustomerWithVehicles,
  Vehicle,
} from "@/shared/types";
import { useCustomerSearch } from "../../../../hooks/api";

import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import type { CheckInSlipFormData } from "@/shared/types/check-in-slip.types";
import { CheckInSlipForm } from "../components/check-in-slip/CheckInSlipForm";
import CheckInSlip, { generateCheckInSlipNumber, type CheckInSlipData } from "@/components/check-in-slip/CheckInSlip";
import type { EnhancedCheckInSlipData } from "@/shared/types/check-in-slip.types";
import { convertCheckInSlipFormToData } from "../components/check-in-slip/utils";
import { SERVICE_CENTER_CODE_MAP } from "../appointments/constants";
import { generateQuotationNumber } from "@/shared/utils/quotation.utils";
import { getServiceCenterCode, normalizeServiceCenterId } from "@/shared/utils/service-center.utils";
import { CreateQuotationModal } from "../components/quotations/CreateQuotationModal";
import { ViewQuotationModal } from "../components/quotations/ViewQuotationModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationRepository } from "@/core/repositories/quotation.repository";
import { serviceCenterRepository } from "@/core/repositories/service-center.repository";
import { jobCardRepository } from "@/core/repositories/job-card.repository";
import { appointmentRepository } from "@/core/repositories/appointment.repository";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";

import { defaultInsurers, defaultNoteTemplates } from "./defaults";



const createEmptyCustomer = (): CustomerWithVehicles => ({
  id: "",
  customerNumber: "",
  name: "Customer",
  phone: "",
  createdAt: new Date().toISOString(),
  vehicles: [],
});



function QuotationsContent() {
  const { userInfo, userRole } = useRole();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const isServiceAdvisor = userRole === "service_advisor";
  const isServiceManager = userRole === "sc_manager";
  const searchParams = useSearchParams();
  const fromAppointment = searchParams.get("fromAppointment") === "true";
  const fromJobCard = searchParams.get("fromJobCard") === "true";
  const jobCardIdParam = searchParams.get("jobCardId");

  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
  const [activeServiceCenterId, setActiveServiceCenterId] = useState<string>(() =>
    normalizeServiceCenterId(serviceCenterContext.serviceCenterId)
  );
  const [activeCustomerId, setActiveCustomerId] = useState<string>("");

  const queryClient = useQueryClient();
  const { data: quotations = [], isLoading: isLoadingQuotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => quotationRepository.getAll(),
  });

  const { data: serviceCenters = [] } = useQuery({
    queryKey: ['service-centers'],
    queryFn: () => serviceCenterRepository.getAll(),
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: Partial<Quotation>) => quotationRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    }
  });

  const updateQuotationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Quotation> }) => quotationRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    }
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: (id: string) => quotationRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    }
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filter, setFilter] = useState<QuotationFilterType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showCheckInSlipModal, setShowCheckInSlipModal] = useState<boolean>(false);
  const [checkInSlipData, setCheckInSlipData] = useState<CheckInSlipData | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    type: "warning",
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, type: "danger" | "warning" | "info" | "success" = "warning") => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
      type,
    });
  };

  // Form state
  const [form, setForm] = useState<CreateQuotationForm>({
    customerId: "",
    vehicleId: "",
    quotationNumber: "",
    documentType: "Quotation",
    quotationDate: new Date().toISOString().split("T")[0],
    validUntilDays: 30,
    hasInsurance: false,
    insurerId: "",
    insuranceCompanyName: "",
    insuranceStartDate: "",
    insuranceEndDate: "",
    items: [],
    discount: 0,
    notes: "",
    batterySerialNumber: "",
    customNotes: "",
    noteTemplateId: "",
    vehicleLocation: undefined,
    appointmentId: "",
    jobCardId: "",
  });

  // Data for dropdowns
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplate[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVehicles | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");
  const [checkInSlipFormData, setCheckInSlipFormData] = useState<CheckInSlipFormData>({} as CheckInSlipFormData);
  const customerSearch = useCustomerSearch();
  const customerSearchResults = customerSearch.results as CustomerWithVehicles[];
  const performCustomerSearch = customerSearch.search;
  const clearCustomerSearch = customerSearch.clear;

  // Load insurers from localStorage or use mock data
  useEffect(() => {
    const storedInsurers = safeStorage.getItem<Insurer[]>("insurers", []);
    if (storedInsurers.length > 0) {
      setInsurers(storedInsurers);
    } else {
      setInsurers(defaultInsurers);
      safeStorage.setItem("insurers", defaultInsurers);
    }
  }, []);

  // Load note templates from localStorage or use mock data
  useEffect(() => {
    const storedTemplates = safeStorage.getItem<NoteTemplate[]>("noteTemplates", []);
    if (storedTemplates.length > 0) {
      setNoteTemplates(storedTemplates);
    } else {
      setNoteTemplates(defaultNoteTemplates);
      safeStorage.setItem("noteTemplates", defaultNoteTemplates);
    }
  }, []);

  // Handle customer search
  useEffect(() => {
    if (customerSearchQuery && customerSearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        performCustomerSearch(customerSearchQuery, "auto");
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      clearCustomerSearch();
    }
  }, [customerSearchQuery, performCustomerSearch, clearCustomerSearch]);

  // Handle pre-filling form from appointment data
  useEffect(() => {
    if (fromAppointment && typeof window !== "undefined") {
      const quotationData = safeStorage.getItem<any>("pendingQuotationFromAppointment", null);

      if (quotationData && quotationData.appointmentData) {
        const appointmentData = quotationData.appointmentData;
        const normalizedCenterId = normalizeServiceCenterId(
          quotationData.serviceCenterId ?? serviceCenterContext.serviceCenterId
        );
        setActiveServiceCenterId(normalizedCenterId);

        // Find customer by phone or name
        const findCustomer = async () => {
          try {
            await performCustomerSearch(quotationData.customerName || quotationData.phone, "auto");
            // Wait a bit for search results
            setTimeout(() => {
              const customers = customerSearchResults;
              const customer = customers.find(
                (c) => c.phone === quotationData.phone || c.name === quotationData.customerName
              );

              if (customer) {
                setSelectedCustomer(customer);
                setActiveCustomerId(customer.id?.toString() || "");

                // Extract insurance data from appointment
                const insuranceCompanyName = appointmentData.insuranceCompanyName || "";
                const insuranceStartDate = appointmentData.insuranceStartDate || "";
                const insuranceEndDate = appointmentData.insuranceEndDate || "";
                const hasInsuranceData = !!(insuranceCompanyName || insuranceStartDate || insuranceEndDate);

                // Try to match insurance company name to insurer list
                let matchedInsurerId = "";
                if (insuranceCompanyName && insurers.length > 0) {
                  const matchedInsurer = insurers.find((insurer) => {
                    const insurerNameLower = insurer.name.toLowerCase().trim();
                    const companyNameLower = insuranceCompanyName.toLowerCase().trim();
                    return (
                      insurerNameLower === companyNameLower ||
                      insurerNameLower.includes(companyNameLower) ||
                      companyNameLower.includes(insurerNameLower)
                    );
                  });
                  if (matchedInsurer) {
                    matchedInsurerId = matchedInsurer.id;
                  }
                }

                setForm((prev) => ({
                  ...prev,
                  customerId: String(customer.id),
                  documentType: "Quotation",
                  notes: appointmentData.customerComplaintIssue || "",
                  customNotes: appointmentData.previousServiceHistory || "",
                  batterySerialNumber: appointmentData.batterySerialNumber || appointmentData.chargerSerialNumber || "",
                  hasInsurance: hasInsuranceData,
                  insurerId: matchedInsurerId,
                  insuranceCompanyName: insuranceCompanyName || "",
                  insuranceStartDate: insuranceStartDate || "",
                  insuranceEndDate: insuranceEndDate || "",
                  appointmentId: appointmentData.id || quotationData.appointmentId,
                }));

                // Find matching vehicle
                if (customer.vehicles && customer.vehicles.length > 0) {
                  const vehicle = customer.vehicles.find(
                    (v) => v.registration === appointmentData.registrationNumber
                  ) || customer.vehicles[0];

                  if (vehicle) {
                    setForm((prev) => ({
                      ...prev,
                      vehicleId: String(vehicle.id),
                    }));
                  }
                }

                // Open create modal
                setShowCreateModal(true);

                // Clear the stored data
                safeStorage.removeItem("pendingQuotationFromAppointment");
              }
              else if (quotationData.customerId) {
                const decodedCustomerId = String(quotationData.customerId);
                setForm((prev) => ({ ...prev, customerId: decodedCustomerId }));
                setActiveCustomerId(decodedCustomerId);
                setShowCreateModal(true);
                safeStorage.removeItem("pendingQuotationFromAppointment");
              }
            }, 500);
          } catch (error) {
            console.error("Error finding customer:", error);
          }
        };

        findCustomer();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAppointment]);

  // Handle pre-filling form from job card data
  useEffect(() => {
    if (fromJobCard && typeof window !== "undefined") {
      const quotationData = safeStorage.getItem<any>("pendingQuotationFromJobCard", null);

      if (quotationData && quotationData.jobCardData) {
        const jobCard = quotationData.jobCardData;
        const normalizedCenterId = normalizeServiceCenterId(
          quotationData.serviceCenterId ?? serviceCenterContext.serviceCenterId
        );
        setActiveServiceCenterId(normalizedCenterId);

        // Find customer by ID or phone
        const findCustomer = async () => {
          try {
            if (quotationData.customerId) {
              await performCustomerSearch(quotationData.customerId, "auto");
            } else if (jobCard.part1?.mobilePrimary) {
              await performCustomerSearch(jobCard.part1.mobilePrimary, "auto");
            }

            // Wait a bit for search results
            setTimeout(() => {
              const customers = customerSearchResults;
              const customer = customers.find(
                (c) => c.id === quotationData.customerId ||
                  c.phone === jobCard.part1?.mobilePrimary ||
                  c.name === quotationData.customerName
              );

              if (customer) {
                setSelectedCustomer(customer);
                setActiveCustomerId(customer.id?.toString() || "");

                // Extract insurance data from job card PART 1
                const insuranceCompanyName = jobCard.part1?.insuranceCompanyName || "";
                const insuranceStartDate = jobCard.part1?.insuranceStartDate || "";
                const insuranceEndDate = jobCard.part1?.insuranceEndDate || "";
                const hasInsuranceData = !!(insuranceCompanyName || insuranceStartDate || insuranceEndDate);

                // Try to match insurance company name to insurer list
                let matchedInsurerId = "";
                if (insuranceCompanyName && insurers.length > 0) {
                  const matchedInsurer = insurers.find((insurer) => {
                    const insurerNameLower = insurer.name.toLowerCase().trim();
                    const companyNameLower = insuranceCompanyName.toLowerCase().trim();
                    return (
                      insurerNameLower === companyNameLower ||
                      insurerNameLower.includes(companyNameLower) ||
                      companyNameLower.includes(insurerNameLower)
                    );
                  });
                  if (matchedInsurer) {
                    matchedInsurerId = matchedInsurer.id;
                  }
                }

                setForm((prev) => ({
                  ...prev,
                  customerId: String(customer.id),
                  documentType: "Quotation",
                  notes: jobCard.part1?.customerFeedback || jobCard.description || "",
                  customNotes: jobCard.part1?.technicianObservation || "",
                  batterySerialNumber: jobCard.part1?.batterySerialNumber || "",
                  hasInsurance: hasInsuranceData,
                  insurerId: matchedInsurerId,
                  insuranceCompanyName: insuranceCompanyName || "",
                  insuranceStartDate: insuranceStartDate || "",
                  insuranceEndDate: insuranceEndDate || "",
                  jobCardId: jobCard.id || jobCardIdParam,
                  appointmentId: jobCard.appointmentId,
                  items: jobCard.part2Items?.map((item: any, index: number) => {
                    const gstRate = (item.gstPercent || 18) / 100;
                    const preGstRate = item.rate || (item.amount / (1 + gstRate)) || 0;
                    const amountInclGst = item.amount || (preGstRate * (1 + gstRate));

                    return {
                      serialNumber: index + 1,
                      partName: item.partName || "Service Item",
                      partNumber: item.partCode || undefined,
                      quantity: item.qty || 1,
                      rate: preGstRate,
                      gstPercent: item.gstPercent || 18,
                      amount: amountInclGst * (item.qty || 1)
                    };
                  }) || [],
                }));

                // Find matching vehicle
                if (customer.vehicles && customer.vehicles.length > 0) {
                  const vehicle = customer.vehicles.find(
                    (v) => v.registration === jobCard.part1?.registrationNumber ||
                      v.id === quotationData.vehicleId
                  ) || customer.vehicles[0];

                  if (vehicle) {
                    setForm((prev) => ({
                      ...prev,
                      vehicleId: String(vehicle.id),
                    }));
                  }
                }

                // Open create modal
                setShowCreateModal(true);

                // Clear the stored data
                safeStorage.removeItem("pendingQuotationFromJobCard");
              } else if (quotationData.customerId) {
                const decodedCustomerId = String(quotationData.customerId);
                setForm((prev) => ({ ...prev, customerId: decodedCustomerId }));
                setActiveCustomerId(decodedCustomerId);
                setShowCreateModal(true);
                safeStorage.removeItem("pendingQuotationFromJobCard");
              }
            }, 500);
          } catch (error) {
            console.error("Error finding customer from job card:", error);
          }
        };

        findCustomer();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromJobCard, jobCardIdParam]);

  // Auto-open quotation modal when redirected with highlight parameter
  useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    if (highlightParam && quotations.length > 0) {
      const quotationToHighlight = quotations.find(
        (q) => q.id === highlightParam || q.quotationNumber === highlightParam
      );

      if (quotationToHighlight) {
        setSelectedQuotation(quotationToHighlight);
        setShowViewModal(true);

        // Clean up URL by removing the highlight parameter
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("highlight");
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [searchParams, quotations]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    const discount = form.discount || 0;

    // First pass to get subtotal
    form.items.forEach(item => {
      subtotal += (item.rate || 0) * (item.quantity || 0);
    });

    const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    const preGstAmount = subtotal - discount;

    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;

    // Determine if IGST or CGST/SGST should be applied
    const customerState = selectedCustomer?.address?.toLowerCase().trim();
    const serviceCenter = serviceCenters.find(
      (center) => normalizeServiceCenterId(center.id) === normalizeServiceCenterId(activeServiceCenterId || serviceCenterContext.serviceCenterId)
    );
    const scState = serviceCenter?.state?.toLowerCase().trim();
    const isInterState = customerState && scState && !customerState.includes(scState) && !scState.includes(customerState);

    const itemsWithAmounts = form.items.map((item, index) => {
      const itemSubtotal = (item.rate || 0) * (item.quantity || 0);
      const itemDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
      const itemTaxableValue = itemSubtotal - itemDiscount;

      const itemGstPercent = item.gstPercent || 18;
      const itemTax = itemTaxableValue * (itemGstPercent / 100);
      totalTax += itemTax;

      if (isInterState) {
        totalIgst += itemTax;
      } else {
        totalCgst += itemTax / 2;
        totalSgst += itemTax / 2;
      }

      const amountInclGst = itemSubtotal + (itemSubtotal * (itemGstPercent / 100)); // Standard display amount per item

      return {
        ...item,
        amount: amountInclGst,
        serialNumber: item.serialNumber || index + 1
      };
    });

    const calculatedPreGst = subtotal - discount;
    const totalAmount = calculatedPreGst + totalTax;

    return {
      subtotal,
      discount,
      discountPercent,
      preGstAmount: calculatedPreGst,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalAmount,
      items: itemsWithAmounts
    };
  }, [form.items, form.discount, selectedCustomer, serviceCenterContext]);

  const totals = calculateTotals();

  const validateQuotationForm = () => {
    if (!form.customerId) {
      showWarning("Please select a customer");
      return false;
    }

    if (form.items.length === 0 && form.documentType !== "Check-in Slip") {
      showWarning("Please add at least one item");
      return false;
    }

    // Check for duplicate Job Card ID
    if (form.jobCardId) {
      const existingQuotation = quotations.find(
        (q) => q.jobCardId === form.jobCardId && q.id !== editingId && q.documentType === form.documentType
      );
      if (existingQuotation) {
        showError(`A ${form.documentType} (${existingQuotation.quotationNumber}) already exists for this Job Card.`);
        return false;
      }
    }

    // Check for duplicate Customer & Vehicle ID (active session)
    if (form.customerId && form.vehicleId && !editingId) {
      const activeQuotation = quotations.find(
        (q) => q.customerId === form.customerId &&
          q.vehicleId === form.vehicleId &&
          q.documentType === form.documentType &&
          !["CUSTOMER_REJECTED", "MANAGER_REJECTED"].includes(q.status)
      );
      if (activeQuotation) {
        showWarning(`This customer already has an active ${form.documentType} (${activeQuotation.quotationNumber}) for this vehicle.`);
        return false;
      }
    }

    // Check if vehicle has an active job card and enforce linkage
    if (form.vehicleId && selectedCustomer && !editingId) {
      const selectedVehicle = selectedCustomer.vehicles.find(v => String(v.id) === form.vehicleId);
      if (selectedVehicle && selectedVehicle.currentStatus === "Active Job Card") {
        if (!form.jobCardId) {
          showError(`This vehicle has an active Job Card (${selectedVehicle.activeJobCardId}). New ${form.documentType}s must be created from that Job Card or linked to it.`);
          return false;
        }
        if (form.jobCardId !== selectedVehicle.activeJobCardId) {
          showError(`Mismatch: Vehicle has active Job Card ${selectedVehicle.activeJobCardId}, but requested ${form.jobCardId}.`);
          return false;
        }
      }
    }

    return true;
  };

  const buildQuotationFromForm = (): Quotation => {
    const updatedTotals = calculateTotals();
    const quotationDate = new Date(form.quotationDate);
    const validUntil = new Date(quotationDate);
    validUntil.setDate(validUntil.getDate() + form.validUntilDays);
    const resolvedServiceCenterId = normalizeServiceCenterId(
      activeServiceCenterId || serviceCenterContext.serviceCenterId
    );
    const resolvedCustomerId = form.customerId || activeCustomerId || "";
    const serviceCenterCode = getServiceCenterCode(resolvedServiceCenterId);
    const quotationNumber = isEditing && form.quotationNumber
      ? form.quotationNumber
      : generateQuotationNumber(resolvedServiceCenterId, quotationDate, quotations);

    const customer = selectedCustomer ?? createEmptyCustomer();
    const selectedInsurer = insurers.find((i) => i.id === form.insurerId);
    const selectedTemplate = noteTemplates.find((t) => t.id === form.noteTemplateId);
    const vehicle = customer.vehicles?.find((v) => v.id.toString() === form.vehicleId);
    const centerMeta = serviceCenters.find(
      (center) => normalizeServiceCenterId(center.id) === resolvedServiceCenterId
    );

    const pendingQuotationData = safeStorage.getItem<any>("pendingQuotationFromAppointment", null);
    const pendingJobCardData = safeStorage.getItem<any>("pendingQuotationFromJobCard", null);

    // Use form IDs preferably, fallback to storage
    const appointmentId = form.appointmentId || pendingQuotationData?.appointmentId || undefined;
    const jobCardId = form.jobCardId || pendingJobCardData?.jobCardId || jobCardIdParam || undefined;

    return {
      id: `qt-${Date.now()}`,
      quotationNumber,
      serviceCenterId: resolvedServiceCenterId,
      customerId: resolvedCustomerId,
      vehicleId: form.vehicleId,
      serviceAdvisorId: userInfo?.id || "user-001",
      appointmentId: appointmentId,
      jobCardId: jobCardId,
      documentType: form.documentType,
      quotationDate: form.quotationDate,
      validUntil: validUntil.toISOString().split("T")[0],
      hasInsurance: form.hasInsurance,
      insurerId: form.insurerId,
      insuranceStartDate: form.insuranceStartDate,
      insuranceEndDate: form.insuranceEndDate,
      subtotal: updatedTotals.subtotal,
      discount: updatedTotals.discount,
      discountPercent: updatedTotals.discountPercent,
      preGstAmount: updatedTotals.preGstAmount,
      cgst: updatedTotals.cgst,
      sgst: updatedTotals.sgst,
      igst: updatedTotals.igst,
      totalAmount: updatedTotals.totalAmount,
      notes: form.notes || selectedTemplate?.content || "",
      batterySerialNumber: form.batterySerialNumber,
      customNotes: form.customNotes,
      noteTemplateId: form.noteTemplateId,
      status: "DRAFT",
      passedToManager: false,
      passedToManagerAt: undefined,
      managerId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: updatedTotals.items.map((item, index) => ({
        id: (item as any).id || `item-${Date.now()}-${index}`,
        ...item,
      })),
      customer: {
        id: resolvedCustomerId,
        firstName: customer.name?.split(" ")[0] || "Customer",
        lastName: customer.name?.split(" ").slice(1).join(" ") || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.cityState?.split(",")[0] || "",
        state: customer.cityState?.split(",")[1]?.trim() || "",
        pincode: customer.pincode || "",
      },
      vehicle: form.vehicleId
        ? {
          id: form.vehicleId,
          make: vehicle?.vehicleMake || "",
          model: vehicle?.vehicleModel || "",
          registration: vehicle?.registration || "",
          vin: vehicle?.vin || "",
        }
        : undefined,
      insurer: selectedInsurer,
      serviceCenter: {
        id: resolvedServiceCenterId,
        name:
          centerMeta?.name ??
          serviceCenterContext.serviceCenterName ??
          "Service Center",
        code: serviceCenterCode,
        address: centerMeta?.address ?? "",
        city: centerMeta?.city ?? "",
        state: centerMeta?.state ?? "",
        pincode: centerMeta?.pinCode ?? "",
        phone: centerMeta?.phone ?? "",
        gstNumber: centerMeta?.gstNumber ?? "",
        panNumber: centerMeta?.panNumber ?? "",
      },
    };
  };

  const updateLocalAppointmentStatus = async (quotation: Quotation) => {
    // Update appointment status if quotation is linked to an appointment
    if (quotation.appointmentId) {
      try {
        await appointmentRepository.updateStatus(quotation.appointmentId, "QUOTATION_CREATED");
      } catch (error) {
        console.error("Failed to update appointment status:", error);
      }
    }
  };

  // Helper function to validate WhatsApp number
  const validateWhatsAppNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === "") return false;
    const cleaned = phone.replace(/\D/g, "");
    // Indian phone numbers should be 10 digits, with optional country code
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  // Helper function to generate complete quotation HTML for PDF/Print
  const generateQuotationHTML = (
    quotation: Quotation,
    serviceCenter: any,
    serviceAdvisor: any
  ): string => {
    const quotationDate = new Date(quotation.quotationDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const validUntilDate = quotation.validUntil
      ? new Date(quotation.validUntil).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      : "N/A";

    const itemsHTML = quotation.items && quotation.items.length > 0
      ? quotation.items
        .map(
          (item, index) => `
          <tr>
            <td style="text-align: center; color: #6b7280;">${item.serialNumber || index + 1}</td>
            <td style="font-weight: 500; color: #111827;">${item.partName || "-"}</td>
            <td style="color: #6b7280;">${item.partNumber || "-"}</td>
            <td style="text-align: center;">${item.quantity || 0}</td>
            <td style="text-align: right;">₹${(item.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: center; color: #6b7280;">${item.gstPercent || 0}%</td>
            <td style="text-align: right; font-weight: 600; color: #111827;">₹${(item.amount || (item.rate * item.quantity * (1 + (item.gstPercent || 18) / 100))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        `
        )
        .join("")
      : '<tr><td colspan="7" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #9ca3af;">No items found in this quotation</td></tr>';

    const insuranceHTML =
      quotation.hasInsurance && (quotation.insurer || quotation.insuranceStartDate || quotation.insuranceEndDate)
        ? `
      <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e40af;">Insurance Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          ${quotation.insurer ? `<div><strong>Insurer:</strong> ${quotation.insurer.name}</div>` : ""}
          ${quotation.insuranceStartDate ? `<div><strong>Start Date:</strong> ${new Date(quotation.insuranceStartDate).toLocaleDateString("en-IN")}</div>` : ""}
          ${quotation.insuranceEndDate ? `<div><strong>End Date:</strong> ${new Date(quotation.insuranceEndDate).toLocaleDateString("en-IN")}</div>` : ""}
        </div>
      </div>
    `
        : "";

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${quotation.documentType === "Proforma Invoice" ? "Proforma Invoice" : "Quotation"} ${quotation.quotationNumber}</title>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
            }
            body {
              padding: 0 !important;
              font-size: 11px !important;
            }
            .no-print { display: none !important; }
            @page {
              margin: 1.2cm !important;
              size: A4;
            }
            .main-container {
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f3f4f6;
            padding: 40px 20px;
            color: #1f2937;
            margin: 0;
          }

          .main-container {
            max-width: 850px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f3f4f6;
          }

          .company-brand {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .company-logo-circle {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 24px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          }

          .company-details h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            color: #111827;
            letter-spacing: -0.025em;
          }

          .company-info-text {
            font-size: 13px;
            color: #6b7280;
            margin-top: 6px;
            line-height: 1.6;
          }

          .document-meta {
            text-align: right;
          }

          .document-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 9999px;
            background-color: #eff6ff;
            color: #2563eb;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }

          .document-number {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          }

          .document-dates {
            font-size: 13px;
            color: #6b7280;
          }

          .grid-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }

          .info-card {
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 10px;
            border: 1px solid #f3f4f6;
          }

          .card-title {
            font-size: 11px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
            display: block;
          }

          .info-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 14px;
          }

          .info-label {
            color: #6b7280;
            width: 120px;
            flex-shrink: 0;
          }

          .info-value {
            color: #111827;
            font-weight: 500;
          }

          table.items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 30px;
          }

          .items-table th {
            background-color: #f9fafb;
            padding: 12px 15px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e5e7eb;
          }

          .items-table td {
            padding: 15px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
            color: #374151;
          }

          .items-table tr:last-child td {
            border-bottom: none;
          }

          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 30px;
          }

          .summary-box {
            width: 320px;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            border-top: 2px solid #374151;
            padding-top: 12px;
            margin-top: 12px;
            font-size: 18px;
            font-weight: bold;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .pricing-total-row td {
            border-top: 2px solid #374151;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 16px;
            font-weight: bold;
          }
          .notes-section {
            margin-top: 16px;
            padding: 12px;
            background-color: #f9fafb;
            border-radius: 8px;
            font-size: 13px;
          }
          @media print {
            .pricing-summary {
              max-width: 100% !important;
              width: 100% !important;
              margin-left: auto !important;
              margin-right: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .pricing-summary-table {
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important;
            }
            .pricing-summary-table td {
              white-space: nowrap !important;
              overflow: visible !important;
              padding: 10px 12px !important;
            }
            .pricing-summary-table td:first-child {
              width: 65% !important;
              text-align: left !important;
              padding-right: 20px !important;
            }
            .pricing-summary-table td:last-child {
              width: 35% !important;
              text-align: right !important;
              padding-left: 20px !important;
            }
            .pricing-row {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              white-space: nowrap !important;
            }
            .pricing-row span {
              white-space: nowrap !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <div class="company-info">
              <div class="company-name">${serviceCenter.name || "Service Center"}</div>
              <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
                ${serviceCenter.address || ""}<br>
                ${serviceCenter.city || ""}, ${serviceCenter.state || ""} - ${serviceCenter.pincode || ""}<br>
                Phone: ${serviceCenter.phone || "N/A"}
                ${serviceCenter.gstNumber ? `<br>GST: ${serviceCenter.gstNumber}` : ""}
                ${serviceCenter.panNumber ? `<br>PAN: ${serviceCenter.panNumber}` : ""}
              </div>
            </div>
            <div class="document-info">
              <div class="document-type">${quotation.documentType === "Proforma Invoice" ? "PROFORMA INVOICE" : "QUOTATION"}</div>
              <div style="font-size: 14px;">
                <div><strong>Document No:</strong> ${quotation.quotationNumber}</div>
                <div><strong>Date:</strong> ${quotationDate}</div>
                <div><strong>Valid Till:</strong> ${validUntilDate}</div>
              </div>
            </div>
          </div>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px;">
            <span><strong>Service Advisor:</strong> ${serviceAdvisor.name || "N/A"}</span>
            <span style="margin-left: 24px;"><strong>Phone:</strong> ${serviceAdvisor.phone || "N/A"}</span>
          </div>
        </div>

        <div class="details-section">
          <h3 class="section-title">Customer & Vehicle Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Customer Name:</span>
              <span> ${quotation.customer?.name || `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim() || "N/A"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone Number:</span>
              <span> ${quotation.customer?.phone || "N/A"}</span>
            </div>
            ${quotation.vehicle ? `
            <div class="detail-item">
              <span class="detail-label">Vehicle Number:</span>
              <span> ${quotation.vehicle.registration || "N/A"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Brand and Model:</span>
              <span> ${quotation.vehicle.vehicleMake || quotation.vehicle.make || "N/A"} ${quotation.vehicle.vehicleModel || quotation.vehicle.model || ""}</span>
            </div>
            ` : ""}
            ${quotation.vehicleLocation ? `
            <div class="detail-item">
              <span class="detail-label">Vehicle Location:</span>
              <span> ${quotation.vehicleLocation === "with_customer" ? "Vehicle with Customer" : "Vehicle at Workshop"}</span>
            </div>
            ` : ""}
          </div>
        </div>

        ${insuranceHTML}

        <div class="details-section">
          <h3 class="section-title">Parts & Services</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">S.No</th>
                <th>Part Name</th>
                <th>Part Number</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate (Pre-GST)</th>
                <th style="text-align: center;">GST %</th>
                <th style="text-align: right;">Amount (Incl. GST)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <div class="pricing-summary">
          <h3 class="section-title">Pricing Summary</h3>
          <table class="pricing-summary-table" style="width: 100%; table-layout: fixed;">
            <tbody>
              <tr>
                <td style="width: 65%; text-align: left; padding-right: 15px; padding: 8px 10px;">Subtotal:</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; padding: 8px 10px; white-space: nowrap;">₹${(quotation.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="width: 65%; text-align: left; padding-right: 15px; padding: 8px 10px;">Discount ${Number(quotation.discountPercent) >= 0 ? `(${Number(quotation.discountPercent).toFixed(1)}%)` : ""}:</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; padding: 8px 10px; white-space: nowrap;">-₹${(quotation.discount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="width: 65%; text-align: left; padding-right: 15px; padding: 8px 10px; padding-top: 10px;">Pre-GST Amount:</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; padding: 8px 10px; padding-top: 10px; white-space: nowrap;">₹${(Number(quotation.preGstAmount) > 0 ? quotation.preGstAmount : (Number(quotation.subtotal || 0) - Number(quotation.discount || 0))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="width: 65%; text-align: left; padding-right: 15px; padding: 8px 10px;">CGST (9%):</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; padding: 8px 10px; white-space: nowrap;">₹${((quotation as any).cgstAmount || (quotation as any).cgst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="width: 65%; text-align: left; padding-right: 15px; padding: 8px 10px;">SGST (9%):</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; padding: 8px 10px; white-space: nowrap;">₹${((quotation as any).sgstAmount || (quotation as any).sgst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="width: 65%; text-align: left; padding-right: 15px; padding: 8px 10px;">IGST (18%):</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; padding: 8px 10px; white-space: nowrap;">₹${((quotation as any).igstAmount || (quotation as any).igst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="pricing-total-row">
                <td style="width: 65%; text-align: left; padding-right: 15px; border-top: 2px solid #374151; padding-top: 10px; font-size: 16px; font-weight: bold;">Total Amount:</td>
                <td style="width: 35%; text-align: right; padding-left: 15px; border-top: 2px solid #374151; padding-top: 10px; font-size: 16px; font-weight: bold; white-space: nowrap;">₹${(quotation.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${quotation.notes || quotation.customNotes ? `
        <div class="notes-section">
          <h3 class="section-title" style="margin-bottom: 8px;">Notes</h3>
          <div>${quotation.notes || quotation.customNotes || ""}</div>
        </div>
        ` : ""}
      </body>
    </html>
  `;
  };

  // Helper function to format WhatsApp message
  const formatWhatsAppMessage = (quotation: Quotation, serviceCenter: any): string => {
    const customerName = quotation.customer?.name || (quotation.customer?.firstName ? `${quotation.customer.firstName} ${quotation.customer.lastName || ""}`.trim() : "Customer");
    const vehicleInfo = quotation.vehicle
      ? `${quotation.vehicle.vehicleMake || quotation.vehicle.make || ""} ${quotation.vehicle.vehicleModel || quotation.vehicle.model || ""} (${quotation.vehicle.registration})`.trim()
      : "N/A";

    // Show first 3 items, then count of remaining
    const itemsCount = quotation.items?.length || 0;
    const firstItems = quotation.items?.slice(0, 3) || [];
    const remainingCount = itemsCount > 3 ? itemsCount - 3 : 0;

    const itemsSummary = firstItems
      .map((item, idx) => `${idx + 1}. ${item.partName} (Qty: ${item.quantity}) - ₹${(item.amount || 0).toLocaleString("en-IN")}`)
      .join("\n");

    const approvalLink = `${window.location.origin}/sc/quotations?quotationId=${quotation.id}&action=approve`;
    const rejectionLink = `${window.location.origin}/sc/quotations?quotationId=${quotation.id}&action=reject`;

    return `Hello ${customerName}! 👋

📄 *${quotation.documentType === "Proforma Invoice" ? "Proforma Invoice" : "Quotation"} ${quotation.quotationNumber}*

📅 Date: ${new Date(quotation.quotationDate).toLocaleDateString("en-IN")}
${quotation.validUntil ? `⏰ Valid Till: ${new Date(quotation.validUntil).toLocaleDateString("en-IN")}\n` : ""}
🚗 Vehicle: ${vehicleInfo}

📋 *Items Summary:*
${itemsSummary}
${remainingCount > 0 ? `... and ${remainingCount} more item${remainingCount > 1 ? "s" : ""}\n` : ""}
💰 *Pricing:*
Subtotal: ₹${(Number(quotation.subtotal) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
${Number(quotation.discount) > 0 ? `Discount: -₹${(Number(quotation.discount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}Pre-GST Amount: ₹${(Number(quotation.preGstAmount) || (Number(quotation.subtotal) - Number(quotation.discount)) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
${Number((quotation as any).cgst) > 0 ? `CGST (9%): ₹${Number((quotation as any).cgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}${Number((quotation as any).sgst) > 0 ? `SGST (9%): ₹${Number((quotation as any).sgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}${Number((quotation as any).igst) > 0 ? `IGST (18%): ₹${Number((quotation as any).igst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}*Total Amount: ₹${(Number(quotation.totalAmount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}*

📄 A detailed PDF has been generated. Please review it.

✅ *To Approve:* ${approvalLink}
❌ *To Reject:* ${rejectionLink}

Or reply with "APPROVE" or "REJECT"

📞 Contact: ${serviceCenter.phone || "N/A"}
🏢 ${serviceCenter.name || "Service Center"}`;
  };

  const sendQuotationToCustomerById = async (
    quotationId: string,
    options?: { manageLoading?: boolean }
  ) => {
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) return;

    const { manageLoading = true } = options ?? {};

    try {
      if (manageLoading) {
        setLoading(true);
      }

      // Call backend to generate PDF and get WhatsApp number
      const { pdfUrl, whatsappNumber } = await quotationRepository.sendToCustomer(quotationId);

      // Refresh quotations list to update status
      queryClient.invalidateQueries({ queryKey: ['quotations'] });

      // Construct full PDF URL (assuming it's a relative path)
      const fullPdfUrl = pdfUrl.startsWith('http')
        ? pdfUrl
        : `${window.location.origin}${pdfUrl}`;

      // Format WhatsApp message with PDF link
      const customerName = quotation.customer?.name ||
        `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim() ||
        "Valued Customer";

      const vehicleInfo = quotation.vehicle
        ? `${quotation.vehicle.registration || "N/A"}`
        : "N/A";

      const serviceCenter = quotation.serviceCenter || {
        name: "42 EV Tech & Services",
        phone: "+91-20-12345678",
      };

      const message = `Dear ${customerName},

📄 *Your Quotation is Ready!*

Please find your detailed quotation from *${serviceCenter.name}*:

🔗 *Download PDF:* ${fullPdfUrl}

📋 *Quotation Details:*
• Quotation No: ${quotation.quotationNumber}
• Vehicle: ${vehicleInfo}
• Total Amount: ₹${(Number(quotation.totalAmount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}

Please review the PDF and let us know if you approve or have any questions.

To approve, simply reply "APPROVE"
To reject, reply "REJECT"

📞 Contact us: ${serviceCenter.phone || "N/A"}
🏢 ${serviceCenter.name}`;

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      if (manageLoading) {
        showSuccess("Quotation PDF generated and sent to WhatsApp!");
      }

    } catch (error) {
      console.error("Error sending quotation:", error);
      showError(error instanceof Error ? error.message : "Failed to send quotation. Please try again.");
    } finally {
      if (manageLoading) setLoading(false);
    }
  };


  // Add item
  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          serialNumber: form.items.length + 1,
          partName: "",
          partNumber: "",
          quantity: 1,
          rate: 0,
          gstPercent: 18,
          amount: 0,
        },
      ],
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    // Re-number items
    newItems.forEach((item, i) => {
      item.serialNumber = i + 1;
    });
    setForm({ ...form, items: newItems });
  };

  // Update item
  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount
    if (field === "rate" || field === "quantity" || field === "gstPercent") {
      const rate = Number(newItems[index].rate) || 0;
      const q = Number(newItems[index].quantity) || 0;
      const gst = Number(newItems[index].gstPercent) || 0;
      newItems[index].amount = rate * q * (1 + gst / 100);
    }

    setForm({ ...form, items: newItems });
  };

  // Handle note template selection
  const handleNoteTemplateChange = (templateId: string) => {
    const template = noteTemplates.find((t) => t.id === templateId);
    if (template) {
      setForm({
        ...form,
        noteTemplateId: templateId,
        notes: template.content,
      });
    }
  };

  // Submit quotation or check-in slip
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Handle check-in slip
    if (form.documentType === "Check-in Slip") {
      if (!selectedCustomer) {
        showWarning("Please select a customer");
        return;
      }

      try {
        setLoading(true);

        const vehicle = selectedCustomer.vehicles?.find((v) => String(v.id) === form.vehicleId) || selectedCustomer.vehicles?.[0] || null;

        // Get appointment data if available
        const quotationDataFromStorage = safeStorage.getItem<any>("pendingQuotationFromAppointment", null);
        const appointmentData = quotationDataFromStorage?.appointmentData;

        // Get service center info
        const normalizedServiceCenterId = activeServiceCenterId || serviceCenterContext.serviceCenterId?.toString() || "sc-001";
        const serviceCenter = serviceCenters.find(
          (sc) => (sc as any).serviceCenterId === normalizedServiceCenterId || sc.id?.toString() === normalizedServiceCenterId
        );
        const serviceCenterName = serviceCenter?.name || serviceCenterContext.serviceCenterName || "Service Center";

        // Convert form data to enhanced check-in slip data
        const enhancedData = convertCheckInSlipFormToData(
          checkInSlipFormData,
          selectedCustomer,
          vehicle,
          appointmentData,
          normalizedServiceCenterId,
          serviceCenterName
        );

        setCheckInSlipData(enhancedData);

        // Convert check-in slip to quotation format and save it
        const checkInSlipQuotation: Quotation = {
          id: `checkin-${Date.now()}`,
          quotationNumber: enhancedData.slipNumber,
          serviceCenterId: normalizedServiceCenterId,
          customerId: selectedCustomer.id?.toString() || "",
          vehicleId: vehicle?.id?.toString(),
          serviceAdvisorId: userInfo?.id || "",
          appointmentId: appointmentData?.id || quotationDataFromStorage?.appointmentId,
          documentType: "Check-in Slip",
          quotationDate: enhancedData.checkInDate,
          validUntil: undefined,
          hasInsurance: false,
          insurerId: undefined,
          subtotal: 0,
          discount: 0,
          discountPercent: 0,
          preGstAmount: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalAmount: 0,
          notes: enhancedData.notes || enhancedData.customerFeedback || "",
          batterySerialNumber: enhancedData.batterySerialNumber,
          customNotes: enhancedData.technicalObservation || "",
          noteTemplateId: undefined,
          status: "DRAFT",
          passedToManager: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [],
          customer: {
            id: selectedCustomer.id?.toString() || "",
            firstName: selectedCustomer.name?.split(" ")[0] || "Customer",
            lastName: selectedCustomer.name?.split(" ").slice(1).join(" ") || "",
            phone: selectedCustomer.phone || "",
            email: selectedCustomer.email,
            address: selectedCustomer.address,
            city: selectedCustomer.cityState?.split(",")[0] || "",
            state: selectedCustomer.cityState?.split(",")[1]?.trim() || "",
            pincode: selectedCustomer.pincode || "",
          },
          vehicle: vehicle ? {
            id: vehicle.id?.toString() || "",
            make: vehicle.vehicleMake || "",
            model: vehicle.vehicleModel || "",
            registration: vehicle.registration || "",
            vin: vehicle.vin || "",
          } : undefined,
          serviceCenter: {
            id: normalizedServiceCenterId,
            name: serviceCenterName,
            code: SERVICE_CENTER_CODE_MAP[normalizedServiceCenterId] || "SC001",
            address: enhancedData.serviceCenterAddress,
            city: enhancedData.serviceCenterCity,
            state: enhancedData.serviceCenterState,
            pincode: enhancedData.serviceCenterPincode,
            phone: enhancedData.serviceCenterPhone,
          },
        };

        // Save check-in slip as quotation
        if (isEditing && editingId) {
          const { id, quotationNumber, customer, vehicle, serviceCenter, ...updatableData } = checkInSlipQuotation;
          await updateQuotationMutation.mutateAsync({ id: editingId, data: updatableData });

          // Update stored enhanced check-in slip data
          safeStorage.setItem(`checkInSlip_${editingId}`, enhancedData);

          showSuccess("Check-in slip updated successfully! You can now send it to the customer via WhatsApp.");
        } else {
          const createdQuotation = await createQuotationMutation.mutateAsync(checkInSlipQuotation);
          updateLocalAppointmentStatus(createdQuotation);

          // Store enhanced check-in slip data for display
          safeStorage.setItem(`checkInSlip_${createdQuotation.id}`, enhancedData);

          showSuccess("Check-in slip generated successfully! You can now send it to the customer via WhatsApp.");
        }

        setShowCheckInSlipModal(true);
        // Keep form open so user can send via WhatsApp
        // setShowCreateModal(false);

        // Clear stored appointment data if exists
        if (quotationDataFromStorage) {
          safeStorage.removeItem("pendingQuotationFromAppointment");
        }
      } catch (error) {
        console.error("Error creating check-in slip:", error);
        showError("Failed to create check-in slip. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle quotation/proforma invoice
    if (!validateQuotationForm()) {
      return;
    }

    try {
      setLoading(true);
      if (isEditing && editingId) {
        const updatedQuotation = buildQuotationFromForm();
        // Remove ID and other non-updatable fields if necessary, but repo.update usually handles it
        const { id, quotationNumber, customer, vehicle, serviceCenter, ...updatableData } = updatedQuotation;
        await updateQuotationMutation.mutateAsync({ id: editingId, data: updatableData });
        showSuccess("Quotation updated successfully!");
      } else {
        const newQuotation = buildQuotationFromForm();
        const createdQuotation = await createQuotationMutation.mutateAsync(newQuotation);
        updateLocalAppointmentStatus(createdQuotation);
        setFilter("DRAFT");
        showSuccess("Quotation created successfully!");
      }
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving quotation:", error);
      showError("Failed to save quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndSendToCustomer = async () => {
    if (!validateQuotationForm()) {
      return;
    }

    try {
      setLoading(true);
      const newQuotation = buildQuotationFromForm();
      const createdQuotation = await createQuotationMutation.mutateAsync(newQuotation);
      updateLocalAppointmentStatus(createdQuotation);
      setFilter("SENT_TO_CUSTOMER");

      await sendQuotationToCustomerById(createdQuotation.id, { manageLoading: false });

      setShowCreateModal(false);
      resetForm();
      showSuccess("Quotation created and sent successfully!");
    } catch (error) {
      console.error("Error creating and sending quotation:", error);
      showError("Failed to create and send quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate and Send Check-in Slip to Customer
  const handleGenerateAndSendCheckInSlip = async () => {
    if (!selectedCustomer) {
      showWarning("Please select a customer");
      return;
    }

    if (!validateQuotationForm()) {
      return;
    }

    try {
      setLoading(true);

      const vehicle = selectedCustomer.vehicles?.find((v) => String(v.id) === form.vehicleId) || selectedCustomer.vehicles?.[0] || null;

      // Get appointment data if available
      const quotationDataFromStorage = safeStorage.getItem<any>("pendingQuotationFromAppointment", null);
      const appointmentData = quotationDataFromStorage?.appointmentData;

      // Get service center info
      const normalizedServiceCenterId = activeServiceCenterId || serviceCenterContext.serviceCenterId?.toString() || "sc-001";
      const serviceCenter = serviceCenters.find(
        (sc) => (sc as any).serviceCenterId === normalizedServiceCenterId || sc.id?.toString() === normalizedServiceCenterId
      );
      const serviceCenterName = serviceCenter?.name || serviceCenterContext.serviceCenterName || "Service Center";

      // Convert form data to enhanced check-in slip data
      const enhancedData = convertCheckInSlipFormToData(
        checkInSlipFormData,
        selectedCustomer,
        vehicle,
        appointmentData,
        normalizedServiceCenterId,
        serviceCenterName
      );

      setCheckInSlipData(enhancedData);

      // Convert check-in slip to quotation format and save it
      const checkInSlipQuotation: Quotation = {
        id: `checkin-${Date.now()}`,
        quotationNumber: enhancedData.slipNumber,
        serviceCenterId: normalizedServiceCenterId,
        customerId: selectedCustomer.id?.toString() || "",
        vehicleId: vehicle?.id?.toString(),
        serviceAdvisorId: userInfo?.id || "",
        appointmentId: appointmentData?.id || quotationDataFromStorage?.appointmentId,
        documentType: "Check-in Slip",
        quotationDate: enhancedData.checkInDate,
        validUntil: undefined,
        hasInsurance: false,
        insurerId: undefined,
        subtotal: 0,
        discount: 0,
        discountPercent: 0,
        preGstAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalAmount: 0,
        notes: enhancedData.notes || enhancedData.customerFeedback || "",
        batterySerialNumber: enhancedData.batterySerialNumber,
        customNotes: enhancedData.technicalObservation || "",
        noteTemplateId: undefined,
        status: "DRAFT",
        passedToManager: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        customer: {
          id: selectedCustomer.id?.toString() || "",
          firstName: selectedCustomer.name?.split(" ")[0] || "Customer",
          lastName: selectedCustomer.name?.split(" ").slice(1).join(" ") || "",
          phone: selectedCustomer.phone || "",
          email: selectedCustomer.email,
          address: selectedCustomer.address,
          city: selectedCustomer.cityState?.split(",")[0] || "",
          state: selectedCustomer.cityState?.split(",")[1]?.trim() || "",
          pincode: selectedCustomer.pincode || "",
        },
        vehicle: vehicle ? {
          id: vehicle.id?.toString() || "",
          make: vehicle.vehicleMake || "",
          model: vehicle.vehicleModel || "",
          registration: vehicle.registration || "",
          vin: vehicle.vin || "",
        } : undefined,
        serviceCenter: {
          id: normalizedServiceCenterId,
          name: serviceCenterName,
          code: SERVICE_CENTER_CODE_MAP[normalizedServiceCenterId] || "SC001",
          address: enhancedData.serviceCenterAddress,
          city: enhancedData.serviceCenterCity,
          state: enhancedData.serviceCenterState,
          pincode: enhancedData.serviceCenterPincode,
          phone: enhancedData.serviceCenterPhone,
        },
      };

      // Save check-in slip as quotation
      const createdQuotation = await createQuotationMutation.mutateAsync(checkInSlipQuotation);
      updateLocalAppointmentStatus(createdQuotation);

      // Store enhanced check-in slip data for display
      safeStorage.setItem(`checkInSlip_${createdQuotation.id}`, enhancedData);

      // Clear stored appointment data if exists
      if (quotationDataFromStorage) {
        safeStorage.removeItem("pendingQuotationFromAppointment");
      }

      // Send to customer via WhatsApp
      const rawWhatsapp =
        (selectedCustomer as any)?.whatsappNumber ||
        selectedCustomer?.phone ||
        "";
      const customerWhatsapp = rawWhatsapp.replace(/\D/g, "");

      if (!customerWhatsapp) {
        showWarning("Customer WhatsApp number not found. Check-in slip generated but could not send via WhatsApp.");
        setShowCheckInSlipModal(true);
        return;
      }

      // Format check-in date and time
      const checkInDate = new Date(enhancedData.checkInDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const checkInTime = enhancedData.checkInTime.includes(":")
        ? (() => {
          const [hours, minutes] = enhancedData.checkInTime.split(":");
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        })()
        : enhancedData.checkInTime;

      // Create WhatsApp message
      const message = `Hello ${enhancedData.customerName}, your check-in slip ${enhancedData.slipNumber} has been generated.

Vehicle: ${enhancedData.vehicleMake} ${enhancedData.vehicleModel} - ${enhancedData.registrationNumber}
Service Center: ${enhancedData.serviceCenterName}
Check-in Date: ${checkInDate} at ${checkInTime}

Please keep this slip safe for vehicle collection.`;

      const whatsappUrl = `https://wa.me/${customerWhatsapp}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");

      showSuccess("Check-in slip generated and sent to customer via WhatsApp!");
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error generating and sending check-in slip:", error);
      showError("Failed to generate and send check-in slip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Send Check-in Slip to Customer via WhatsApp
  const handleSendCheckInSlipToCustomer = async () => {
    if (!checkInSlipData || !selectedCustomer) {
      showWarning("Please generate a check-in slip first");
      return;
    }

    try {
      setLoading(true);

      // Get customer WhatsApp number
      const rawWhatsapp =
        (selectedCustomer as any)?.whatsappNumber ||
        selectedCustomer?.phone ||
        "";
      const customerWhatsapp = rawWhatsapp.replace(/\D/g, "");

      if (!customerWhatsapp) {
        showError("Customer WhatsApp number not found");
        return;
      }

      // Format check-in date and time
      const checkInDate = new Date(checkInSlipData.checkInDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const checkInTime = checkInSlipData.checkInTime.includes(":")
        ? (() => {
          const [hours, minutes] = checkInSlipData.checkInTime.split(":");
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        })()
        : checkInSlipData.checkInTime;

      // Create WhatsApp message
      const message = `Hello ${checkInSlipData.customerName}, your check-in slip ${checkInSlipData.slipNumber} has been generated.

Vehicle: ${checkInSlipData.vehicleMake} ${checkInSlipData.vehicleModel} - ${checkInSlipData.registrationNumber}
Service Center: ${checkInSlipData.serviceCenterName}
Check-in Date: ${checkInDate} at ${checkInTime}

Please keep this slip safe for vehicle collection.`;

      const whatsappUrl = `https://wa.me/${customerWhatsapp}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");
      showSuccess("Check-in slip details sent to customer via WhatsApp!");
    } catch (error) {
      console.error("Error sending check-in slip:", error);
      showError("Failed to send check-in slip via WhatsApp. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id: string) => {
    openConfirm(
      "Delete Quotation",
      "Are you sure you want to delete this quotation? This action cannot be undone.",
      async () => {
        try {
          setLoading(true);
          await deleteQuotationMutation.mutateAsync(id);
          showSuccess("Quotation deleted successfully!");
        } catch (error) {
          console.error("Error deleting quotation:", error);
          showError("Failed to delete quotation.");
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // Edit Quotation
  const handleEdit = (quotation: Quotation) => {
    setForm({
      customerId: quotation.customerId,
      vehicleId: quotation.vehicleId || "",
      documentType: quotation.documentType,
      quotationNumber: quotation.quotationNumber,
      quotationDate: quotation.quotationDate.split("T")[0],
      validUntilDays: 30, // Default or calculate
      hasInsurance: quotation.hasInsurance,
      insurerId: quotation.insurerId || "",
      insuranceCompanyName: quotation.insurer?.name || "",
      insuranceStartDate: quotation.insuranceStartDate || "",
      insuranceEndDate: quotation.insuranceEndDate || "",
      items: quotation.items.map(item => ({ ...item })),
      discount: quotation.discount,
      notes: quotation.notes || "",
      batterySerialNumber: quotation.batterySerialNumber || "",
      customNotes: quotation.customNotes || "",
      noteTemplateId: quotation.noteTemplateId || "",
      vehicleLocation: quotation.vehicleLocation,
      appointmentId: quotation.appointmentId || "",
      jobCardId: quotation.jobCardId || "",
    });

    if (quotation.documentType === "Check-in Slip") {
      const storedData = safeStorage.getItem<any>(`checkInSlip_${quotation.id}`, null);
      if (storedData) {
        setCheckInSlipFormData(storedData);
      } else {
        setCheckInSlipFormData({
          notes: quotation.notes,
          batterySerialNumber: quotation.batterySerialNumber,
          technicalObservation: quotation.customNotes,
        } as any);
      }
    }

    setSelectedCustomer(quotation.customer as any);
    setIsEditing(true);
    setEditingId(quotation.id);
    setShowCreateModal(true);
  };

  // Send to Customer via WhatsApp
  const handleSendToCustomer = async (quotationId: string) => {
    // Unify with the existing robust implementation
    return sendQuotationToCustomerById(quotationId);
  };

  // Convert Quotation to Job Card
  const convertQuotationToJobCard = async (quotation: Quotation) => {
    const resolvedServiceCenterId = normalizeServiceCenterId(quotation.serviceCenterId);
    const serviceCenterCode = getServiceCenterCode(resolvedServiceCenterId);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // We can't easily get next sequence synchronously from API without fetching all or using a special endpoint.
    // Ideally backend handles this.
    // For now, we will construct a payload without specific number if possible, or use a dummy.
    // But since the current Logic tries to calculate it, we might try to fetch latest job card?
    // Using simple creation payload and letting backend handle logic is best.

    // Create job card from quotation
    // Create job card from quotation
    const newJobCard = {
      serviceCenterId: quotation.serviceCenterId || resolvedServiceCenterId,
      customerId: quotation.customerId,
      vehicleId: quotation.vehicleId,
      serviceType: quotation.items?.[0]?.partName || "Service",
      priority: "NORMAL" as const,
      location: "STATION" as const,
      isTemporary: true,
      part1Data: {
        fullName: (quotation.customer?.name || `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim()).replace(/\s+/g, " ") || "Customer",
        mobilePrimary: quotation.customer?.phone || "",
        vehicleBrand: quotation.vehicle?.vehicleMake || (quotation.vehicle as any)?.make || "Unknown",
        vehicleModel: quotation.vehicle?.vehicleModel || (quotation.vehicle as any)?.model || "Unknown",
        registrationNumber: quotation.vehicle?.registration || "Unknown",
        vinChassisNumber: quotation.vehicle?.vin || "Unknown",
        customerFeedback: quotation.notes || quotation.customNotes || "Service as per quotation",
      },
      // Note: items are not passed to create temporary job card typically, 
      // but if we wanted to pre-fill Part 2, we would map them to 'items' field.
      // However, the backend create logic stores 'items' into 'part2' JSON column.
      items: quotation.items?.map((item: any) => ({
        srNo: item.serialNumber || 1,
        partName: item.partName,
        partCode: item.partNumber || "NA",
        qty: item.quantity,
        amount: item.amount || (item.rate * item.quantity),
        itemType: "part", // Assuming all quotation items are parts for now

      })).map((item: any, idx: number) => ({ ...item, srNo: idx + 1 }))
    };

    // Save job card via API
    try {
      const createdJobCard = await jobCardRepository.create(newJobCard);
      return createdJobCard;
    } catch (e) {
      console.error("Failed to create job card via API", e);
      // Fallback or rethrow? Rethrow to alert user.
      throw e;
    }
  };

  // Create or Update Lead from Quotation (when sent to customer)
  const createOrUpdateLeadFromQuotation = (quotation: Quotation) => {
    const existingLeads = safeStorage.getItem<any[]>("leads", []);

    // Check if lead already exists for this quotation
    const existingLeadIndex = existingLeads.findIndex((l) => l.quotationId === quotation.id);

    const leadData: any = {
      customerId: quotation.customerId,
      customerName: (quotation.customer?.name || `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim()).replace(/\s+/g, " ") || "Customer",
      phone: quotation.customer?.phone || "",
      email: quotation.customer?.email,
      vehicleDetails: quotation.vehicle ? `${quotation.vehicle.make} ${quotation.vehicle.model}` : "",
      vehicleMake: quotation.vehicle?.make,
      vehicleModel: quotation.vehicle?.model,
      inquiryType: "Service",
      serviceType: quotation.items?.[0]?.partName || "Service",
      source: "quotation_sent",
      status: "in_discussion" as const,
      quotationId: quotation.id,
      jobCardId: quotation.jobCardId, // Link to job card if available
      notes: `Quotation ${quotation.quotationNumber} sent to customer. Amount: ₹${quotation.totalAmount.toLocaleString("en-IN")}.`,
      assignedTo: quotation.serviceAdvisorId || userInfo?.id,
      serviceCenterId: quotation.serviceCenterId,
      updatedAt: new Date().toISOString(),
    };

    if (existingLeadIndex !== -1) {
      // Update existing lead
      existingLeads[existingLeadIndex] = {
        ...existingLeads[existingLeadIndex],
        ...leadData,
        id: existingLeads[existingLeadIndex].id,
        createdAt: existingLeads[existingLeadIndex].createdAt,
      };
      safeStorage.setItem("leads", existingLeads);
      return existingLeads[existingLeadIndex];
    } else {
      // Create new lead
      const newLead: any = {
        id: `lead-${Date.now()}`,
        ...leadData,
        createdAt: new Date().toISOString(),
      };
      const updatedLeads = [...existingLeads, newLead];
      safeStorage.setItem("leads", updatedLeads);
      return newLead;
    }
  };

  // Update Lead when Job Card is Created
  const updateLeadOnJobCardCreation = (quotationId: string, jobCardId: string, jobCardNumber: string) => {
    const existingLeads = safeStorage.getItem<any[]>("leads", []);
    const leadIndex = existingLeads.findIndex((l) => l.quotationId === quotationId);

    if (leadIndex !== -1) {
      const lead = existingLeads[leadIndex];
      const updatedNotes = lead.notes
        ? `${lead.notes}\nJob card created: ${jobCardNumber}`
        : `Job card created: ${jobCardNumber}`;

      existingLeads[leadIndex] = {
        ...lead,
        status: "job_card_in_progress" as const,
        jobCardId: jobCardId,
        convertedTo: "job_card" as const,
        notes: updatedNotes,
        updatedAt: new Date().toISOString(),
      };
      safeStorage.setItem("leads", existingLeads);
      return existingLeads[leadIndex];
    }

    // If no lead exists, create one with job_card_in_progress status
    const quotation = quotations.find((q) => q.id === quotationId);
    if (quotation) {
      const newLead: any = {
        id: `lead-${Date.now()}`,
        customerId: quotation.customerId,
        customerName: (quotation.customer?.name || `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim()).replace(/\s+/g, " ") || "Customer",
        phone: quotation.customer?.phone || "",
        email: quotation.customer?.email,
        vehicleDetails: quotation.vehicle ? `${quotation.vehicle.make} ${quotation.vehicle.model}` : "",
        vehicleMake: quotation.vehicle?.make,
        vehicleModel: quotation.vehicle?.model,
        inquiryType: "Service",
        serviceType: quotation.items?.[0]?.partName || "Service",
        source: "quotation_approved",
        status: "job_card_in_progress" as const,
        quotationId: quotation.id,
        jobCardId: jobCardId,
        convertedTo: "job_card" as const,
        notes: `Quotation ${quotation.quotationNumber} approved. Job card created: ${jobCardNumber}`,
        assignedTo: quotation.serviceAdvisorId || userInfo?.id,
        serviceCenterId: quotation.serviceCenterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedLeads = [...existingLeads, newLead];
      safeStorage.setItem("leads", updatedLeads);
      return newLead;
    }

    return null;
  };

  // Add Rejected Quotation to Leads
  const addRejectedQuotationToLeads = (quotation: Quotation) => {
    const existingLeads = safeStorage.getItem<any[]>("leads", []);

    const newLead: any = {
      id: `lead-${Date.now()}`,
      customerId: quotation.customerId,
      customerName: (quotation.customer?.name || `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim()).replace(/\s+/g, " ") || "Customer",
      phone: quotation.customer?.phone || "",
      email: quotation.customer?.email,
      vehicleDetails: quotation.vehicle ? `${quotation.vehicle.make} ${quotation.vehicle.model}` : "",
      vehicleMake: quotation.vehicle?.make,
      vehicleModel: quotation.vehicle?.model,
      inquiryType: "Service",
      serviceType: quotation.items?.[0]?.partName || "Service",
      source: "quotation_rejection",
      status: "in_discussion" as const,
      notes: `Quotation ${quotation.quotationNumber} was rejected by customer. Amount: ₹${quotation.totalAmount.toLocaleString("en-IN")}. Reason: Customer did not approve the quotation.`,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
      assignedTo: quotation.serviceAdvisorId || userInfo?.id,
      serviceCenterId: quotation.serviceCenterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      convertedTo: "quotation" as const,
      convertedId: quotation.id,
    };

    const updatedLeads = [...existingLeads, newLead];
    safeStorage.setItem("leads", updatedLeads);

    return newLead;
  };

  // Customer Approval
  const handleCustomerApproval = async (quotationId: string) => {
    openConfirm(
      "Confirm Approval",
      "Customer has approved this quotation. Convert to job card and notify advisor?",
      async () => {
        try {
          setLoading(true);
          const quotation = quotations.find((q) => q.id === quotationId);
          if (!quotation) {
            showError("Quotation not found!");
            return;
          }

          // Create job card first
          const jobCard = await convertQuotationToJobCard(quotation);

          // Update quotation status and link job card
          await updateQuotationMutation.mutateAsync({
            id: quotationId,
            data: {
              status: "CUSTOMER_APPROVED" as const,
              customerApproved: true,
              customerApprovedAt: new Date().toISOString(),
              jobCardId: jobCard.id,
            }
          });

          // Update lead status
          updateLeadOnJobCardCreation(quotation.id, jobCard.id, jobCard.jobCardNumber);

          showSuccess(`Customer Approved! Quotation ${quotation.quotationNumber} has been approved and Job Card ${jobCard.jobCardNumber} created.`);
        } catch (error) {
          console.error("Error approving quotation:", error);
          showError("Failed to approve quotation. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      "success"
    );
  };

  // Customer Rejection
  const handleCustomerRejection = async (quotationId: string) => {
    openConfirm(
      "Confirm Rejection",
      "Customer has rejected this quotation. Add to leads for follow-up?",
      async () => {
        try {
          setLoading(true);

          const quotation = quotations.find((q) => q.id === quotationId);
          if (!quotation) {
            showError("Quotation not found!");
            return;
          }

          // Update quotation status
          const updateData = {
            status: "CUSTOMER_REJECTED" as const,
            customerRejected: true,
            customerRejectedAt: new Date().toISOString(),
          };
          await updateQuotationMutation.mutateAsync({ id: quotationId, data: updateData });

          const updatedQuotation = { ...quotation, ...updateData };

          // Add to leads for follow-up
          const lead = addRejectedQuotationToLeads(updatedQuotation);

          // Show notification to advisor
          showWarning(`Customer Rejected Quotation ${quotation.quotationNumber}. Added to Leads for follow-up.`);

          showInfo("Quotation marked as customer rejected.");
        } catch (error) {
          console.error("Error rejecting quotation:", error);
          showError("Failed to reject quotation. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      "info"
    );
  };

  // Send to Manager
  const handleSendToManager = async (quotationId: string) => {
    openConfirm(
      "Send to Manager",
      "Send this quotation to manager for approval?",
      async () => {
        try {
          setLoading(true);

          await updateQuotationMutation.mutateAsync({
            id: quotationId,
            data: {
              status: "SENT_TO_MANAGER" as const,
              sentToManager: true,
              sentToManagerAt: new Date().toISOString(),
            }
          });

          showSuccess("Quotation sent to manager!");
        } catch (error) {
          console.error("Error sending to manager:", error);
          showError("Failed to send quotation. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      "info"
    );
  };

  // Manager Approval
  const handleManagerApproval = async (quotationId: string) => {
    openConfirm(
      "Approve Quotation",
      "Approve this quotation? This will allow job card creation.",
      async () => {
        try {
          setLoading(true);

          await updateQuotationMutation.mutateAsync({
            id: quotationId,
            data: {
              status: "MANAGER_APPROVED" as const,
              managerApproved: true,
              managerApprovedAt: new Date().toISOString(),
              managerId: userInfo?.id || "",
            }
          });

          showSuccess("Quotation approved by manager!");
        } catch (error) {
          console.error("Error approving quotation:", error);
          showError("Failed to approve quotation. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      "success"
    );
  };

  // Manager Rejection
  const handleManagerRejection = async (quotationId: string) => {
    openConfirm(
      "Reject Quotation",
      "Reject this quotation?",
      async () => {
        try {
          setLoading(true);

          await updateQuotationMutation.mutateAsync({
            id: quotationId,
            data: {
              status: "MANAGER_REJECTED" as const,
              managerRejected: true,
              managerRejectedAt: new Date().toISOString(),
              managerId: userInfo?.id || "",
            }
          });

          showInfo("Quotation rejected by manager.");
        } catch (error) {
          console.error("Error rejecting quotation:", error);
          showError("Failed to reject quotation. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // Open Quotation/Check-in Slip for Viewing
  const handleOpenQuotation = (quotation: Quotation) => {
    if (quotation.documentType === "Check-in Slip") {
      // Load check-in slip data and display
      const storedCheckInSlipData = safeStorage.getItem<any>(`checkInSlip_${quotation.id}`, null) as EnhancedCheckInSlipData | null;

      if (storedCheckInSlipData) {
        setCheckInSlipData(storedCheckInSlipData);
        // Find and set customer for WhatsApp sending
        const customers = safeStorage.getItem<CustomerWithVehicles[]>("customers", []);
        const customer = customers.find(c => c.id?.toString() === quotation.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
        setShowCheckInSlipModal(true);
      } else {
        // Fallback: reconstruct from quotation data
        const reconstructedData: EnhancedCheckInSlipData = {
          slipNumber: quotation.quotationNumber,
          customerName: `${quotation.customer?.firstName || ""} ${quotation.customer?.lastName || ""}`.trim(),
          phone: quotation.customer?.phone || "",
          email: quotation.customer?.email,
          vehicleMake: quotation.vehicle?.make || "",
          vehicleModel: quotation.vehicle?.model || "",
          registrationNumber: quotation.vehicle?.registration || "",
          vin: quotation.vehicle?.vin,
          checkInDate: quotation.quotationDate,
          checkInTime: new Date().toTimeString().slice(0, 5),
          serviceCenterName: quotation.serviceCenter?.name || "",
          serviceCenterAddress: quotation.serviceCenter?.address || "",
          serviceCenterCity: quotation.serviceCenter?.city || "",
          serviceCenterState: quotation.serviceCenter?.state || "",
          serviceCenterPincode: quotation.serviceCenter?.pincode || "",
          serviceCenterPhone: quotation.serviceCenter?.phone,
          notes: quotation.notes,
        };
        setCheckInSlipData(reconstructedData);
        const customers = safeStorage.getItem<CustomerWithVehicles[]>("customers", []);
        const customer = customers.find(c => c.id?.toString() === quotation.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
        setShowCheckInSlipModal(true);
      }
    } else {
      setSelectedQuotation(quotation);
      setShowViewModal(true);
    }
  };

  const getCustomerDisplayName = (customer: Quotation["customer"]) => {
    if (!customer) return null;
    const name = (
      customer.name ||
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
    ).replace(/\s+/g, " ");

    if (!name || name === customer.phone) return null;
    return name;
  };

  // Reset form
  const resetForm = useCallback(() => {
    setForm({
      customerId: "",
      vehicleId: "",
      quotationNumber: "",
      documentType: "Quotation",
      quotationDate: new Date().toISOString().split("T")[0],
      validUntilDays: 30,
      hasInsurance: false,
      insurerId: "",
      insuranceCompanyName: "",
      insuranceStartDate: "",
      insuranceEndDate: "",
      items: [],
      discount: 0,
      notes: "",
      batterySerialNumber: "",
      customNotes: "",
      noteTemplateId: "",
      appointmentId: "",
      jobCardId: "",
    });
    setCheckInSlipFormData({} as CheckInSlipFormData);
    setSelectedCustomer(null);
    setActiveCustomerId("");
    setCustomerSearchQuery("");
    clearCustomerSearch();
    setIsEditing(false);
    setEditingId(null);
  }, [clearCustomerSearch]);

  // Filtered quotations
  const filteredQuotations = quotations.filter((q) => {
    if (filter !== "all" && q.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.quotationNumber.toLowerCase().includes(query) ||
        q.customer?.firstName?.toLowerCase().includes(query) ||
        q.customer?.phone?.includes(query) ||
        q.vehicle?.registration?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-slate-50 text-slate-600 border-slate-200";
      case "SENT_TO_CUSTOMER":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "CUSTOMER_APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "CUSTOMER_REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "SENT_TO_MANAGER":
        return "bg-violet-50 text-violet-700 border-violet-100";
      case "MANAGER_APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "MANAGER_REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Service <span className="text-blue-600">Quotations</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              Oversee, generate, and track all service center quotations in one place.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="group bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 flex items-center justify-center gap-2.5 active:scale-95"
          >
            <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Create New Quotation</span>
          </button>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 mb-8">
          <div className="flex flex-col xl:flex-row gap-5">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Find by number, customer, or registration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
              {(["all", "DRAFT", "SENT_TO_CUSTOMER", "CUSTOMER_APPROVED", "CUSTOMER_REJECTED", "SENT_TO_MANAGER", "MANAGER_APPROVED", "MANAGER_REJECTED"] as QuotationFilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${filter === f
                    ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                >
                  {f === "all"
                    ? "All Statuses"
                    : f.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quotations Content Section */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-24 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                <Loader2 className="animate-spin mb-6 text-blue-600 relative z-10" size={48} />
              </div>
              <p className="text-xl font-bold text-slate-800">Refreshing records...</p>
              <p className="text-slate-500 mt-2">Just a moment while we fetch the latest data.</p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="p-24 text-center bg-slate-50/50">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="text-slate-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">No records found</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Document Details</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Vehicle</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Creation Date</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Total Valuation</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</th>
                    <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredQuotations.map((quotation) => (
                    <tr
                      key={quotation.id}
                      onClick={() => handleOpenQuotation(quotation)}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{quotation.quotationNumber}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{quotation.documentType}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                            {quotation.customer?.firstName?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              {getCustomerDisplayName(quotation.customer) || "Customer"}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">{quotation.customer?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-bold text-slate-800">
                            {quotation.vehicle ? `${quotation.vehicle.make} ${quotation.vehicle.model}` : "Not Specified"}
                          </div>
                          <div className="text-xs font-semibold text-blue-600 mt-1 bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                            {quotation.vehicle?.registration || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Clock size={14} className="text-slate-400" />
                          {new Date(quotation.quotationDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {quotation.documentType === "Check-in Slip" ? (
                          <div className="text-sm font-medium text-slate-400 italic">No Valuation</div>
                        ) : (
                          <div className="text-sm font-extrabold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit shadow-sm">
                            ₹{quotation.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`px-4 py-1.5 text-xs font-extrabold rounded-full border-2 uppercase tracking-widest ${quotation.documentType === "Check-in Slip" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : getStatusColor(quotation.status)} shadow-sm`}>
                          {quotation.documentType === "Check-in Slip" ? "Entry Registered" : quotation.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          {quotation.documentType === "Check-in Slip" ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQuotation(quotation);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="View Check-in Slip"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Load check-in slip data and send
                                  const storedCheckInSlipData = safeStorage.getItem<any>(`checkInSlip_${quotation.id}`, null) as EnhancedCheckInSlipData | null;
                                  if (storedCheckInSlipData) {
                                    setCheckInSlipData(storedCheckInSlipData);
                                    // Find customer from storage
                                    const customers = safeStorage.getItem<CustomerWithVehicles[]>("customers", []);
                                    const customer = customers.find(c => c.id?.toString() === quotation.customerId);
                                    if (customer) {
                                      setSelectedCustomer(customer);
                                      handleSendCheckInSlipToCustomer();
                                    } else {
                                      showError("Customer not found");
                                    }
                                  } else {
                                    showError("Check-in slip data not found");
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="Send via WhatsApp"
                              >
                                <MessageCircle size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(quotation);
                                }}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="Edit Check-in Slip"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuotation(quotation.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="Delete Check-in Slip"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQuotation(quotation);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="Detailed View"
                              >
                                <Eye size={18} />
                              </button>
                              {isServiceAdvisor && quotation.status === "DRAFT" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendToCustomer(quotation.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                  title="Send to Client"
                                >
                                  <MessageCircle size={18} />
                                </button>
                              )}
                              {isServiceAdvisor && quotation.status === "CUSTOMER_APPROVED" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendToManager(quotation.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                  title="Submit to Manager"
                                >
                                  <ArrowRight size={18} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(quotation);
                                }}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="Edit Quotation"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuotation(quotation.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                title="Delete Quotation"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Quotation Modal - This will be a large modal, continuing in next part */}
      {showCreateModal && (
        <CreateQuotationModal
          form={form}
          setForm={setForm}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          activeServiceCenterId={activeServiceCenterId}
          setActiveCustomerId={setActiveCustomerId}
          customerSearchQuery={customerSearchQuery}
          setCustomerSearchQuery={setCustomerSearchQuery}
          customerSearchResults={customerSearchResults}
          clearCustomerSearch={clearCustomerSearch}
          insurers={insurers}
          noteTemplates={noteTemplates}
          totals={totals}
          addItem={addItem}
          removeItem={removeItem}
          updateItem={updateItem}
          handleNoteTemplateChange={handleNoteTemplateChange}
          handleSubmit={handleSubmit}
          handleCreateAndSendToCustomer={handleCreateAndSendToCustomer}
          handleGenerateAndSendCheckInSlip={handleGenerateAndSendCheckInSlip}
          checkInSlipFormData={checkInSlipFormData}
          setCheckInSlipFormData={setCheckInSlipFormData}
          userInfo={userInfo}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          loading={loading}
          isEditing={isEditing}
        />
      )}

      {/* Check-in Slip Modal */}
      {showCheckInSlipModal && checkInSlipData && (
        <CheckInSlip
          data={checkInSlipData as CheckInSlipData}
          onClose={() => {
            setShowCheckInSlipModal(false);
            setCheckInSlipData(null);
            resetForm();
          }}
          {...(selectedCustomer && { onSendToCustomer: () => { handleSendCheckInSlipToCustomer(); } })}
        />
      )}

      {/* View Quotation Modal */}
      {showViewModal && selectedQuotation && (
        <ViewQuotationModal
          quotation={selectedQuotation}
          userInfo={userInfo}
          userRole={userRole}
          isServiceAdvisor={isServiceAdvisor}
          isServiceManager={isServiceManager}
          onClose={() => {
            setShowViewModal(false);
            setSelectedQuotation(null);
          }}
          onSendToCustomer={handleSendToCustomer}
          onCustomerApproval={handleCustomerApproval}
          onCustomerRejection={handleCustomerRejection}
          onSendToManager={handleSendToManager}
          onManagerApproval={handleManagerApproval}
          onManagerRejection={handleManagerRejection}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function Quotations() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <QuotationsContent />
    </Suspense>
  );
}
