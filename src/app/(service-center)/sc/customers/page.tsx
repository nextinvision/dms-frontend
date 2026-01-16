"use client";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  PlusCircle,
  Clock,
  Phone,
  Mail,
  Car,
  Calendar,
  AlertCircle,
  Building2,
  History,
  Wrench,
  FileText,
  AlertTriangle,
  Edit2,
  X as XIcon,
  CheckCircle,
  User,
  MapPin,
  X,
} from "lucide-react";
import { useRole } from "@/shared/hooks";
import { appointmentsService } from "@/features/appointments/services/appointments.service";
import { getServiceCenterContext, staticServiceCenters } from "@/app/(service-center)/sc/components/service-center";
import { useCustomerSearch } from "@/app/(service-center)/sc/components/customers";
import { canCreateCustomer } from "@/shared/constants/roles";
import type {
  CustomerSearchType,
  CustomerWithVehicles,
  Vehicle,
  ServiceHistoryItem,
  NewCustomerForm,
  NewVehicleForm,
  CustomerType,
} from "@/shared/types";
import { validatePhone, validateEmail, validateVIN, cleanPhone } from "@/shared/utils/validation";
import { customerService } from "@/features/customers/services/customer.service";
import { formatVehicleString } from "../components/shared";
import type { Appointment } from "@/app/(service-center)/sc/components/appointment/types";
import type { AppointmentForm as AppointmentFormType } from "@/app/(service-center)/sc/components/appointment/types";
import { getInitialAppointmentForm, formatTime } from "@/app/(service-center)/sc/components/appointment/utils";
import { detectSearchType, getSearchTypeLabel } from "./utils/search.utils";
import { validateAppointmentData, convertToISODate, formatApiErrorMessage, isValidUUID } from "@/shared/utils/api-validation.utils";
// Extracted Hooks
import {
  useModalState,
  useRolePermissions,
  useToast,
  useServiceHistory,
  useInvoice,
  useCustomerForm,
  useVehicleForm,
} from "./hooks";

// Extracted Components
import {
  CustomerSearchBar,
  RecentCustomersTable,
  CustomerNotFound,
  CreateCustomerFormModal,
  AddVehicleFormModal,
  VehicleDetailsModal,
  AppointmentFormModal,
  ComplaintsModal,
  InvoiceModal,
} from "./components";

// Extracted Shared Components
import { Button } from "../components/shared";




export default function CustomerFind() {
  const { userInfo } = useRole();
  const router = useRouter(); // Added router
  const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);

  // Extracted Hooks
  const rolePermissions = useRolePermissions();
  const {
    isCallCenter,
    canAccessCustomerType,
    canAccessVehicleInfo,
  } = rolePermissions;
  const { userRole } = useRole();
  const canCreateNewCustomer = canCreateCustomer(userRole);
  const isServiceAdvisor = userRole === "service_advisor";

  const { toast, showToast, ToastComponent } = useToast();

  // Modal states using extracted hook
  const createFormModal = useModalState(false);
  const addVehicleModal = useModalState(false);
  const vehicleDetailsModal = useModalState(false);
  const appointmentModal = useModalState(false);
  const complaintsModal = useModalState(false);
  const serviceCenterSelectorModal = useModalState(false);

  // Service History hook - initialized with empty array
  const serviceHistoryHook = useServiceHistory([]);
  const {
    serviceHistory,
    editingFeedbackRating,
    setServiceHistory,
    setEditingFeedbackRating,
    enrichServiceHistoryWithFeedbackRatings,
    handleUpdateFeedbackRating: handleUpdateFeedbackRatingFromHook,
  } = serviceHistoryHook;

  // Invoice hook
  const invoiceHook = useInvoice();
  const {
    selectedInvoice,
    showInvoiceModal,
    setSelectedInvoice,
    setShowInvoiceModal,
    handleOpenServiceInvoice: handleOpenServiceInvoiceFromHook,
  } = invoiceHook;

  // Customer Form hook
  const customerForm = useCustomerForm();
  const {
    newCustomerForm,
    setNewCustomerForm,
    selectedState,
    setSelectedState,
    selectedCity,
    setSelectedCity,
    whatsappSameAsMobile,
    setWhatsappSameAsMobile,
    fieldErrors,
    setFieldErrors,
    resetCustomerForm,
    handleSaveNewCustomer,
  } = customerForm;

  // Vehicle Form hook - initialize without customer, will be updated when customer is selected
  const vehicleForm = useVehicleForm();
  const {
    newVehicleForm,
    setNewVehicleForm,
    vehicleFormState,
    setVehicleFormState,
    vehicleFormCity,
    setVehicleFormCity,
    hasInsurance,
    setHasInsurance,
    resetVehicleForm,
    handleSaveVehicle,
  } = vehicleForm;

  // Core state (not extracted to hooks)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVehicles | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState<boolean>(false);
  const [shouldOpenAppointmentAfterVehicleAdd, setShouldOpenAppointmentAfterVehicleAdd] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [detectedSearchType, setDetectedSearchType] = useState<CustomerSearchType | null>(null);
  const [serviceCenterSearch, setServiceCenterSearch] = useState<string>("");
  const [appointmentForm, setAppointmentForm] = useState<Partial<AppointmentFormType>>(() => getInitialAppointmentForm({
    assignedServiceAdvisor: isServiceAdvisor && userInfo?.name ? userInfo.name : "",
  }));
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [pickupAddressDifferent, setPickupAddressDifferent] = useState<boolean>(false);
  const [pickupState, setPickupState] = useState<string>("");
  const [pickupCity, setPickupCity] = useState<string>("");
  const [dropState, setDropState] = useState<string>("");
  const [dropCity, setDropCity] = useState<string>("");
  const [dropSameAsPickup, setDropSameAsPickup] = useState<boolean>(false);
  const [appointmentFieldErrors, setAppointmentFieldErrors] = useState<Record<string, string>>({});

  // Recent Customers State
  const [recentCustomers, setRecentCustomers] = useState<CustomerWithVehicles[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(true);

  const filteredServiceCenters = useMemo(() => {
    const query = serviceCenterSearch.trim().toLowerCase();
    if (!query) return staticServiceCenters;
    return staticServiceCenters.filter((center) =>
      `${center.name} ${center.city}`.toLowerCase().includes(query)
    );
  }, [serviceCenterSearch]);

  const serviceCenterFilterId = userInfo?.serviceCenter ? Number(userInfo.serviceCenter) : null;
  const shouldFilterByServiceCenter = !isCallCenter && serviceCenterFilterId;

  // Wrapper for invoice hook to match existing signature
  const handleOpenServiceInvoice = useCallback(
    (service: ServiceHistoryItem) => {
      handleOpenServiceInvoiceFromHook(service, selectedCustomer, selectedVehicle);
    },
    [selectedCustomer, selectedVehicle, handleOpenServiceInvoiceFromHook]
  );

  // Wrapper for feedback rating hook
  const handleUpdateFeedbackRating = useCallback(
    (service: ServiceHistoryItem, newRating: number) => {
      handleUpdateFeedbackRatingFromHook(service, newRating, selectedCustomer, selectedVehicle, showToast);
    },
    [selectedCustomer, selectedVehicle, showToast, handleUpdateFeedbackRatingFromHook]
  );

  const getNearestServiceCenter = useCallback(() => {
    const defaultCenter = staticServiceCenters[0]?.name ?? "";
    if (!selectedCustomer) return defaultCenter;
    const normalizedCity = selectedCustomer.cityState?.split(",")[0]?.trim().toLowerCase();
    if (normalizedCity) {
      const match = staticServiceCenters.find(
        (center) =>
          center.city?.toLowerCase().includes(normalizedCity) ||
          center.name.toLowerCase().includes(normalizedCity)
      );
      if (match) return match.name;
    }
    return defaultCenter;
  }, [selectedCustomer]);

  // Hooks for data fetching
  const { results: searchResults, loading: searchLoading, search: performSearch, clear: clearSearch } = useCustomerSearch();

  // Memoize filtered search results to prevent unnecessary recalculations
  const filteredSearchResults = useMemo(() => {
    if (!shouldFilterByServiceCenter || searchResults.length === 0) return searchResults;
    return searchResults.filter(
      (customer: CustomerWithVehicles) => Number(customer.serviceCenterId) === Number(serviceCenterFilterId)
    );
  }, [searchResults, shouldFilterByServiceCenter, serviceCenterFilterId]);

  // Fetch recent customers
  const fetchRecentCustomers = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const filters: Record<string, any> = {};
      if (!isCallCenter && serviceCenterFilterId) {
        filters.serviceCenterId = serviceCenterFilterId;
      }
      // Assuming getRecent supports filters as implemented in step 1 using standard getAll
      const data = await customerService.getRecent(10, filters);
      setRecentCustomers(data || []);
    } catch (error: any) {
      console.error("Failed to fetch recent customers", error);
      // Show user-friendly error message for 500 errors
      const errorMessage = formatApiErrorMessage(error);
      if (error?.response?.status === 500) {
        showToast(`Failed to load customers: ${errorMessage}`, "error");
      }
      // Set empty array to prevent UI crashes
      setRecentCustomers([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [isCallCenter, serviceCenterFilterId, showToast]);

  // Initial fetch
  useEffect(() => {
    fetchRecentCustomers();
  }, [fetchRecentCustomers]);

  const handleAssignNearestCenter = useCallback(() => {
    const nearest = getNearestServiceCenter();
    if (nearest) {
      const nearestCenter = staticServiceCenters.find((c) => c.name === nearest);
      setAppointmentForm((prev) => ({
        ...prev,
        assignedServiceCenter: nearest,
        // Note: serviceCenterId will be resolved when saving the appointment
      }));
    }
  }, [getNearestServiceCenter]);



  // Handle search input change
  const handleSearchInputChange = useCallback((value: string): void => {
    // Prevent search when creating customer
    if (createFormModal.isOpen) return;

    setSearchQuery(value);
    setValidationError("");
    setSelectedCustomer(null);
    setShowCreateCustomer(false);

    const trimmed = value.trim();
    const cleanedPhone = trimmed.replace(/[\s-+().]/g, "").replace(/^91/, "");
    const isPhoneNumber = /^\d{3,}$/.test(cleanedPhone);

    // For phone numbers, start searching after 3 digits
    // For other searches, start after 2 characters
    const minLength = isPhoneNumber ? 3 : 2;

    if (trimmed.length >= minLength) {
      const searchType = detectSearchType(value);
      setDetectedSearchType(searchType);
      performSearch(value, searchType);
    } else {
      clearSearch();
      setDetectedSearchType(null);
    }
  }, [performSearch, clearSearch, createFormModal.isOpen]);

  // Handle search execution
  const handleSearch = useCallback((): void => {
    // Prevent search when creating customer
    if (createFormModal.isOpen) return;

    if (!searchQuery.trim()) {
      setValidationError("Please enter a search query");
      return;
    }

    const searchType = detectSearchType(searchQuery);
    performSearch(searchQuery, searchType);
  }, [searchQuery, performSearch, createFormModal.isOpen]);

  // Handle customer selection
  const handleCustomerSelect = useCallback(async (customer: CustomerWithVehicles): Promise<void> => {
    // Navigate to customer details page instead of selecting for modal
    router.push(`/sc/customers/${customer.id}`);

    // clearSearch(); // Optional: if we want to clear search on navigation
    // setShowCreateCustomer(false);
  }, [router]);

  // Form reset functions - using hooks
  const handleResetCustomerForm = useCallback(() => {
    resetCustomerForm();
    setValidationError("");
    setFieldErrors({});
  }, [resetCustomerForm]);

  const handleResetVehicleForm = useCallback(() => {
    resetVehicleForm();
  }, [resetVehicleForm]);

  const resetAppointmentForm = useCallback(() => {
    setAppointmentForm(getInitialAppointmentForm({
      assignedServiceAdvisor: isServiceAdvisor && userInfo?.name ? userInfo.name : "",
    }));
    setEditingAppointmentId(null); // Reset editing state
    setPickupState("");
    setPickupCity("");
    setDropState("");
    setDropCity("");
    setPickupAddressDifferent(false);
    setDropSameAsPickup(false);
  }, [isServiceAdvisor, userInfo?.name]);

  // Helper to initialize appointment form with customer and optional vehicle data
  const initializeAppointmentForm = useCallback((customer: CustomerWithVehicles, vehicle?: Vehicle | null) => {
    // Determine which vehicle to use
    let vehicleToUse: Vehicle | null = null;
    if (vehicle) {
      vehicleToUse = vehicle;
    } else if (customer.vehicles && customer.vehicles.length > 0) {
      vehicleToUse = customer.vehicles[0];
    }

    // Format vehicle string
    const vehicleString = vehicleToUse
      ? `${vehicleToUse.vehicleMake || ""} ${vehicleToUse.vehicleModel || ""} ${vehicleToUse.vehicleYear ? `(${vehicleToUse.vehicleYear})` : ""}`.trim()
      : "";

    // Also format using formatVehicleString as fallback
    const formattedVehicleString = vehicleToUse
      ? formatVehicleString(vehicleToUse)
      : "";

    // Use formattedVehicleString if available, otherwise use manual format
    const finalVehicleString = formattedVehicleString || vehicleString;

    // Get service center from context or first available center
    let serviceCenterName = "";
    let serviceCenterId = "";

    if (serviceCenterContext.serviceCenterName && serviceCenterContext.serviceCenterId) {
      serviceCenterName = serviceCenterContext.serviceCenterName;
      serviceCenterId = typeof serviceCenterContext.serviceCenterId === 'number'
        ? serviceCenterContext.serviceCenterId.toString()
        : serviceCenterContext.serviceCenterId;
    } else if (staticServiceCenters.length > 0) {
      // Fallback to first available service center
      serviceCenterName = staticServiceCenters[0].name;
      serviceCenterId = (staticServiceCenters[0] as any)?.serviceCenterId || staticServiceCenters[0]?.id?.toString() || "";
    }

    setAppointmentForm({
      ...getInitialAppointmentForm({
        assignedServiceAdvisor: isServiceAdvisor && userInfo?.name ? userInfo.name : "",
      }),
      customerName: customer.name || "",
      phone: customer.phone || "",
      vehicle: finalVehicleString,
      customerId: customer.id || "",
      vehicleId: vehicleToUse?.id || "",
      serviceType: "",
      serviceCenterName: serviceCenterName,
      serviceCenterId: serviceCenterId,
    });

    // Set selected vehicle
    setSelectedVehicle(vehicleToUse);
  }, [setAppointmentForm, isServiceAdvisor, userInfo, serviceCenterContext, staticServiceCenters]);

  // Modal close handlers - defined once
  const closeCustomerFormHandler = useCallback(() => {
    createFormModal.close();
    setValidationError("");
    setFieldErrors({});
    resetCustomerForm();
    // Clear search query to show recent customers list again
    setSearchQuery("");
    clearSearch();
  }, [createFormModal, resetCustomerForm, clearSearch]);

  const closeVehicleFormHandler = useCallback(() => {
    addVehicleModal.close();
    resetVehicleForm();
    const wasOpeningAppointment = shouldOpenAppointmentAfterVehicleAdd;
    setShouldOpenAppointmentAfterVehicleAdd(false);
    // Only clear selectedCustomer and search if we're not opening appointment after (to show list again)
    if (!wasOpeningAppointment) {
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setSearchQuery("");
      clearSearch();
    }
  }, [addVehicleModal, resetVehicleForm, shouldOpenAppointmentAfterVehicleAdd, clearSearch]);

  const closeAppointmentFormHandler = useCallback(() => {
    // Clean up file URLs before closing
    setAppointmentForm((prev: Partial<AppointmentFormType>) => {
      if (prev.customerIdProof?.urls) {
        prev.customerIdProof.urls.forEach((url: string) => URL.revokeObjectURL(url));
      }
      if (prev.vehicleRCCopy?.urls) {
        prev.vehicleRCCopy.urls.forEach((url: string) => URL.revokeObjectURL(url));
      }
      if (prev.warrantyCardServiceBook?.urls) {
        prev.warrantyCardServiceBook.urls.forEach((url: string) => URL.revokeObjectURL(url));
      }
      if (prev.photosVideos?.urls) {
        prev.photosVideos.urls.forEach((url: string) => URL.revokeObjectURL(url));
      }
      return getInitialAppointmentForm({
        assignedServiceAdvisor: isServiceAdvisor && userInfo?.name ? userInfo.name : "",
      });
    });
    setEditingAppointmentId(null); // Reset editing state
    appointmentModal.close();
    setValidationError("");
    setAppointmentFieldErrors({});
    setPickupState("");
    setPickupCity("");
    setDropState("");
    setDropCity("");
    setPickupAddressDifferent(false);
    setDropSameAsPickup(false);
    // Clear selected customer and vehicle, and reset search to show recent customers list again
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setSearchQuery("");
    clearSearch();
  }, [appointmentModal, isServiceAdvisor, userInfo, clearSearch]);

  // Modal close handlers (using extracted handlers)
  const closeCustomerForm = closeCustomerFormHandler;
  const closeVehicleForm = closeVehicleFormHandler;
  const closeAppointmentForm = closeAppointmentFormHandler;

  // Handle direct create customer button
  const handleDirectCreateCustomer = useCallback((): void => {
    // Check permission before allowing customer creation
    if (!canCreateNewCustomer) {
      showToast("You do not have permission to create new customers.", "error");
      return;
    }

    // Clear search when opening create form
    setSearchQuery("");
    clearSearch();
    setSelectedCustomer(null);
    setShowCreateCustomer(false);
    setDetectedSearchType(null);
    setValidationError("");

    createFormModal.open();
    resetCustomerForm();
  }, [canCreateNewCustomer, resetCustomerForm, clearSearch, showToast, createFormModal]);

  // Wrapper for customer form save - using hook's handleSaveNewCustomer
  const handleSaveNewCustomerWrapper = useCallback(async (): Promise<void> => {
    const customer = await handleSaveNewCustomer(
      rolePermissions.userRole,
      serviceCenterFilterId,
      showToast,
      setSelectedCustomer, // Set the selected customer
      (show: boolean) => {
        if (show) createFormModal.open();
        else createFormModal.close();
      },
      setShowCreateCustomer,
      () => {
        // Auto-refresh customer list
        fetchRecentCustomers();
      }
    );
    if (customer) {
      createFormModal.close();
      // Navigate to customer detail page after successful creation
      router.push(`/sc/customers/${customer.id}`);
    }
  }, [
    handleSaveNewCustomer,
    rolePermissions.userRole,
    serviceCenterFilterId,
    showToast,
    setSelectedCustomer,
    createFormModal,
    setShowCreateCustomer,
    router,
    fetchRecentCustomers
  ]);

  // Show create customer if search returned no results
  const shouldShowCreateCustomer =
    showCreateCustomer || (searchQuery.trim().length >= 2 && filteredSearchResults.length === 0 && !searchLoading);

  return (
    <div className="bg-gray-50 min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-10">
      {/* Toast Notification */}
      <ToastComponent />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Customers
              </h1>
              <p className="text-gray-600 text-sm mt-1.5">
                Search by phone, email, customer ID, VIN, or vehicle number
              </p>
            </div>
            {canCreateNewCustomer && (
              <Button onClick={handleDirectCreateCustomer} icon={PlusCircle} className="self-start sm:self-auto">
                Create New Customer
              </Button>
            )}
          </div>
        </div>

        {/* Global Search Section - Using Extracted Component */}
        <CustomerSearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchInputChange}
          onSearch={handleSearch}
          searchLoading={searchLoading}
          showCreateForm={createFormModal.isOpen}
          detectedSearchType={detectedSearchType}
          validationError={validationError}
          filteredSearchResults={filteredSearchResults}
          onCustomerSelect={handleCustomerSelect}
          isCallCenter={isCallCenter}
        />

        {/* Recent Customers Section - Always show when no customer selected and not creating */}
        {!selectedCustomer && !createFormModal.isOpen && !addVehicleModal.isOpen && !vehicleDetailsModal.isOpen && !appointmentModal.isOpen && searchQuery.length < 2 && (
          <RecentCustomersTable
            recentCustomers={recentCustomers}
            isCallCenter={isCallCenter}
            onCustomerSelect={handleCustomerSelect}
            onScheduleClick={(e, customer) => {
              e.stopPropagation();
              setSelectedCustomer(customer);
              initializeAppointmentForm(customer);
              vehicleDetailsModal.close();
              appointmentModal.open();

              const availableVehicles = customer.vehicles?.filter(
                (v) => v.currentStatus !== "Active Job Card"
              ) || [];

              if (availableVehicles.length === 0) {
                resetVehicleForm();
                if (customer.cityState) {
                  const parts = customer.cityState.split(",");
                  if (parts.length >= 2) {
                    setVehicleFormCity(parts[0]?.trim() || "");
                    setVehicleFormState(parts[1]?.trim() || "");
                  }
                }
                setShouldOpenAppointmentAfterVehicleAdd(true);
                addVehicleModal.open();
              }
            }}
            setSelectedCustomer={setSelectedCustomer}
            initializeAppointmentForm={initializeAppointmentForm}
            setShowVehicleDetails={(show: boolean) => {
              if (show) vehicleDetailsModal.open();
              else vehicleDetailsModal.close();
            }}
            setShowScheduleAppointment={(show: boolean) => {
              if (show) appointmentModal.open();
              else appointmentModal.close();
            }}
            resetVehicleForm={resetVehicleForm}
            setVehicleFormCity={setVehicleFormCity}
            setVehicleFormState={setVehicleFormState}
            setShouldOpenAppointmentAfterVehicleAdd={setShouldOpenAppointmentAfterVehicleAdd}
            setShowAddVehiclePopup={(show: boolean) => {
              if (show) addVehicleModal.open();
              else addVehicleModal.close();
            }}
            loading={loadingRecent}
          />
        )}

        {/* Customer Not Found - Create New */}
        {shouldShowCreateCustomer && !createFormModal.isOpen && (
          <CustomerNotFound
            canCreateNewCustomer={canCreateNewCustomer}
            onCreateCustomer={handleDirectCreateCustomer}
          />
        )}

        {/* Create Customer Form Modal */}
        <CreateCustomerFormModal
          isOpen={createFormModal.isOpen && canCreateNewCustomer}
          onClose={closeCustomerForm}
          formData={newCustomerForm}
          onFormChange={(data) => setNewCustomerForm(data)}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          whatsappSameAsMobile={whatsappSameAsMobile}
          onWhatsappSameAsMobileChange={setWhatsappSameAsMobile}
          fieldErrors={fieldErrors}
          onFieldErrorChange={setFieldErrors}

          isLoading={false}
          onSubmit={async () => {
            await handleSaveNewCustomerWrapper();
          }}
        />

        {/* Customer Details Modal - REMOVED (Navigating to page instead) */}


        {/* Add Vehicle Popup Form */}
        <AddVehicleFormModal
          isOpen={addVehicleModal.isOpen}
          customer={selectedCustomer}
          formData={newVehicleForm}
          onFormChange={(data) => setNewVehicleForm(data)}
          vehicleFormState={vehicleFormState}
          onVehicleFormStateChange={setVehicleFormState}
          vehicleFormCity={vehicleFormCity}
          onVehicleFormCityChange={setVehicleFormCity}
          hasInsurance={hasInsurance}
          onHasInsuranceChange={setHasInsurance}

          onClose={closeVehicleForm}
          onSubmit={async () => {
            if (!selectedCustomer) return;
            await handleSaveVehicle(
              selectedCustomer,
              showToast,
              setSelectedCustomer,
              setSelectedVehicle,
              closeVehicleForm,
              shouldOpenAppointmentAfterVehicleAdd,
              initializeAppointmentForm,
              (show: boolean) => {
                if (show) appointmentModal.open();
                else appointmentModal.close();
              },
              (show: boolean) => {
                if (show) vehicleDetailsModal.open();
                else vehicleDetailsModal.close();
              },
              setShouldOpenAppointmentAfterVehicleAdd
            );
          }}
        />

        {/* Vehicle Details Modal */}
        {vehicleDetailsModal.isOpen && selectedVehicle && selectedCustomer && (
          <VehicleDetailsModal
            isOpen={vehicleDetailsModal.isOpen}
            vehicle={selectedVehicle}
            customer={selectedCustomer}
            serviceHistory={serviceHistory}
            editingFeedbackRating={editingFeedbackRating}
            onClose={() => {
              vehicleDetailsModal.close();
              // Clear selected vehicle and customer, and reset search to show recent customers list again
              setSelectedVehicle(null);
              setSelectedCustomer(null);
              setServiceHistory([]);
              setSearchQuery("");
              clearSearch();
            }}
            onScheduleAppointment={() => {
              vehicleDetailsModal.close();
              appointmentModal.open();
              initializeAppointmentForm(selectedCustomer, selectedVehicle);
            }}
            onUpdateFeedbackRating={handleUpdateFeedbackRating}
            onSetEditingFeedbackRating={setEditingFeedbackRating}
            onOpenInvoice={handleOpenServiceInvoice}
          />
        )}

        {/* Schedule Appointment Modal */}
        <AppointmentFormModal
          isOpen={appointmentModal.isOpen && !vehicleDetailsModal.isOpen}
          customer={selectedCustomer}
          vehicle={selectedVehicle}
          initialFormData={appointmentForm}
          onClose={closeAppointmentForm}
          onSubmit={async (form: AppointmentFormType) => {
            // Validate required fields
            if (!selectedCustomer?.id) {
              showToast("Customer ID is missing. Please select a customer.", "error");
              return;
            }

            if (!selectedVehicle?.id) {
              showToast("Vehicle ID is missing. Please select a vehicle.", "error");
              return;
            }

            // Get service center ID - prefer form selection, fallback to user's service center context
            let serviceCenterId: string | null = null;

            // First, try to get from form selection
            if (form.serviceCenterName) {
              const selectedServiceCenter = staticServiceCenters.find((center) => center.name === form.serviceCenterName);
              serviceCenterId = (selectedServiceCenter as any)?.serviceCenterId || selectedServiceCenter?.id?.toString() || null;
            }

            // Fallback: Try to get from form's serviceCenterId field
            if (!serviceCenterId && form.serviceCenterId) {
              serviceCenterId = typeof form.serviceCenterId === 'number'
                ? form.serviceCenterId.toString()
                : form.serviceCenterId;
            }

            // Fallback to service center context from logged-in user
            if (!serviceCenterId && serviceCenterContext.serviceCenterId) {
              const contextId = typeof serviceCenterContext.serviceCenterId === 'number'
                ? serviceCenterContext.serviceCenterId.toString()
                : serviceCenterContext.serviceCenterId;

              // If context ID is a UUID, use it directly
              if (isValidUUID(contextId)) {
                serviceCenterId = contextId;
              } else {
                // If it's not a UUID (e.g., numeric ID), try to find matching service center
                const matchingCenter = staticServiceCenters.find((center: any) =>
                  center.id?.toString() === contextId ||
                  (center as any).serviceCenterId?.toString() === contextId ||
                  center.name === serviceCenterContext.serviceCenterName
                );
                if (matchingCenter) {
                  serviceCenterId = (matchingCenter as any)?.serviceCenterId || matchingCenter?.id?.toString() || null;
                }
              }
            }

            // Final fallback: Use first available service center if none found
            if (!serviceCenterId && staticServiceCenters.length > 0) {
              const firstCenter = staticServiceCenters[0];
              serviceCenterId = (firstCenter as any)?.serviceCenterId || firstCenter?.id?.toString() || null;
            }

            // If still no service center ID, show error
            if (!serviceCenterId) {
              showToast("Service Center ID is required. Please select a service center in the form or ensure your user account is associated with a service center.", "error");
              return;
            }

            // Validate it's a valid UUID
            if (!isValidUUID(serviceCenterId)) {
              // If not a UUID, it might be a numeric ID - show error and ask user to select from dropdown
              showToast("Invalid Service Center ID. Please select a service center from the dropdown.", "error");
              return;
            }

            // Convert date to ISO format
            const appointmentDate = convertToISODate(form.date);

            // Validate all required fields
            const validation = validateAppointmentData({
              customerId: selectedCustomer.id.toString(),
              vehicleId: selectedVehicle.id.toString(),
              serviceCenterId,
              serviceType: form.serviceType,
              appointmentDate,
              appointmentTime: form.time,
            });

            if (!validation.valid) {
              showToast(validation.errors.join("; "), "error");
              return;
            }

            // Prepare documentation files array (not just counts)
            const documentationFiles: any = {};
            if (form.customerIdProof?.urls && form.customerIdProof.urls.length > 0) {
              documentationFiles.customerIdProof = form.customerIdProof.metadata?.map((meta: any, idx: number) => ({
                url: form.customerIdProof?.urls[idx] || meta.url || '',
                publicId: meta.publicId || '',
                filename: meta.filename || `id-proof-${idx}.pdf`,
                format: meta.format || 'pdf',
                bytes: meta.bytes || 0,
                width: meta.width,
                height: meta.height,
              })) || [];
            }
            if (form.vehicleRCCopy?.urls && form.vehicleRCCopy.urls.length > 0) {
              documentationFiles.vehicleRCCopy = form.vehicleRCCopy.metadata?.map((meta: any, idx: number) => ({
                url: form.vehicleRCCopy?.urls[idx] || meta.url || '',
                publicId: meta.publicId || '',
                filename: meta.filename || `rc-copy-${idx}.pdf`,
                format: meta.format || 'pdf',
                bytes: meta.bytes || 0,
                width: meta.width,
                height: meta.height,
              })) || [];
            }
            if (form.warrantyCardServiceBook?.urls && form.warrantyCardServiceBook.urls.length > 0) {
              documentationFiles.warrantyCardServiceBook = form.warrantyCardServiceBook.metadata?.map((meta: any, idx: number) => ({
                url: form.warrantyCardServiceBook?.urls[idx] || meta.url || '',
                publicId: meta.publicId || '',
                filename: meta.filename || `warranty-${idx}.pdf`,
                format: meta.format || 'pdf',
                bytes: meta.bytes || 0,
                width: meta.width,
                height: meta.height,
              })) || [];
            }
            if (form.photosVideos?.urls && form.photosVideos.urls.length > 0) {
              documentationFiles.photosVideos = form.photosVideos.metadata?.map((meta: any, idx: number) => ({
                url: form.photosVideos?.urls[idx] || meta.url || '',
                publicId: meta.publicId || '',
                filename: meta.filename || `photo-${idx}.jpg`,
                format: meta.format || 'jpg',
                bytes: meta.bytes || 0,
                width: meta.width,
                height: meta.height,
                duration: meta.duration,
              })) || [];
            }

            // Build appointment data according to backend DTO
            const appointmentData: any = {
              customerId: selectedCustomer.id, // Required UUID
              vehicleId: selectedVehicle.id, // Required UUID
              serviceCenterId: serviceCenterId, // Required UUID
              serviceType: form.serviceType, // Required
              appointmentDate: appointmentDate!, // Required - backend expects ISO date string (validated above)
              appointmentTime: formatTime(form.time) || form.time, // Required
              customerComplaint: form.customerComplaint,
              previousServiceHistory: form.previousServiceHistory,
              estimatedServiceTime: form.estimatedServiceTime,
              estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
              estimatedDeliveryDate: form.estimatedDeliveryDate,
              assignedServiceAdvisor: form.assignedServiceAdvisor,
              assignedTechnician: form.assignedTechnician,
              pickupDropRequired: form.pickupDropRequired || false,
              pickupAddress: form.pickupAddress,
              pickupState: (form as any).pickupState,
              pickupCity: (form as any).pickupCity,
              pickupPincode: (form as any).pickupPincode,
              dropAddress: form.dropAddress,
              dropState: (form as any).dropState,
              dropCity: (form as any).dropCity,
              dropPincode: (form as any).dropPincode,
              preferredCommunicationMode: form.preferredCommunicationMode,
              odometerReading: form.odometerReading,
              duration: form.duration ? `${form.duration} hours` : undefined,
              documentationFiles: Object.keys(documentationFiles).length > 0 ? documentationFiles : undefined,
            };

            // Create or update appointment via API
            try {
              console.log("[Appointment] Sending payload:", appointmentData);

              // Determine if we're editing (check both state and form data)
              let appointmentIdToUpdate = editingAppointmentId || (form as any).id || (form as any).appointmentId;

              // If no appointment ID found, check if vehicle already has an active appointment
              // If so, we should update it instead of creating a new one
              if (!appointmentIdToUpdate && selectedVehicle?.id) {
                try {
                  // Fetch appointments for this vehicle
                  const allAppointments = await appointmentsService.getAll({
                    vehicleId: selectedVehicle.id
                  });

                  // Find the most recent active appointment for this vehicle
                  const activeAppointment = Array.isArray(allAppointments)
                    ? allAppointments.find((apt: any) =>
                      (apt.vehicleId === selectedVehicle.id || apt.vehicle?.id === selectedVehicle.id) &&
                      apt.status &&
                      !['CANCELLED', 'COMPLETED'].includes(apt.status.toUpperCase())
                    )
                    : null;

                  if (activeAppointment?.id) {
                    appointmentIdToUpdate = activeAppointment.id;
                    console.log("[Appointment] Found existing active appointment, will update:", appointmentIdToUpdate);
                  }
                } catch (error) {
                  // If we can't fetch appointments, proceed with create
                  console.warn("[Appointment] Could not check for existing appointments:", error);
                }
              }

              if (appointmentIdToUpdate) {
                // Update existing appointment
                await appointmentsService.update(appointmentIdToUpdate, appointmentData);
                showToast(`Appointment updated successfully! Customer: ${form.customerName} | Vehicle: ${form.vehicle} | Service: ${form.serviceType} | Date: ${form.date} | Time: ${formatTime(form.time)}`, "success");
              } else {
                // Create new appointment
                await appointmentsService.create(appointmentData);
                showToast(`Appointment scheduled successfully! Customer: ${form.customerName} | Vehicle: ${form.vehicle} | Service: ${form.serviceType} | Date: ${form.date} | Time: ${formatTime(form.time)}`, "success");
              }

              // Refresh recent customers to show updated data
              fetchRecentCustomers();

              // Close modal and reset form
              closeAppointmentForm();
            } catch (error: any) {
              console.error("Failed to schedule appointment", error);
              const errorMessage = formatApiErrorMessage(error);
              showToast(errorMessage, "error");
            }
          }}
          canAccessCustomerType={canAccessCustomerType}
          canAccessVehicleInfo={canAccessVehicleInfo}
        />

        {/* Complaints Modal */}
        <ComplaintsModal
          isOpen={complaintsModal.isOpen}
          onClose={complaintsModal.close}
          customer={selectedCustomer}
        />

        {/* Invoice Modal */}
        <InvoiceModal
          isOpen={showInvoiceModal}
          invoice={selectedInvoice}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
          }}
        />

        {serviceCenterSelectorModal.isOpen && (
          <div className="fixed inset-0 z-12000 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Choose Service Center</h3>
                <button
                  type="button"
                  onClick={() => {
                    serviceCenterSelectorModal.close();
                    setServiceCenterSearch("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  aria-label="Close service center selector"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <input
                  type="text"
                  placeholder="Search service center..."
                  value={serviceCenterSearch}
                  onChange={(e) => setServiceCenterSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                  {filteredServiceCenters.map((center) => (
                    <button
                      key={center.id}
                      type="button"
                      onClick={() => {
                        setAppointmentForm((prev) => ({
                          ...prev,
                          assignedServiceCenter: center.name,
                        }));
                        serviceCenterSelectorModal.close();
                        setServiceCenterSearch("");
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-left hover:bg-indigo-50 transition"
                    >
                      <div className="font-semibold text-gray-900">{center.name}</div>
                      <p className="text-xs text-gray-500">{center.city}</p>
                    </button>
                  ))}
                  {filteredServiceCenters.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">No service centers match your search.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

