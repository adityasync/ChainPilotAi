import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationControls = ({ currentPage, totalPages, onPageChange, className = '' }: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  const pages: number[] = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg text-[#86868b] dark:text-[#98989d] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1.5 rounded-lg text-sm text-[#86868b] dark:text-[#98989d] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all"
          >
            1
          </button>
          {pages[0] > 2 && <span className="text-[#86868b] dark:text-[#98989d] px-1">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            page === currentPage
              ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
              : 'text-[#86868b] dark:text-[#98989d] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
          }`}
        >
          {page}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-[#86868b] dark:text-[#98989d] px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1.5 rounded-lg text-sm text-[#86868b] dark:text-[#98989d] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg text-[#86868b] dark:text-[#98989d] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PaginationControls;
