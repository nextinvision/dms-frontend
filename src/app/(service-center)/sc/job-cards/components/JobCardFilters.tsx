"use client";
import React from "react";
import { Search, Filter, X } from "lucide-react";
import type { JobCardViewType } from "@/shared/types/job-card.types";

import type { JobCardFilterType } from "@/shared/types/job-card.types";

interface JobCardFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showMobileFilters: boolean;
    setShowMobileFilters: (show: boolean) => void;
    filter: string;
    setFilter: (filter: any) => void;
    filterOptions: JobCardFilterType[];
    filterLabelMap: Record<string, string>;
    view: JobCardViewType;
    draftCount?: number;
    pendingApprovalCount?: number;
}

export default function JobCardFilters({
    searchQuery,
    setSearchQuery,
    showMobileFilters,
    setShowMobileFilters,
    filter,
    setFilter,
    filterOptions,
    filterLabelMap,
    view,
    draftCount = 0,
    pendingApprovalCount = 0
}: JobCardFiltersProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6 ${view === "kanban" ? "mx-4 sm:mx-6" : ""}`}>
            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by job card ID, customer name, vehicle, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm placeholder:text-gray-400 transition-shadow"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Section Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Filter by Status</h3>

                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition inline-flex items-center gap-1.5"
                >
                    <Filter size={14} />
                    {showMobileFilters ? 'Hide' : 'Show'} Filters
                </button>
            </div>

            {/* Desktop Filters - Horizontal Scroll on Small Screens */}
            <div className="hidden md:block">
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map((f) => {
                        const count = f === 'draft' ? draftCount : f === 'pending_approval' ? pendingApprovalCount : null;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                                    }`}
                            >
                                {filterLabelMap[f]}
                                {count !== null && ` (${count})`}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Filters Dropdown */}
            {showMobileFilters && (
                <div className="md:hidden">
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        {filterOptions.map((f) => {
                            const count = f === 'draft' ? draftCount : f === 'pending_approval' ? pendingApprovalCount : null;
                            return (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setFilter(f);
                                        setShowMobileFilters(false);
                                    }}
                                    className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${filter === f
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-700 active:bg-gray-200"
                                        }`}
                                >
                                    {filterLabelMap[f]}
                                    {count !== null && ` (${count})`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
