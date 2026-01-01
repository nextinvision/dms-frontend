import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JobCard } from '../types/job-card.types';
import { customerService } from '@/features/customers/services/customer.service';
import { CustomerWithVehicles } from '../types/vehicle.types';

/**
 * Hook to hydrate a JobCard with live Customer and Vehicle data.
 */
export function useHydratedJobCard(jobCard: JobCard | null) {
    // Query for customer data
    const { data: customer, isLoading: isCustomerLoading } = useQuery({
        queryKey: ['customer', jobCard?.customerId],
        queryFn: () => jobCard?.customerId ? customerService.getById(jobCard.customerId) : null,
        enabled: !!jobCard?.customerId,
    });

    // Calculate hydrated job card
    const hydratedJobCard = useMemo(() => {
        if (!jobCard || !customer) return jobCard;

        const vehicle = customer.vehicles?.find(v => v.id === jobCard.vehicleId) || null;

        return {
            ...jobCard,
            // Prioritize live data over snapshots
            customerName: customer.name || jobCard.customerName,
            customerEmail: customer.email || jobCard.customerEmail,
            customerWhatsappNumber: customer.whatsappNumber || jobCard.customerWhatsappNumber,
            customerPhone: customer.phone || jobCard.part1?.mobilePrimary || "",

            // Vehicle details
            registration: vehicle?.registration || jobCard.registration,
            vehicleMake: vehicle?.vehicleMake || jobCard.vehicleMake,
            vehicleModel: vehicle?.vehicleModel || jobCard.vehicleModel,
            vehicleYear: vehicle?.vehicleYear || jobCard.vehicleYear,
            vehicle: vehicle || jobCard.vehicle, // Attach hydrated vehicle object

            // Nested objects
            part1: (jobCard.part1 || jobCard.part1Data) ? {
                ...(jobCard.part1 || jobCard.part1Data),
                fullName: customer.name || (jobCard.part1 || jobCard.part1Data).fullName,
                mobilePrimary: customer.phone || (jobCard.part1 || jobCard.part1Data).mobilePrimary,
                customerAddress: customer.address || (jobCard.part1 || jobCard.part1Data).customerAddress,
                registrationNumber: vehicle?.registration || (jobCard.part1 || jobCard.part1Data).registrationNumber,
                vinChassisNumber: vehicle?.vin || (jobCard.part1 || jobCard.part1Data).vinChassisNumber,
                dateOfPurchase: vehicle?.purchaseDate || (jobCard.part1 || jobCard.part1Data).dateOfPurchase,
            } : undefined
        };

    }, [jobCard, customer]);

    return {
        jobCard: hydratedJobCard,
        isLoading: isCustomerLoading,
        customer,
    };
}
