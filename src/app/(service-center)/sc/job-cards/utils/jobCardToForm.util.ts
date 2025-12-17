/**
 * Utility function to convert JobCard to CreateJobCardForm initial values
 * Used when editing an existing job card (e.g., from appointment)
 */

import type { JobCard } from "@/shared/types/job-card.types";
import type { CreateJobCardForm } from "../../components/job-cards/JobCardFormModal";

interface DocumentationFiles {
  files: File[];
  urls: string[];
}

const INITIAL_DOCUMENTATION_FILES: DocumentationFiles = {
  files: [],
  urls: [],
};

/**
 * Convert PART 2A field (Yes/No string) to DocumentationFiles format
 */
function convertPart2AFieldToDocFiles(value: "Yes" | "No" | "" | undefined): DocumentationFiles {
  // If value is "Yes", we assume files exist but can't restore actual files
  // User will need to re-upload if needed
  if (value === "Yes") {
    return { ...INITIAL_DOCUMENTATION_FILES };
  }
  return { ...INITIAL_DOCUMENTATION_FILES };
}

/**
 * Convert JobCard to CreateJobCardForm initial values
 */
export function jobCardToFormInitialValues(jobCard: JobCard): Partial<CreateJobCardForm> {
  return {
    vehicleId: jobCard.vehicleId || "",
    customerId: jobCard.customerId || "",
    customerName: jobCard.customerName || "",
    vehicleRegistration: jobCard.registration || jobCard.part1?.registrationNumber || "",
    vehicleMake: jobCard.vehicleMake || jobCard.part1?.vehicleBrand || "",
    vehicleModel: jobCard.vehicleModel || jobCard.part1?.vehicleModel || "",
    description: jobCard.description || jobCard.part1?.customerFeedback || "",
    selectedParts: jobCard.parts || [],
    part2Items: jobCard.part2 || [],
    
    // PART 1 fields from jobCard.part1
    fullName: jobCard.part1?.fullName || jobCard.customerName || "",
    mobilePrimary: jobCard.part1?.mobilePrimary || "",
    customerType: (jobCard.part1?.customerType || jobCard.customerType || "") as "B2C" | "B2B" | "",
    vehicleBrand: jobCard.part1?.vehicleBrand || jobCard.vehicleMake || "",
    vinChassisNumber: jobCard.part1?.vinChassisNumber || "",
    variantBatteryCapacity: jobCard.part1?.variantBatteryCapacity || "",
    warrantyStatus: jobCard.part1?.warrantyStatus || "",
    estimatedDeliveryDate: jobCard.part1?.estimatedDeliveryDate || "",
    customerAddress: jobCard.part1?.customerAddress || "",
    customerFeedback: jobCard.part1?.customerFeedback || jobCard.description || "",
    technicianObservation: jobCard.part1?.technicianObservation || "",
    insuranceStartDate: jobCard.part1?.insuranceStartDate || "",
    insuranceEndDate: jobCard.part1?.insuranceEndDate || "",
    insuranceCompanyName: jobCard.part1?.insuranceCompanyName || "",
    batterySerialNumber: jobCard.part1?.batterySerialNumber || "",
    mcuSerialNumber: jobCard.part1?.mcuSerialNumber || "",
    vcuSerialNumber: jobCard.part1?.vcuSerialNumber || "",
    otherPartSerialNumber: jobCard.part1?.otherPartSerialNumber || "",
    
    // Additional Customer Contact Fields
    whatsappNumber: jobCard.customerWhatsappNumber || "",
    alternateMobile: jobCard.customerAlternateMobile || "",
    email: jobCard.customerEmail || "",
    
    // Additional Vehicle Details
    vehicleYear: jobCard.vehicleYear,
    motorNumber: jobCard.motorNumber || "",
    chargerSerialNumber: jobCard.chargerSerialNumber || "",
    dateOfPurchase: jobCard.dateOfPurchase || "",
    vehicleColor: jobCard.vehicleColor || "",
    
    // Additional Service Details
    previousServiceHistory: jobCard.previousServiceHistory || "",
    odometerReading: jobCard.odometerReading || "",
    
    // Operational Fields
    pickupDropRequired: jobCard.pickupDropRequired || false,
    pickupAddress: jobCard.pickupAddress || "",
    pickupState: jobCard.pickupState || "",
    pickupCity: jobCard.pickupCity || "",
    pickupPincode: jobCard.pickupPincode || "",
    dropAddress: jobCard.dropAddress || "",
    dropState: jobCard.dropState || "",
    dropCity: jobCard.dropCity || "",
    dropPincode: jobCard.dropPincode || "",
    preferredCommunicationMode: jobCard.preferredCommunicationMode,
    
    // Check-in Fields
    arrivalMode: jobCard.arrivalMode,
    checkInNotes: jobCard.checkInNotes || "",
    checkInSlipNumber: jobCard.checkInSlipNumber || "",
    checkInDate: jobCard.checkInDate || "",
    checkInTime: jobCard.checkInTime || "",
    
    // PART 2A fields from jobCard.part2A
    videoEvidence: convertPart2AFieldToDocFiles(jobCard.part2A?.videoEvidence),
    vinImage: convertPart2AFieldToDocFiles(jobCard.part2A?.vinImage),
    odoImage: convertPart2AFieldToDocFiles(jobCard.part2A?.odoImage),
    damageImages: convertPart2AFieldToDocFiles(jobCard.part2A?.damageImages),
    issueDescription: jobCard.part2A?.issueDescription || "",
    numberOfObservations: jobCard.part2A?.numberOfObservations || "",
    symptom: jobCard.part2A?.symptom || "",
    defectPart: jobCard.part2A?.defectPart || "",
  };
}

