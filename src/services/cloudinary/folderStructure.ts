/**
 * Generate folder paths for different entity types
 */
export const CLOUDINARY_FOLDERS = {
  customerIdProof: (customerId: string) =>
    `customers/${customerId}/id-proof`,
  
  vehicleRC: (vehicleId: string) =>
    `vehicles/${vehicleId}/rc-copy`,
  
  vehiclePhotos: (vehicleId: string) =>
    `vehicles/${vehicleId}/photos`,
  
  vehicleCondition: (vehicleId: string) =>
    `vehicles/${vehicleId}/condition`,
  
  appointmentDocs: (appointmentId: string) =>
    `appointments/${appointmentId}/documents`,
  
  jobCardWarranty: (jobCardId: string) =>
    `job-cards/${jobCardId}/warranty`,
  
  jobCardDamages: (jobCardId: string) =>
    `job-cards/${jobCardId}/damages`,
  
  warrantyVideo: (jobCardId: string, itemIndex: number) =>
    `job-cards/${jobCardId}/warranty/item-${itemIndex}/video`,
  
  warrantyVIN: (jobCardId: string, itemIndex: number) =>
    `job-cards/${jobCardId}/warranty/item-${itemIndex}/vin`,
  
  warrantyODO: (jobCardId: string, itemIndex: number) =>
    `job-cards/${jobCardId}/warranty/item-${itemIndex}/odo`,
  
  warrantyDamage: (jobCardId: string, itemIndex: number) =>
    `job-cards/${jobCardId}/warranty/item-${itemIndex}/damages`,
} as const;

/**
 * Get folder path for a specific field type
 */
export function getFolderForField(
  field: keyof typeof CLOUDINARY_FOLDERS,
  ...args: string[]
): string {
  const folderFn = CLOUDINARY_FOLDERS[field] as (...args: string[]) => string;
  if (!folderFn) {
    throw new Error(`Unknown field type: ${field}`);
  }
  return folderFn(...args);
}

