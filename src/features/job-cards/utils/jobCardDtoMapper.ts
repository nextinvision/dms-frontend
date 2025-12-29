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
 */
export function mapJobCardToDto(jobCard: any, userId?: string): CreateJobCardDto {
    const dto: CreateJobCardDto = {
        serviceCenterId: jobCard.serviceCenterId,
        customerId: jobCard.customerId,
        vehicleId: jobCard.vehicleId,
        appointmentId: jobCard.sourceAppointmentId || jobCard.appointmentId,
        serviceType: jobCard.serviceType || jobCard.description,
        priority: mapPriorityToEnum(jobCard.priority),
        location: mapLocationToEnum(jobCard.location),
        isTemporary: jobCard.isTemporary ?? true,
    };

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
            // Files will be handled separately if needed
        };
    }

    // Add user ID if provided
    if (userId) {
        dto.uploadedBy = userId;
    }

    return dto;
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
