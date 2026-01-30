"use client";
import { Suspense, useCallback, useMemo } from "react";
import { Calendar } from "lucide-react";
import { AppointmentGrid, Toast, AppointmentDetailModal, CustomerSearchModal } from "../components/appointments";
import CheckInSlip from "@/components/check-in-slip/CheckInSlip";
import { AppointmentFormModal } from "../components/appointment/AppointmentFormModal";
import { useAppointmentLogic } from "./hooks/useAppointmentLogic";
import { canCreateAppointment } from "@/shared/constants/roles";
import type { JobCard } from "@/shared/types/job-card.types";
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { populateJobCardPart1, createEmptyJobCardPart1 } from "@/shared/utils/jobCardData.util";
import { generateJobCardNumber } from "@/shared/utils/job-card.utils";
import { jobCardService } from "@/features/job-cards/services/jobCard.service";
import { useCreateJobCard } from "@/features/job-cards/hooks/useJobCards";
import { customerService } from "@/features/customers/services/customer.service";
import { SERVICE_CENTER_CODE_MAP } from "./constants";
import type { AppointmentRecord } from "./types";
import type { CustomerWithVehicles, Vehicle } from "@/shared/types";
import { formatVehicleString } from "./utils";
import { useRouter } from "next/navigation";
import {
  canEditCustomerInfo,
  canEditVehicleInfo,
} from "@/shared/constants/roles";
import { migrateAllJobCards } from "@/features/job-cards/utils/migrateJobCards.util";

function AppointmentsContent() {
  const {
    appointments,
    visibleAppointments,
    selectedAppointment,
    setSelectedAppointment,
    showDetailModal,
    setShowDetailModal,
    showAppointmentFormModal,
    setShowAppointmentFormModal,
    showCheckInSlipModal,
    setShowCheckInSlipModal,
    appointmentFormData,
    setAppointmentFormData,
    selectedAppointmentCustomer,
    setSelectedAppointmentCustomer,
    selectedAppointmentVehicle,
    setSelectedAppointmentVehicle,
    customerSearchValue,
    setCustomerSearchValue,
    toast,
    showToast,
    handleAppointmentClick,
    handleDeleteAppointment,
    handleCloseAppointmentForm,
    handleCustomerSelectForAppointment,
    handleSubmitAppointmentForm,
    handleSubmitAppointmentFormWithFiles,
    handleCustomerArrivedFromForm,
    handleOpenJobCard,
    handleGenerateCheckInSlip,
    availableServiceCenters,
    currentJobCard,
    setCurrentJobCard,
    currentJobCardId,
    setCurrentJobCardId,
    checkInSlipData,
    setShowVehicleDetails,
    customerArrivalStatus,
    setCustomerArrivalStatus,
    isCallCenter,
    isServiceAdvisor,
    userInfo,
    userRole,
    serviceCenterContext,
    appointmentCustomerSearchResults,
    appointmentCustomerSearchLoadingState,
    searchAppointmentCustomer,
    clearAppointmentCustomerSearch,
    detailCustomer,
    // updateStoredJobCard removed - backend API only
    appointmentsState: { setRawAppointments: setAppointments },
    setCheckInSlipData,
    loading,
  } = useAppointmentLogic();

  const router = useRouter();
  const canCreateNewAppointment = canCreateAppointment(userRole);

  // Role permissions
  const canEditCustomerInformation = canEditCustomerInfo(userRole);
  const canEditVehicleInformation = canEditVehicleInfo(userRole);

  // Optimize job card lookup
  const jobCardLookup = useMemo(() => {
    if (typeof window === "undefined") return new Map<string, string>();
    try {
      // Assuming migrateAllJobCards is necessary to get the latest state
      const jobCards = migrateAllJobCards();
      const map = new Map<string, string>();
      jobCards.forEach((card: any) => {
        if (card.sourceAppointmentId) {
          map.set(card.sourceAppointmentId.toString(), card.id);
        }
      });
      return map;
    } catch (error) {
      console.error("Error creating job card lookup:", error);
      return new Map<string, string>();
    }
  }, []); // Empty dependency array means this runs once on mount. 
  // If job cards change often, we might need a signal to re-run, but for now this is much better than per-row.

  const getJobCardId = useCallback((appointmentId: number | string): string | null => {
    return jobCardLookup.get(appointmentId.toString()) || null;
  }, [jobCardLookup]);

  const handleOpenNewAppointment = useCallback(() => {
    if (!canCreateNewAppointment) {
      showToast("You do not have permission to create new appointments.", "error");
      return;
    }
    setSelectedAppointmentCustomer(null);
    setSelectedAppointmentVehicle(null);
    // getInitialAppointmentForm is imported in hook, but we need reset logic here or use exposed setter with default?
    // In logic hook, handleClose resets it. Here we want to open fresh.
    // We can rely on handleClose having reset it, or reset it now.
    // Ideally use a reset action.
    // For now:
    setShowAppointmentFormModal(true);
  }, [canCreateNewAppointment, showToast, setSelectedAppointmentCustomer, setSelectedAppointmentVehicle, setShowAppointmentFormModal]);

  // Temporary local helper until moved to hook fully
  const convertAppointmentToJobCard = useCallback(async (appointment: AppointmentRecord): Promise<JobCard> => {
    try {
      // Validate required IDs (must be UUIDs from backend)
      if (!appointment.customerExternalId) {
        throw new Error("Customer ID is required to create job card");
      }
      if (!appointment.vehicleExternalId) {
        throw new Error("Vehicle ID is required to create job card");
      }
      if (!appointment.serviceCenterId) {
        throw new Error("Service Center ID is required to create job card");
      }

      // Fetch customer and vehicle data for part1 form
      let customerData: CustomerWithVehicles | null = null;
      let vehicleData: Vehicle | null = null;

      try {
        customerData = await customerService.getById(appointment.customerExternalId);
        if (customerData.vehicles) {
          vehicleData = customerData.vehicles.find((v) => v.id === appointment.vehicleExternalId) || customerData.vehicles[0] || null;
        }
      } catch (err) {
        console.warn("Could not fetch customer data for job card:", err);
      }

      // Prepare DTO for backend (matches CreateJobCardDto)
      const createJobCardDto = {
        serviceCenterId: appointment.serviceCenterId.toString(),
        customerId: appointment.customerExternalId.toString(),
        vehicleId: appointment.vehicleExternalId.toString(),
        appointmentId: appointment.id?.toString(), // Link to appointment
        serviceType: appointment.serviceType,
        priority: "NORMAL" as const, // Backend enum: LOW, NORMAL, HIGH, CRITICAL
        location: "STATION" as const, // Backend enum: STATION, DOORSTEP
        part1Data: customerData && vehicleData ? {
          customerName: appointment.customerName || customerData.name,
          phone: appointment.phone || customerData.phone,
          vehicleMake: vehicleData.vehicleMake,
          vehicleModel: vehicleData.vehicleModel,
          registration: vehicleData.registration,
          customerComplaint: appointment.customerComplaint,
          estimatedDeliveryDate: appointment.estimatedDeliveryDate,
          warrantyStatus: appointment.warrantyStatus,
          technicianObservation: appointment.technicianObservation,
          // Add other part1 fields as needed
        } : undefined,
        uploadedBy: userInfo?.id, // Current user creating the job card
      };

      // Root-level fix: Use React Query mutation for automatic cache invalidation
      // Note: DTO structure differs from frontend JobCard type, backend will handle conversion
      const createdJobCard = await createJobCardMutation.mutateAsync({ 
        data: createJobCardDto as any, 
        userId: undefined 
      });

      // Set current job card ID for UI tracking
      setCurrentJobCardId(createdJobCard.id);

      showToast("Job card created successfully!", "success");
      return createdJobCard as JobCard;

    } catch (error: any) {
      console.error("Error creating job card from appointment:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to create job card";
      showToast(errorMessage, "error");
      throw error;
    }
  }, [serviceCenterContext, setCurrentJobCardId, userInfo, showToast]);

  const handleConvertToQuotation = useCallback(async () => {
    if (!selectedAppointment) return;

    if (!selectedAppointment.vehicleBrand && !selectedAppointment.vehicle) {
      showToast("Please ensure vehicle information is available in the appointment.", "error");
      return;
    }

    if (!currentJobCardId) {
      await convertAppointmentToJobCard(selectedAppointment);
    }

    // Logic for navigation to quotation
    const customerIdForQuotation = detailCustomer?.id?.toString() || selectedAppointment.customerExternalId || undefined;
    const serviceCenterIdForQuotation = selectedAppointment.serviceCenterId?.toString() || serviceCenterContext.serviceCenterId || undefined;
    const serviceCenterNameForQuotation = selectedAppointment.serviceCenterName || serviceCenterContext.serviceCenterName || undefined;

    const quotationData = {
      appointmentId: selectedAppointment.id,
      customerName: selectedAppointment.customerName,
      phone: selectedAppointment.phone,
      vehicle: selectedAppointment.vehicle,
      customerId: customerIdForQuotation,
      serviceCenterId: serviceCenterIdForQuotation,
      serviceCenterName: serviceCenterNameForQuotation,
      jobCardId: currentJobCardId,
      appointmentData: selectedAppointment,
    };

    safeStorage.setItem("pendingQuotationFromAppointment", quotationData);
    router.push("/sc/quotations?fromAppointment=true");
    setShowDetailModal(false);
  }, [selectedAppointment, currentJobCardId, detailCustomer, serviceCenterContext, convertAppointmentToJobCard, router, setShowDetailModal, showToast]);

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="pt-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Appointments</h1>
            <p className="text-gray-500">Schedule and manage customer appointments</p>
          </div>
          {canCreateNewAppointment && (
            <button
              onClick={handleOpenNewAppointment}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2"
            >
              <Calendar size={20} />
              New Appointment
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : (
            <AppointmentGrid
              appointments={visibleAppointments}
              onAppointmentClick={handleAppointmentClick}
              onDeleteAppointment={handleDeleteAppointment}
              onOpenJobCard={handleOpenJobCard}
              getJobCardId={getJobCardId}
              isCallCenter={isCallCenter}
            />
          )}
        </div>
      </div>

      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          appointment={selectedAppointment}
          detailCustomer={detailCustomer}
          isCallCenter={isCallCenter}
          isServiceAdvisor={isServiceAdvisor}
          customerArrivalStatus={customerArrivalStatus}
          currentJobCard={currentJobCard}
          availableServiceCenters={availableServiceCenters}
          onCustomerArrived={() => setCustomerArrivalStatus("arrived")}
          onCustomerNotArrived={() => setCustomerArrivalStatus("not_arrived")}
          setCurrentJobCard={setCurrentJobCard}
          setCheckInSlipData={setCheckInSlipData}
          setShowCheckInSlipModal={setShowCheckInSlipModal}
          setAppointments={setAppointments} // Internal setter
          setSelectedAppointment={setSelectedAppointment}
          showToast={showToast}
          appointments={appointments}
          onGenerateCheckInSlip={handleGenerateCheckInSlip}
          currentJobCardId={currentJobCardId}
        />
      )}

      {showCheckInSlipModal && checkInSlipData && (
        <CheckInSlip data={checkInSlipData} onClose={() => setShowCheckInSlipModal(false)} />
      )}

      {showAppointmentFormModal && (selectedAppointmentCustomer || selectedAppointment) && (
        <AppointmentFormModal
          isOpen={showAppointmentFormModal}
          customer={selectedAppointmentCustomer}
          vehicle={selectedAppointmentVehicle}
          initialFormData={appointmentFormData}
          onClose={handleCloseAppointmentForm}
          onSubmit={handleSubmitAppointmentForm}
          onSubmitWithFiles={handleSubmitAppointmentFormWithFiles as any}
          canAccessCustomerType={true} // Simplify logic for now
          canAccessVehicleInfo={true}
          existingAppointments={appointments.filter(apt => apt.id !== selectedAppointment?.id)}
          onCustomerArrived={isServiceAdvisor ? handleCustomerArrivedFromForm : undefined}
          appointmentStatus={selectedAppointment?.status}
          customerArrived={selectedAppointment?.status === "IN_PROGRESS" || selectedAppointment?.status === "SENT_TO_MANAGER"}
        />
      )}

      <CustomerSearchModal
        isOpen={showAppointmentFormModal && !selectedAppointmentCustomer && !selectedAppointment}
        onClose={handleCloseAppointmentForm}
        searchValue={customerSearchValue}
        onSearchChange={setCustomerSearchValue}
        onSearch={searchAppointmentCustomer}
        onClearSearch={clearAppointmentCustomerSearch}
        customers={appointmentCustomerSearchResults}
        loading={appointmentCustomerSearchLoadingState}
        onSelectCustomer={handleCustomerSelectForAppointment}
      />
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
