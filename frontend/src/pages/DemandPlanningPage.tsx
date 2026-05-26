import { useState } from 'react';

const DemandPlanningPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
  ];

  // Mock forecast data
  const forecastData = {
    current: 1247,
    predicted: 1432,
    change: 14.8,
    accuracy: 91,
  };

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
          Demand
        </h1>
        <p className="text-xl text-[#86868b]">
          AI-powered demand forecasting
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-10">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id as 'week' | 'month' | 'quarter')}
            className={`
              px-5 py-2.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${selectedPeriod === period.id
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-gray-100 text-[#86868b] hover:bg-gray-200'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Main Forecast Card */}
      <div className="bg-white rounded-3xl p-10 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Numbers */}
          <div>
            <p className="text-sm text-[#86868b] mb-2">Predicted demand</p>
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-7xl font-semibold text-[#1d1d1f] tracking-tight">
                {forecastData.predicted.toLocaleString()}
              </span>
              <span className="text-2xl text-[#34c759] font-medium">
                +{forecastData.change}%
              </span>
            </div>

            <p className="text-[#86868b]">
              vs. current {selectedPeriod}: {forecastData.current.toLocaleString()} units
            </p>
          </div>

          {/* Right - Chart placeholder */}
          <div className="flex items-center justify-center">
            <div className="w-full h-48 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 400 150">
                {/* Simple line chart visualization */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#86868b" />
                    <stop offset="100%" stopColor="#1d1d1f" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20,120 Q 80,100 120,90 T 200,70 T 280,50 T 380,30"
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="380" cy="30" r="6" fill="#1d1d1f" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Model Accuracy"
          value={`${forecastData.accuracy}%`}
          description="Based on last 90 days"
        />
        <StatCard
          label="Products Analyzed"
          value="124"
          description="Across all categories"
        />
        <StatCard
          label="Last Updated"
          value="2h ago"
          description="Auto-refreshes daily"
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  description: string;
}

const StatCard = ({ label, value, description }: StatCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-6">
      <p className="text-sm text-[#86868b] mb-2">{label}</p>
      <p className="text-3xl font-semibold text-[#1d1d1f] mb-1">{value}</p>
      <p className="text-sm text-[#86868b]">{description}</p>
    </div>
  );
};

export default DemandPlanningPage;