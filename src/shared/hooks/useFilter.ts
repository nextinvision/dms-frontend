"use client";
import { useState, useMemo } from "react";

export interface FilterOption {
  key: string;
  value: string;
  label: string;
}

export interface UseFilterOptions<T> {
  data: T[];
  filterFn?: (item: T, filters: Record<string, string>) => boolean;
}

export interface UseFilterReturn<T> {
  filteredData: T[];
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  activeFilters: FilterOption[];
}

export function useFilter<T>({
  data,
  filterFn,
}: UseFilterOptions<T>): UseFilterReturn<T> {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFilters: FilterOption[] = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => ({
      key,
      value,
      label: key,
    }));

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return data;

    if (filterFn) {
      return data.filter((item) => filterFn(item, filters));
    }

    // Default filter: search in all string values
    return data.filter((item) => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue) return true;
        const itemValue = (item as Record<string, unknown>)[key];
        if (typeof itemValue === "string") {
          return itemValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, filters, filterFn]);

  return {
    filteredData,
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    activeFilters,
  };
}

