import { useState, useEffect } from 'react';
import { mlAPI } from '../services/apiService';
import { ArrowRight } from 'lucide-react';

interface Insight {
  id: number;
  title: string;
  message: string;
  severity: string;
  explanation: string;
  recommended_action: string;
  category: string;
  status: string;
  created_at: string;
}

const InsightsPage = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await mlAPI.getInsights();
        setInsights(response.data || []);
      } catch (error) {
        console.error('Error fetching insights:', error);
        // Mock data fallback
        setInsights([
          {
            id: 1,
            title: 'Low stock alert for Bluetooth Speaker',
            message: 'Current stock is 5 units, below the reorder point of 20.',
            severity: 'critical',
            explanation: 'At current sales velocity, stockout expected in 3 days.',
            recommended_action: 'Place order with TechParts Global immediately.',
            category: 'inventory',
            status: 'active',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: 'Supplier delay risk detected',
            message: 'Kitchen Solutions has shown increased lead times.',
            severity: 'high',
            explanation: 'Average lead time increased from 7 to 14 days.',
            recommended_action: 'Consider alternative suppliers or increase safety stock.',
            category: 'supplier',
            status: 'active',
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            title: 'Demand spike predicted',
            message: 'Ergonomic Mouse expected to see 40% increase next month.',
            severity: 'medium',
            explanation: 'Based on seasonal trends and marketing campaigns.',
            recommended_action: 'Pre-order additional inventory from Prime Components.',
            category: 'demand',
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter(i => i.severity === filter);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const criticalCount = insights.filter(i => i.severity === 'critical').length;

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
          Insights
        </h1>
        <p className="text-xl text-[#86868b]">
          {insights.length} insights
          {criticalCount > 0 && <>, <span className="text-[#ff3b30]">{criticalCount} critical</span></>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-10">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`
              px-5 py-2.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${filter === f.id
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-gray-100 text-[#86868b] hover:bg-gray-200'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-6 stagger-children">
        {filteredInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl text-[#86868b]">No insights to show</p>
        </div>
      )}
    </div>
  );
};

interface InsightCardProps {
  insight: Insight;
}

const InsightCard = ({ insight }: InsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityColors = {
    critical: 'bg-[#ff3b30]',
    high: 'bg-[#ff9f0a]',
    medium: 'bg-[#ffcc00]',
    low: 'bg-[#34c759]',
  };

  const categoryLabels = {
    inventory: 'Inventory',
    supplier: 'Supplier',
    demand: 'Demand',
    cost: 'Cost',
  };

  return (
    <div
      className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${severityColors[insight.severity as keyof typeof severityColors] || 'bg-gray-400'}`} />
          <span className="text-sm text-[#86868b]">
            {categoryLabels[insight.category as keyof typeof categoryLabels] || insight.category}
          </span>
        </div>
        <ArrowRight
          className={`w-5 h-5 text-[#86868b] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-medium text-[#1d1d1f] mb-2">
        {insight.title}
      </h3>
      <p className="text-lg text-[#86868b]">
        {insight.message}
      </p>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in">
          {insight.explanation && (
            <div>
              <p className="text-sm font-medium text-[#86868b] mb-1">Why this matters</p>
              <p className="text-[#1d1d1f]">{insight.explanation}</p>
            </div>
          )}
          {insight.recommended_action && (
            <div>
              <p className="text-sm font-medium text-[#86868b] mb-1">Recommended action</p>
              <p className="text-[#1d1d1f]">{insight.recommended_action}</p>
            </div>
          )}
          <button className="
            mt-4 px-6 py-3 
            bg-[#0071e3] text-white rounded-full
            text-sm font-medium
            hover:bg-[#0077ed] transition-all duration-200
          ">
            Take action
          </button>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;