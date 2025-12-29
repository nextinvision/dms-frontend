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
    const dto: Partial<CreateJobCardDto> = {
        serviceType: jobCard.serviceType || jobCard.description,
        priority: mapPriorityToEnum(jobCard.priority),
        location: mapLocationToEnum(jobCard.location),
        isTemporary: jobCard.isTemporary ?? true,
    };

    // Only include immutable foreign keys on creation, not on updates
    if (!isUpdate) {
        dto.serviceCenterId = jobCard.serviceCenterId;
        dto.customerId = jobCard.customerId;
        dto.vehicleId = jobCard.vehicleId;
        dto.appointmentId = jobCard.sourceAppointmentId || jobCard.appointmentId;
    }

    // Map Part 1 Data
    if (jobCard.part1) {
        dto.part1Data = jobCard.part1;
    }

    // Map Part 2 Data (items)
    if (jobCard.part2 && Array.isArray(jobCard.part2) && jobCard.part2.length > 0) {
        dto.items = jobCard.part2.map((item: any) => ({
            srNo: item.srNo,
            partWarrantyTag: item.partWarrantyTag || false,
            partName: item.partName,
            partCode: item.partCode,
            qty: item.qty,
            amount: item.amount || 0,
            technician: item.technician || '',
            labourCode: item.labourCode || '',
            itemType: item.itemType || 'part',
        }));
    }

    // Map Part 2A Data (warranty documentation)
    if (jobCard.part2A) {
        dto.part2AData = {
            issueDescription: jobCard.part2A.issueDescription,
            numberOfObservations: jobCard.part2A.numberOfObservations,
            symptom: jobCard.part2A.symptom,
            defectPart: jobCard.part2A.defectPart,
            files: {
                videoEvidence: mapFilesToDto(jobCard.part2A.videoEvidenceMetadata || jobCard.videoEvidence?.metadata),
                vinImage: mapFilesToDto(jobCard.part2A.vinImageMetadata || jobCard.vinImage?.metadata),
                odoImage: mapFilesToDto(jobCard.part2A.odoImageMetadata || jobCard.odoImage?.metadata),
                damageImages: mapFilesToDto(jobCard.part2A.damageImagesMetadata || jobCard.damageImages?.metadata),
            }
        };
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
