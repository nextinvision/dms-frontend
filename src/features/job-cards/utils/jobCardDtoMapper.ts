/**
 * DTO Mapper for Job Cards
 * Converts frontend JobCard format to backend CreateJobCardDto format
 */

import { CreateJobCardForm } from "@/features/job-cards/types/job-card.types";

export interface CreateJobCardDto {
    serviceCenterId: string;
    customerId: string;
    vehicleId: string;
    appointmentId?: string;
    serviceType: string;
    priority?: string;
    location?: string;
    isTemporary?: boolean;
    part1Data?: any;
    part2AData?: any;
    uploadedBy?: string;
    items?: Array<{
        srNo: number;
        partWarrantyTag?: boolean;
        partName: string;
        partCode: string;
        qty: number;
        amount: number;
        technician?: string;
        labourCode?: string;
        itemType: string;
    }>;
}

/**
 * Map JobCard object to CreateJobCardDto for backend API
 * @param jobCard - The job card object to map
 * @param userId - Optional user ID for audit trail
 * @param isUpdate - Whether this is an update operation (excludes immutable fields)
 */
export function mapJobCardToDto(jobCard: any, userId?: string, isUpdate = false): Partial<CreateJobCardDto> {
    // Ensure serviceType is always present (required by backend)
    const serviceType = (jobCard.serviceType || jobCard.description || 'General Service').trim();
    if (!serviceType) {
        throw new Error('serviceType is required and cannot be empty');
    }

    const dto: Partial<CreateJobCardDto> = {
        serviceType,
        priority: mapPriorityToEnum(jobCard.priority),
        location: mapLocationToEnum(jobCard.location),
        isTemporary: jobCard.isTemporary ?? true,
    };

    // Only include immutable foreign keys on creation, not on updates
    if (!isUpdate) {
        // Validate required UUID fields - check for existence and non-empty strings
        const serviceCenterId = jobCard.serviceCenterId?.trim();
        const customerId = jobCard.customerId?.trim();
        const vehicleId = jobCard.vehicleId?.trim();

        if (!serviceCenterId || serviceCenterId === '') {
            throw new Error('serviceCenterId is required for creating a job card');
        }
        if (!customerId || customerId === '') {
            throw new Error('customerId is required for creating a job card. Please select a customer.');
        }
        if (!vehicleId || vehicleId === '') {
            throw new Error('vehicleId is required for creating a job card. Please select a vehicle.');
        }

        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(serviceCenterId)) {
            throw new Error('serviceCenterId must be a valid UUID format');
        }
        if (!uuidRegex.test(customerId)) {
            throw new Error('customerId must be a valid UUID format. Please select a valid customer.');
        }
        if (!uuidRegex.test(vehicleId)) {
            throw new Error('vehicleId must be a valid UUID format. Please select a valid vehicle.');
        }

        dto.serviceCenterId = serviceCenterId;
        dto.customerId = customerId;
        dto.vehicleId = vehicleId;
        dto.appointmentId = jobCard.sourceAppointmentId || jobCard.appointmentId;
    }

    // Map Part 1 Data
    // Only include part1Data if it exists and has all required fields
    // Backend validation requires: fullName, mobilePrimary, vehicleBrand, vehicleModel, registrationNumber, vinChassisNumber, customerFeedback
    if (jobCard.part1) {
        const part1 = jobCard.part1;
        // Validate that all required fields are present and non-empty
        const hasAllRequiredFields = 
            part1.fullName && 
            String(part1.fullName).trim() !== '' &&
            part1.mobilePrimary && 
            String(part1.mobilePrimary).trim() !== '' &&
            part1.vehicleBrand && 
            String(part1.vehicleBrand).trim() !== '' &&
            part1.vehicleModel && 
            String(part1.vehicleModel).trim() !== '' &&
            part1.registrationNumber && 
            String(part1.registrationNumber).trim() !== '' &&
            part1.vinChassisNumber !== undefined && 
            String(part1.vinChassisNumber || '').trim() !== '' &&
            part1.customerFeedback && 
            String(part1.customerFeedback).trim() !== '';
        
        if (hasAllRequiredFields) {
            dto.part1Data = {
                ...part1,
                // Ensure required fields are trimmed
                fullName: String(part1.fullName).trim(),
                mobilePrimary: String(part1.mobilePrimary).trim(),
                vehicleBrand: String(part1.vehicleBrand).trim(),
                vehicleModel: String(part1.vehicleModel).trim(),
                registrationNumber: String(part1.registrationNumber).trim(),
                vinChassisNumber: String(part1.vinChassisNumber || '').trim(),
                customerFeedback: String(part1.customerFeedback).trim(),
            };
        }
        // If required fields are missing, don't include part1Data (it's optional)
    }

    // Map Part 2 Data (items)
    // Filter out items with empty partName or partCode as backend validation requires them
    // Backend DTO requires: @IsNotEmpty() partName and partCode
    if (jobCard.part2 && Array.isArray(jobCard.part2) && jobCard.part2.length > 0) {
        const validItems = jobCard.part2
            .filter((item: any) => {
                // Strict validation: both partName and partCode must be non-empty strings after trimming
                const partName = item?.partName;
                const partCode = item?.partCode;
                
                // Check if both exist and are strings
                if (!partName || !partCode || typeof partName !== 'string' || typeof partCode !== 'string') {
                    return false;
                }
                
                // Check if both have non-empty content after trimming
                const trimmedPartName = partName.trim();
                const trimmedPartCode = partCode.trim();
                
                return trimmedPartName.length > 0 && trimmedPartCode.length > 0;
            })
            .map((item: any, index: number) => ({
                srNo: item.srNo || index + 1,
                partWarrantyTag: item.partWarrantyTag || false,
                partName: item.partName.trim(),
                partCode: item.partCode.trim(),
                qty: item.qty || 1,
                amount: item.amount || 0,
                technician: item.technician || '',
                labourCode: item.labourCode || '',
                itemType: item.itemType || 'part',
                isWarranty: item.isWarranty || false,
                inventoryPartId: item.inventoryPartId,
            }));
        
        // Only include items array if there are valid items
        // Since items is optional in the backend DTO, we omit it entirely if no valid items
        if (validItems.length > 0) {
            dto.items = validItems;
        }
        // If no valid items, dto.items remains undefined (not included in payload)
    }

    // Map Part 2A Data (warranty documentation)
    // Root-level fix: Only include part2AData if it has meaningful warranty data
    // This prevents overwriting existing warranty data with empty values
    if (jobCard.part2A) {
        const videoEvidence = mapFilesToDto(jobCard.part2A.videoEvidenceMetadata || jobCard.videoEvidence?.metadata);
        const vinImage = mapFilesToDto(jobCard.part2A.vinImageMetadata || jobCard.vinImage?.metadata);
        const odoImage = mapFilesToDto(jobCard.part2A.odoImageMetadata || jobCard.odoImage?.metadata);
        const damageImages = mapFilesToDto(jobCard.part2A.damageImagesMetadata || jobCard.damageImages?.metadata);
        
        // Check if there's meaningful warranty data (text fields or files)
        const hasWarrantyTextData = 
            (jobCard.part2A.issueDescription && jobCard.part2A.issueDescription.trim() !== '') ||
            (jobCard.part2A.numberOfObservations && jobCard.part2A.numberOfObservations.trim() !== '') ||
            (jobCard.part2A.symptom && jobCard.part2A.symptom.trim() !== '') ||
            (jobCard.part2A.defectPart && jobCard.part2A.defectPart.trim() !== '');
        
        const hasWarrantyFiles = 
            videoEvidence.length > 0 ||
            vinImage.length > 0 ||
            odoImage.length > 0 ||
            damageImages.length > 0;
        
        // Only include part2AData if there's meaningful warranty data
        if (hasWarrantyTextData || hasWarrantyFiles) {
        dto.part2AData = {
                issueDescription: jobCard.part2A.issueDescription || '',
                numberOfObservations: jobCard.part2A.numberOfObservations || '',
                symptom: jobCard.part2A.symptom || '',
                defectPart: jobCard.part2A.defectPart || '',
            files: {
                    videoEvidence,
                    vinImage,
                    odoImage,
                    damageImages,
            }
        };
        }
    }

    // Add user ID if provided
    if (userId) {
        dto.uploadedBy = userId;
    }

    return dto;
}

/**
 * Helper to map file metadata to DTO format
 */
function mapFilesToDto(metadata: any[]) {
    if (!metadata || !Array.isArray(metadata)) return [];
    return metadata.map(m => ({
        url: m.url,
        publicId: m.publicId,
        filename: m.filename,
        format: m.format,
        bytes: m.bytes,
        duration: m.duration,
        width: m.width,
        height: m.height
    }));
}

/**
 * Map frontend priority to backend enum
 */
function mapPriorityToEnum(priority?: string): string {
    if (!priority) return 'NORMAL';
    const normalized = priority.toUpperCase();
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
    return validPriorities.includes(normalized) ? normalized : 'NORMAL';
}

/**
 * Map frontend location to backend enum
 */
function mapLocationToEnum(location?: string): string {
    if (!location) return 'STATION';
    const normalized = location.toUpperCase();
    return normalized === 'DOORSTEP' ? 'DOORSTEP' : 'STATION';
}
