import type { Vehicle } from "@/shared/types";

export const formatVehicleString = (vehicle: Vehicle): string => {
  if (!vehicle) return "";
  
  const make = vehicle.vehicleMake || "";
  const model = vehicle.vehicleModel || "";
  const year = vehicle.vehicleYear || "";
  const registration = vehicle.registration || "";
  
  // Build vehicle string with available fields
  let vehicleString = `${make} ${model}`.trim();
  
  if (year) {
    vehicleString += ` (${year})`;
  }
  
  // Optionally include registration if year is missing
  if (!year && registration) {
    vehicleString += ` - ${registration}`;
  } else if (registration && year) {
    // Include registration in parentheses or separately
    vehicleString += ` ${registration}`;
  }
  
  return vehicleString.trim() || "Unknown Vehicle";
};



