import { useState, useMemo, useEffect } from "react";
import { useRole } from "@/shared/hooks";
import { getServiceCenterContext, filterByServiceCenter, shouldFilterByServiceCenter } from "@/shared/lib/serviceCenter";
import { useJobCards } from "@/features/job-cards/hooks/useJobCards";
import type { JobCard, JobCardStatus, JobCardFilterType, KanbanColumn, JobCardViewType } from "@/shared/types/job-card.types";

export function useJobCardView() {
    const [view, setView] = useState<JobCardViewType>("list");
    const [filter, setFilter] = useState<JobCardFilterType>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { userRole, userInfo, isLoading: isRoleLoading } = useRole();

    // Use data from API
    const { data: fetchedJobCards, isLoading: isQueryLoading } = useJobCards();
    const [jobCards, setJobCards] = useState<JobCard[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Sync Query Data to Local State
    useEffect(() => {
        if (fetchedJobCards) {
            if (Array.isArray(fetchedJobCards)) {
                setJobCards(fetchedJobCards);
            } else {
                console.warn('fetchedJobCards is not an array:', fetchedJobCards);
                setJobCards([]);
            }
            setIsInitialized(true);
        }
    }, [fetchedJobCards]);

    const serviceCenterContext = useMemo(() => getServiceCenterContext(), []);
    const isTechnician = userRole === "service_engineer";
    const isServiceAdvisor = userRole === "service_advisor";

    // Role-based job card filtering
    const visibleJobCards = useMemo(() => {
        let filtered = filterByServiceCenter(jobCards, serviceCenterContext);

        // Technician only sees job cards assigned to them
        if (isTechnician) {
            const engineerName = userInfo?.name || "Service Engineer";
            filtered = filtered.filter(
                (job) => job.assignedEngineer === engineerName || job.assignedEngineer === "Service Engineer"
            );
        }

        return filtered;
    }, [jobCards, serviceCenterContext, isTechnician, userInfo]);

    const filteredJobs = useMemo(() => {
        return visibleJobCards.filter((job) => {
            // Status filter
            if (filter === "draft" && !(job.draftIntake && job.status === "Created")) return false;
            if (filter === "created" && job.status !== "Created" && job.status !== "Awaiting Quotation Approval") return false;
            if (filter === "assigned" && job.status !== "Assigned") return false;
            if (filter === "in_progress" && job.status !== "In Progress") return false;
            if (filter === "completed" && job.status !== "Completed") return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();

                // Helper to get vehicle string
                const getVehicleString = (vehicle: any): string => {
                    if (typeof vehicle === 'string') return vehicle;
                    if (typeof vehicle === 'object' && vehicle !== null) {
                        return `${vehicle.vehicleModel || ''} ${vehicle.registration || ''}`.trim();
                    }
                    return '';
                };

                const vehicleStr = getVehicleString(job.vehicle);

                return (
                    (job.id && job.id.toLowerCase().includes(query)) ||
                    (job.jobCardNumber && job.jobCardNumber.toLowerCase().includes(query)) ||
                    (job.customerName && job.customerName.toLowerCase().includes(query)) ||
                    (job.registration && job.registration.toLowerCase().includes(query)) ||
                    (vehicleStr && vehicleStr.toLowerCase().includes(query)) ||
                    (job.serviceType && job.serviceType.toLowerCase().includes(query))
                );
            }

            return true;
        });
    }, [visibleJobCards, filter, searchQuery]);

    const draftCount = useMemo(
        () => visibleJobCards.filter((card) => card.draftIntake && card.status === "Created").length,
        [visibleJobCards]
    );

    const kanbanColumns: KanbanColumn[] = [
        { id: "created", title: "Created", status: "Created" },
        { id: "assigned", title: "Assigned", status: "Assigned" },
        { id: "in_progress", title: "In Progress", status: "In Progress" },
        { id: "parts_pending", title: "Parts Pending", status: "Parts Pending" },
        { id: "completed", title: "Completed", status: "Completed" },
    ];

    const getJobsByStatus = (status: JobCardStatus): JobCard[] => {
        return filteredJobs.filter((job) => job.status === status);
    };

    const isLoading = !isClient || isRoleLoading || !isInitialized;

    return {
        view,
        setView,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        visibleJobCards,
        filteredJobs,
        draftCount,
        kanbanColumns,
        getJobsByStatus,
        isLoading,
        jobCards,
        setJobCards, // Exposed for Actions hook updates
        userRole,
        userInfo,
        isTechnician
    };
}
