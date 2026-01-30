import { JobCard } from "@/shared/types/job-card.types";

/**
 * Safely extracts the vehicle display string from a JobCard's vehicle field,
 * which can be a string, an object, or null/undefined.
 */
export const getVehicleDisplayString = (vehicle: any): string => {
    if (!vehicle) return '';
    if (typeof vehicle === 'string') return vehicle;
    if (typeof vehicle === 'object') {
        const model = vehicle.vehicleModel || vehicle.model || vehicle.vehicle_model || '';
        const reg = vehicle.registration || vehicle.registrationNumber || vehicle.registration_number || '';
        const make = vehicle.vehicleMake || vehicle.make || vehicle.vehicle_make || '';

        let display = `${make} ${model}`.trim();
        if (!display) display = reg;
        else if (reg) display += ` (${reg})`;

        return display || 'Unknown Vehicle';
    }
    return String(vehicle);
};

/**
 * Robustly parses a JobCard to find any available vehicle information.
 * Checks vehicle relation, legacy fields, part1 data, etc.
 */
export const getJobCardVehicleDisplay = (job: JobCard): string => {
    // 1. Try the direct vehicle object (most common in modern API)
    if (job.vehicle && typeof job.vehicle === 'object') {
        return getVehicleDisplayString(job.vehicle);
    }

    // 2. Try explicit vehicleObject field
    if (job.vehicleObject) {
        return getVehicleDisplayString(job.vehicleObject);
    }

    // 3. Try legacy flat fields
    if (job.vehicleMake || job.vehicleModel) {
        return `${job.vehicleMake || ''} ${job.vehicleModel || ''} ${job.registration ? `(${job.registration})` : ''}`.trim();
    }

    // 4. Try Part 1 Data (Customer/Vehicle Info section)
    if (job.part1) {
        const { vehicleBrand, vehicleModel, registrationNumber } = job.part1;
        return `${vehicleBrand || ''} ${vehicleModel || ''} ${registrationNumber ? `(${registrationNumber})` : ''}`.trim();
    }

    // 5. Try Part 1 Data Data (Backend snapshot)
    const part1Data = (job as any).part1Data;
    if (part1Data) {
        const brand = part1Data.vehicleBrand || part1Data.vehicle_brand || '';
        const model = part1Data.vehicleModel || part1Data.vehicle_model || '';
        const reg = part1Data.registrationNumber || part1Data.registration_number || '';
        return `${brand} ${model} ${reg ? `(${reg})` : ''}`.trim();
    }

    // 6. Last resort: vehicle ID string or simple registration
    if (typeof job.vehicle === 'string' && job.vehicle) return job.vehicle;
    if (job.registration) return `Vehicle ${job.registration}`;

    return 'Unknown Vehicle';
};

/**
 * Robustly parses a JobCard to find the customer name.
 * Checks customer relation, direct field, legacy fields, and part1 data.
 */
export const getJobCardCustomerName = (job: JobCard): string => {
    let name = '';

    // 1. Try direct customer object
    if (job.customer && typeof job.customer === 'object') {
        name = job.customer.name || (job.customer as any).fullName || '';
    }

    // 2. If no name yet, try direct customerName field
    if (!name && job.customerName) name = job.customerName;

    // 3. Try Part 1 Data (Customer/Vehicle Info section)
    if (!name && job.part1 && job.part1.fullName) {
        name = job.part1.fullName;
    }

    // 4. Try Part 1 Data Data (Backend snapshot)
    if (!name) {
        const part1Data = (job as any).part1Data;
        if (part1Data) {
            name = part1Data.fullName || part1Data.name || part1Data.customer_name || '';
        }
    }

    // 5. Try legacy flat fields if any exist (not common for customer but good safety)
    if (!name && (job as any).clientName) name = (job as any).clientName;
    if (!name && (job as any).contactPerson) name = (job as any).contactPerson;

    return name || 'Unknown Customer';
};

/**
 * Safely extracts the assigned engineer's name from a JobCard.
 */
export const getAssignedEngineerName = (engineer: any, defaultText: string = 'Unassigned'): string => {
    if (!engineer) return defaultText;
    if (typeof engineer === 'string') return engineer;
    if (typeof engineer === 'object') {
        return engineer.name || defaultText;
    }
    return String(engineer);
};

/**
 * Checks if a technician matches the assigned engineer on a job card.
 */
export const isEngineerAssignedToJob = (job: JobCard, engineerId: string | null, engineerName: string): boolean => {
    const assigned = job.assignedEngineer;
    if (!assigned) return false;

    // Normalize inputs
    const engNameLower = engineerName.toLowerCase();

    // Case 1: assignedEngineer is a String (ID or Name)
    if (typeof assigned === 'string') {
        const assignedLower = assigned.toLowerCase();
        if (engineerId && assigned === engineerId) return true;
        if (assignedLower.includes(engNameLower)) return true;
        if (assigned === "Service Engineer") return true;
    }
    // Case 2: assignedEngineer is an Object (User/Engineer entity)
    else if (typeof assigned === 'object') {
        const assignedObj = assigned as any;
        if (engineerId && assignedObj.id && String(assignedObj.id) === engineerId) return true;
        if (assignedObj.name && String(assignedObj.name).toLowerCase().includes(engNameLower)) return true;
    }

    return false;
};

/**
 * Extended part item interface that includes source and status information
 */
export interface MergedPartItem {
    // Core part information
    srNo: number;
    partName: string;
    partCode: string;
    qty: number;
    amount: number;
    technician?: string;
    labourCode?: string;
    itemType?: "part" | "work_item";
    partWarrantyTag: boolean;
    isWarranty: boolean;
    inventoryPartId?: string;
    serialNumber?: string;
    warrantyTagNumber?: string;
    
    // Source tracking
    source: 'existing' | 'requested' | 'completed';
    requestStatus?: 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'COMPLETED';
    requestId?: string;
}

/**
 * Merges all parts from different sources (existing items, part2 JSON, and parts requests)
 * into a unified list with source tracking. This ensures all parts are visible regardless
 * of their source or status.
 * 
 * @param jobCard - The job card object containing items, part2, and partsRequests
 * @returns Array of merged part items with source and status information
 */
export const getAllJobCardParts = (jobCard: any): MergedPartItem[] => {
    const mergedParts: MergedPartItem[] = [];
    const seenParts = new Set<string>(); // Track by partCode + partName to avoid duplicates

    // 1. Add existing parts from JobCardItem table (normalized, source of truth)
    const existingItems = jobCard.items || [];
    existingItems.forEach((item: any) => {
        if (!item.partName) return;
        
        const key = `${item.partCode || ''}_${item.partName}`;
        if (!seenParts.has(key)) {
            seenParts.add(key);
            mergedParts.push({
                srNo: item.srNo || mergedParts.length + 1,
                partName: item.partName,
                partCode: item.partCode || '',
                qty: item.qty || 1,
                amount: item.amount || 0,
                technician: item.technician,
                labourCode: item.labourCode,
                itemType: item.itemType || 'part',
                partWarrantyTag: item.partWarrantyTag || false,
                isWarranty: item.isWarranty || false,
                inventoryPartId: item.inventoryPartId,
                serialNumber: item.serialNumber,
                warrantyTagNumber: item.warrantyTagNumber,
                source: 'existing',
            });
        }
    });

    // 2. Fallback: Add parts from part2 JSON (legacy storage) if no items relation exists
    if (existingItems.length === 0) {
        const part2Json = Array.isArray(jobCard.part2) ? jobCard.part2 : [];
        part2Json.forEach((item: any) => {
            if (!item.partName) return;
            
            const key = `${item.partCode || ''}_${item.partName}`;
            if (!seenParts.has(key)) {
                seenParts.add(key);
                mergedParts.push({
                    srNo: item.srNo || mergedParts.length + 1,
                    partName: item.partName,
                    partCode: item.partCode || '',
                    qty: item.qty || 1,
                    amount: item.amount || 0,
                    technician: item.technician,
                    labourCode: item.labourCode,
                    itemType: item.itemType || 'part',
                    partWarrantyTag: item.partWarrantyTag || false,
                    isWarranty: item.isWarranty || false,
                    inventoryPartId: item.inventoryPartId,
                    serialNumber: item.serialNumber,
                    warrantyTagNumber: item.warrantyTagNumber,
                    source: 'existing',
                });
            }
        });
    }

    // 3. Add parts from PartsRequest (all statuses: PENDING, APPROVED, COMPLETED, etc.)
    const partsRequests = jobCard.partsRequests || [];
    partsRequests.forEach((request: any) => {
        const requestItems = request.items || [];
        const requestStatus = request.status || 'PENDING';
        
        requestItems.forEach((item: any) => {
            if (!item.partName) return;
            
            // Use approved quantity if available, otherwise requested quantity
            const qty = item.approvedQty > 0 ? item.approvedQty : (item.requestedQty || item.quantity || 1);
            const partName = item.part?.name || item.partName || 'Unknown Part';
            const partCode = item.part?.partNumber || item.partNumber || item.partId || '';
            
            // For requested parts, we want to show them separately from existing parts
            // even if they match, because they represent a separate request with its own status
            // This ensures users can see both existing parts AND requested parts with their status
            
            // Add as a new requested part (always add, don't merge with existing)
            mergedParts.push({
                srNo: mergedParts.length + 1,
                partName,
                partCode,
                qty,
                amount: 0, // Parts requests don't have amount initially
                itemType: 'part',
                partWarrantyTag: item.isWarranty || false,
                isWarranty: item.isWarranty || false,
                inventoryPartId: item.inventoryPartId || item.partId,
                source: requestStatus === 'COMPLETED' ? 'completed' : 'requested',
                requestStatus: requestStatus,
                requestId: request.id,
            });
        });
    });

    // 4. Sort by srNo if available, otherwise maintain order
    mergedParts.sort((a, b) => {
        if (a.srNo && b.srNo) return a.srNo - b.srNo;
        return 0;
    });

    // 5. Re-number srNo sequentially
    mergedParts.forEach((part, index) => {
        part.srNo = index + 1;
    });

    return mergedParts;
};
