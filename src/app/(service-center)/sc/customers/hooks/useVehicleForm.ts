/**
 * Hook for managing vehicle form state, validation, and submission
 * Preserves prefilled customer info + manual vehicle entry pattern
 */

import { useState, useCallback } from "react";
import { customerService } from "@/features/customers/services/customer.service";
import { vehicleService } from "@/features/vehicles/services/vehicle.service";
import { validateVIN } from "@/shared/utils/validation";
import { initialVehicleForm } from "../constants/form.constants";
import type { NewVehicleForm, Vehicle, CustomerWithVehicles } from "@/shared/types";

export interface UseVehicleFormReturn {
  newVehicleForm: Partial<NewVehicleForm>;
  setNewVehicleForm: React.Dispatch<React.SetStateAction<Partial<NewVehicleForm>>>;
  vehicleFormState: string;
  setVehicleFormState: React.Dispatch<React.SetStateAction<string>>;
  vehicleFormCity: string;
  setVehicleFormCity: React.Dispatch<React.SetStateAction<string>>;
  hasInsurance: boolean;
  setHasInsurance: React.Dispatch<React.SetStateAction<boolean>>;
  resetVehicleForm: () => void;
  validateVehicleForm: () => { error: string | null };
  handleSaveVehicle: (
    selectedCustomer: CustomerWithVehicles,
    showToast: (message: string, type: "success" | "error") => void,
    setSelectedCustomer: (customer: CustomerWithVehicles) => void,
    setSelectedVehicle: (vehicle: Vehicle | null) => void,
    closeVehicleForm: () => void,
    shouldOpenAppointmentAfterVehicleAdd: boolean,
    initializeAppointmentForm: (customer: CustomerWithVehicles, vehicle: Vehicle) => void,
    setShowScheduleAppointment: (show: boolean) => void,
    setShowVehicleDetails: (show: boolean) => void,
    setShouldOpenAppointmentAfterVehicleAdd: (should: boolean) => void
  ) => Promise<Vehicle | null>;
  handleUpdateVehicle: (
    vehicleId: string,
    selectedCustomer: CustomerWithVehicles,
    showToast: (message: string, type: "success" | "error") => void,
    setSelectedCustomer: (customer: CustomerWithVehicles) => void,
    setSelectedVehicle: (vehicle: Vehicle | null) => void,
    closeVehicleForm: () => void
  ) => Promise<Vehicle | null>;
}

/**
 * Hook to manage vehicle form state and operations
 * Supports prefilled customer info (read-only) + manual vehicle entry
 * @param initialData - Optional initial form data (for prefilled values)
 * @returns Vehicle form state and handlers
 */
export function useVehicleForm(
  initialData?: Partial<NewVehicleForm>
): UseVehicleFormReturn {
  const [newVehicleForm, setNewVehicleForm] = useState<Partial<NewVehicleForm>>(() => ({
    ...initialVehicleForm,
    ...initialData, // Prefilled values override defaults
  }));
  const [vehicleFormState, setVehicleFormState] = useState<string>("");
  const [vehicleFormCity, setVehicleFormCity] = useState<string>("");
  const [hasInsurance, setHasInsurance] = useState<boolean>(false);

  const resetVehicleForm = useCallback(() => {
    setNewVehicleForm({ ...initialVehicleForm });
    setVehicleFormState("");
    setVehicleFormCity("");
    setHasInsurance(false);
  }, []);

  const validateVehicleForm = useCallback(() => {
    // Validate form
    if (!newVehicleForm.vehicleBrand || !newVehicleForm.vehicleModel) {
      return { error: "Vehicle Brand and Vehicle Model are required" };
    }

    if (!newVehicleForm.registrationNumber) {
      return { error: "Registration Number is required" };
    }

    // VIN is optional, but if provided, validate format
    if (newVehicleForm.vin && newVehicleForm.vin.trim() !== "") {
      if (!validateVIN(newVehicleForm.vin)) {
        return {
          error: "Invalid VIN format. VIN must be exactly 17 alphanumeric characters",
        };
      }
    }

    // Validate insurance dates if provided and hasInsurance is checked
    if (hasInsurance && newVehicleForm.insuranceStartDate && newVehicleForm.insuranceEndDate) {
      const startDate = new Date(newVehicleForm.insuranceStartDate);
      const endDate = new Date(newVehicleForm.insuranceEndDate);
      if (endDate <= startDate) {
        return { error: "Insurance end date must be after start date" };
      }
    }

    return { error: null };
  }, [newVehicleForm, hasInsurance]);

  const handleSaveVehicle = useCallback(
    async (
      selectedCustomer: CustomerWithVehicles,
      showToast: (message: string, type: "success" | "error") => void,
      setSelectedCustomer: (customer: CustomerWithVehicles) => void,
      setSelectedVehicle: (vehicle: Vehicle | null) => void,
      closeVehicleForm: () => void,
      shouldOpenAppointmentAfterVehicleAdd: boolean,
      initializeAppointmentForm: (customer: CustomerWithVehicles, vehicle: Vehicle) => void,
      setShowScheduleAppointment: (show: boolean) => void,
      setShowVehicleDetails: (show: boolean) => void,
      setShouldOpenAppointmentAfterVehicleAdd: (should: boolean) => void,
      onSuccess?: () => void
    ): Promise<Vehicle | null> => {
      const { error } = validateVehicleForm();
      if (error) {
        showToast(error, "error");
        return null;
      }

      // Persist the vehicle using the service layer which handles data transformation
      let createdVehicle: Vehicle;
      try {
        createdVehicle = await vehicleService.create({
          customerId: String(selectedCustomer.id),
          registration: newVehicleForm.registrationNumber!,
          vin: newVehicleForm.vin,
          vehicleMake: newVehicleForm.vehicleBrand!,
          vehicleModel: newVehicleForm.vehicleModel!,
          vehicleYear: newVehicleForm.purchaseDate
            ? new Date(newVehicleForm.purchaseDate).getFullYear()
            : new Date().getFullYear(),
          vehicleColor: newVehicleForm.vehicleColor,
          variant: newVehicleForm.variant,
          motorNumber: newVehicleForm.motorNumber,
          chargerSerialNumber: newVehicleForm.chargerSerialNumber,
          warrantyStatus: newVehicleForm.warrantyStatus,
          purchaseDate: newVehicleForm.purchaseDate,
          insuranceStartDate: hasInsurance ? newVehicleForm.insuranceStartDate : undefined,
          insuranceEndDate: hasInsurance ? newVehicleForm.insuranceEndDate : undefined,
          insuranceCompanyName: hasInsurance ? newVehicleForm.insuranceCompanyName : undefined,
        });
      } catch (error) {
        console.error("Failed to save vehicle:", error);
        showToast("Failed to save vehicle. Please try again.", "error");
        return null;
      }

      // Add vehicle to customer's vehicles array using the real created vehicle
      // const newVehicle = createdVehicle; // Use the response
      const updatedVehicles = [...(selectedCustomer.vehicles || []), createdVehicle];
      const updatedCustomer: CustomerWithVehicles = {
        ...selectedCustomer,
        vehicles: updatedVehicles,
        totalVehicles: updatedVehicles.length,
      };

      // Update selected customer
      setSelectedCustomer(updatedCustomer);
      setSelectedVehicle(createdVehicle);

      showToast(
        `Vehicle added successfully! Brand: ${newVehicleForm.vehicleBrand} | Model: ${newVehicleForm.vehicleModel} | Registration: ${newVehicleForm.registrationNumber}`,
        "success"
      );

      // Close popup and reset form
      closeVehicleForm();

      // Auto-refresh customer list
      if (onSuccess) onSuccess();

      // If we should open appointment after adding vehicle, do it now
      if (shouldOpenAppointmentAfterVehicleAdd) {
        initializeAppointmentForm(updatedCustomer, createdVehicle);
        setShowVehicleDetails(false); // Ensure vehicle details modal is closed
        setShowScheduleAppointment(true);
        setShouldOpenAppointmentAfterVehicleAdd(false);
      }

      return createdVehicle;
    },
    [newVehicleForm, hasInsurance, validateVehicleForm]
  );

  const handleUpdateVehicle = useCallback(
    async (
      vehicleId: string,
      selectedCustomer: CustomerWithVehicles,
      showToast: (message: string, type: "success" | "error") => void,
      setSelectedCustomer: (customer: CustomerWithVehicles) => void,
      setSelectedVehicle: (vehicle: Vehicle | null) => void,
      closeVehicleForm: () => void
    ): Promise<Vehicle | null> => {
      const { error } = validateVehicleForm();
      if (error) {
        showToast(error, "error");
        return null;
      }

      let updatedVehicle: Vehicle;
      try {
        updatedVehicle = await vehicleService.update(vehicleId, {
          registration: newVehicleForm.registrationNumber!,
          vin: newVehicleForm.vin,
          vehicleMake: newVehicleForm.vehicleBrand!,
          vehicleModel: newVehicleForm.vehicleModel!,
          vehicleYear: newVehicleForm.purchaseDate
            ? new Date(newVehicleForm.purchaseDate).getFullYear()
            : new Date().getFullYear(),
          vehicleColor: newVehicleForm.vehicleColor,
          variant: newVehicleForm.variant,
          motorNumber: newVehicleForm.motorNumber,
          chargerSerialNumber: newVehicleForm.chargerSerialNumber,
          warrantyStatus: newVehicleForm.warrantyStatus,
          purchaseDate: newVehicleForm.purchaseDate,
          insuranceStartDate: hasInsurance ? newVehicleForm.insuranceStartDate : undefined,
          insuranceEndDate: hasInsurance ? newVehicleForm.insuranceEndDate : undefined,
          insuranceCompanyName: hasInsurance ? newVehicleForm.insuranceCompanyName : undefined,
        });
      } catch (error) {
        console.error("Failed to update vehicle:", error);
        showToast("Failed to update vehicle. Please try again.", "error");
        return null;
      }

      // Update vehicle in customer's vehicles array
      const updatedVehicles = (selectedCustomer.vehicles || []).map(v =>
        v.id === vehicleId || v.id === updatedVehicle.id ? updatedVehicle : v
      );

      const updatedCustomer: CustomerWithVehicles = {
        ...selectedCustomer,
        vehicles: updatedVehicles,
      };

      // Update selected customer
      setSelectedCustomer(updatedCustomer);
      setSelectedVehicle(updatedVehicle);

      showToast("Vehicle updated successfully!", "success");

      // Close popup and reset form
      closeVehicleForm();

      return updatedVehicle;
    },
    [newVehicleForm, hasInsurance, validateVehicleForm]
  );

  return {
    newVehicleForm,
    setNewVehicleForm,
    vehicleFormState,
    setVehicleFormState,
    vehicleFormCity,
    setVehicleFormCity,
    hasInsurance,
    setHasInsurance,
    resetVehicleForm,
    validateVehicleForm,
    handleSaveVehicle,
    handleUpdateVehicle,
  };
}

