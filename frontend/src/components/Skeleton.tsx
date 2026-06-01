import { type CSSProperties } from 'react';

/** Base shimmer bar */
export const Bar = ({ className = '', style }: { className?: string; style?: CSSProperties }) => (
  <div
    className={`bg-gray-200 dark:bg-[#2c2c2e] rounded-lg animate-skeleton ${className}`}
    style={style}
  />
);

/* ─────────────────────────────────────
   Reusable building blocks
   ───────────────────────────────────── */

/** Single KPI card skeleton */
export const KPICardSkeleton = () => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 space-y-3">
    <div className="flex items-center justify-between">
      <Bar className="w-10 h-10 rounded-xl" />
      <Bar className="w-12 h-4" />
    </div>
    <Bar className="w-20 h-3" />
    <Bar className="w-16 h-7" />
  </div>
);

/** Row of KPI card skeletons */
export const KPIGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className={`grid grid-cols-2 ${count >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <KPICardSkeleton key={i} />
    ))}
  </div>
);

/** Chart card skeleton (area / bar / line) */
export const ChartSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <Bar className="w-32 h-5" />
        <Bar className="w-48 h-3" />
      </div>
      <Bar className="w-5 h-5 rounded-md" />
    </div>
    <div className={`${height} flex items-end gap-2 px-4 pb-4`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Bar
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${20 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  </div>
);

/** Donut / pie chart skeleton */
export const PieSkeleton = () => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <Bar className="w-36 h-5" />
        <Bar className="w-44 h-3" />
      </div>
      <Bar className="w-5 h-5 rounded-md" />
    </div>
    <div className="h-64 flex items-center">
      <div className="w-1/2 flex justify-center">
        <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-[#2c2c2e] animate-skeleton" />
      </div>
      <div className="w-1/2 space-y-4 pl-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bar className="w-3 h-3 rounded-full" />
            <Bar className="flex-1 h-3" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Table skeleton */
export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-[#2c2c2e]">
      {Array.from({ length: cols }).map((_, i) => (
        <Bar key={i} className="h-3 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 dark:border-[#2c2c2e]/50 last:border-0"
      >
        {Array.from({ length: cols }).map((_, c) => (
          <Bar
            key={c}
            className="h-3 flex-1"
            style={{ width: c === 0 ? '60%' : undefined }}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Card grid skeleton (for supplier cards etc.) */
export const CardGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Bar className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="w-3/4 h-4" />
            <Bar className="w-1/2 h-3" />
          </div>
        </div>
        <div className="space-y-2">
          <Bar className="w-full h-3" />
          <Bar className="w-5/6 h-3" />
        </div>
        <div className="flex gap-2">
          <Bar className="w-16 h-6 rounded-full" />
          <Bar className="w-20 h-6 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/** Search bar skeleton */
export const SearchSkeleton = () => (
  <Bar className="w-full h-12 rounded-xl" />
);

/** Filter bar skeleton */
export const FilterBarSkeleton = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Bar className="w-36 h-10 rounded-xl" />
    <Bar className="w-28 h-10 rounded-xl" />
    <Bar className="w-32 h-10 rounded-xl" />
  </div>
);

/** Section title skeleton */
export const SectionTitleSkeleton = () => (
  <div className="space-y-2">
    <Bar className="w-48 h-8" />
    <Bar className="w-64 h-4" />
  </div>
);

/** Insight card skeleton */
export const InsightCardSkeleton = () => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Bar className="w-8 h-8 rounded-lg" />
        <div className="space-y-2">
          <Bar className="w-40 h-4" />
          <Bar className="w-24 h-3" />
        </div>
      </div>
      <Bar className="w-16 h-6 rounded-full" />
    </div>
    <Bar className="w-full h-3" />
    <Bar className="w-4/5 h-3" />
    <div className="flex gap-2 pt-1">
      <Bar className="w-20 h-8 rounded-lg" />
      <Bar className="w-20 h-8 rounded-lg" />
    </div>
  </div>
);
