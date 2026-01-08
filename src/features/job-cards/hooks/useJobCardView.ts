import { useState, useMemo, useEffect } from "react";
import { useRole } from "@/shared/hooks";
import { getServiceCenterContext, filterByServiceCenter, shouldFilterByServiceCenter } from "@/shared/lib/serviceCenter";
import { useJobCards } from "@/features/job-cards/hooks/useJobCards";
import type { JobCard, JobCardStatus, JobCardFilterType, KanbanColumn, JobCardViewType } from "@/shared/types/job-card.types";
import { getVehicleDisplayString, isEngineerAssignedToJob } from "@/features/job-cards/utils/job-card-helpers";

export function useJobCardView() {
    const [view, setView] = useState<JobCardViewType>("table"); // Default to table view
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

    // Set default view for service technician
    useEffect(() => {
        if (userRole === "service_engineer") {
            setView("list");
        }
    }, [userRole]);

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
            const engineerName = (userInfo?.name || "Service Engineer");
            const engineerId = userInfo?.id ? String(userInfo.id) : null;

            filtered = filtered.filter((job) => isEngineerAssignedToJob(job, engineerId, engineerName));
        }

        return filtered;
    }, [jobCards, serviceCenterContext, isTechnician, userInfo]);

    const filteredJobs = useMemo(() => {
        return visibleJobCards.filter((job) => {
            // Status filter
            if (filter === "draft" && !(job.draftIntake && job.status === "CREATED")) return false;
            if (filter === "created" && job.status !== "CREATED" && job.status !== "AWAITING_QUOTATION_APPROVAL") return false;
            if (filter === "assigned" && job.status !== "ASSIGNED") return false;
            if (filter === "in_progress" && job.status !== "IN_PROGRESS") return false;
            if (filter === "completed" && job.status !== "COMPLETED") return false;
            if (filter === "pending_approval" && !job.passedToManager) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const vehicleStr = getVehicleDisplayString(job.vehicle);

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
        () => visibleJobCards.filter((card) => card.draftIntake && card.status === "CREATED").length,
        [visibleJobCards]
    );

    const pendingApprovalCount = useMemo(
        () => visibleJobCards.filter((card) => card.passedToManager).length,
        [visibleJobCards]
    );

    const kanbanColumns: KanbanColumn[] = [
        { id: "created", title: "Created", status: "CREATED" },
        { id: "assigned", title: "Assigned", status: "ASSIGNED" },
        { id: "in_progress", title: "In Progress", status: "IN_PROGRESS" },
        { id: "parts_pending", title: "Parts Pending", status: "PARTS_PENDING" },
        { id: "completed", title: "Completed", status: "COMPLETED" },
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
        pendingApprovalCount,
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
