import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalItems?: number;
}

interface UsePaginationReturn<T> {
    // Current state
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;

    // Navigation
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    firstPage: () => void;
    lastPage: () => void;

    // Page size
    setPageSize: (size: number) => void;

    // Total items
    setTotalItems: (total: number) => void;

    // Computed values
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;

    // For API calls
    skip: number;
    limit: number;

    // Helper for slicing local data
    paginateData: (data: T[]) => T[];

    // Page numbers for pagination UI
    pageNumbers: number[];
}

/**
 * Hook for managing pagination state
 * 
 * @param options - Configuration options
 * @returns Pagination state and controls
 * 
 * @example
 * const {
 *   currentPage,
 *   pageSize,
 *   skip,
 *   limit,
 *   goToPage,
 *   nextPage,
 *   prevPage,
 *   pageNumbers,
 * } = usePagination({ initialPageSize: 10, totalItems: 100 });
 * 
 * // For API calls
 * const { data } = useApi(() => inventoryAPI.getProducts({ skip, limit }));
 */
export function usePagination<T = unknown>(
    options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
    const {
        initialPage = 1,
        initialPageSize = 10,
        totalItems: initialTotalItems = 0,
    } = options;

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);
    const [totalItems, setTotalItems] = useState(initialTotalItems);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalItems / pageSize)),
        [totalItems, pageSize]
    );

    // Ensure current page is within bounds when totalPages changes
    useMemo(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const goToPage = useCallback(
        (page: number) => {
            const validPage = Math.max(1, Math.min(page, totalPages));
            setCurrentPage(validPage);
        },
        [totalPages]
    );

    const nextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const firstPage = useCallback(() => {
        goToPage(1);
    }, [goToPage]);

    const lastPage = useCallback(() => {
        goToPage(totalPages);
    }, [totalPages, goToPage]);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setCurrentPage(1); // Reset to first page when page size changes
    }, []);

    // Computed values
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // For API calls
    const skip = startIndex;
    const limit = pageSize;

    // Helper for slicing local data
    const paginateData = useCallback(
        (data: T[]): T[] => {
            return data.slice(startIndex, startIndex + pageSize);
        },
        [startIndex, pageSize]
    );

    // Generate page numbers for pagination UI
    const pageNumbers = useMemo(() => {
        const maxVisiblePages = 5;
        const pages: number[] = [];

        if (totalPages <= maxVisiblePages) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show subset with current page in middle
            let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            // Adjust start if we're near the end
            if (end - start + 1 < maxVisiblePages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [totalPages, currentPage]);

    return {
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        goToPage,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        setPageSize,
        setTotalItems,
        startIndex,
        endIndex,
        hasNextPage,
        hasPrevPage,
        skip,
        limit,
        paginateData,
        pageNumbers,
    };
}

export default usePagination;
