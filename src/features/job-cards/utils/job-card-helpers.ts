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
