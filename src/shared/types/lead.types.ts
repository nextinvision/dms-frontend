export type LeadStatus = "NEW" | "IN_DISCUSSION" | "JOB_CARD_IN_PROGRESS" | "CONVERTED" | "LOST";

export interface Lead {
    id: string;
    leadNumber: string;
    customerId?: string;
    customerName: string;
    phone: string;
    email?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleDetails?: string;
    inquiryType: string;
    serviceType?: string;
    source: string;
    status: LeadStatus;

    // Conversion Tracking
    convertedTo?: string;
    convertedId?: string;
    quotationId?: string;
    jobCardId?: string;
    appointmentId?: string;

    // Follow-up
    notes?: string;
    followUpDate?: string;
    assignedTo?: string;
    serviceCenterId?: string;

    createdAt: string;
    updatedAt: string;
}

export interface CreateLeadData {
    customerName: string;
    phone: string;
    email?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    inquiryType: string;
    serviceType?: string;
    source: string;
    notes?: string;
    serviceCenterId: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
    status?: LeadStatus;
    assignedTo?: string;
    followUpDate?: string;
}
