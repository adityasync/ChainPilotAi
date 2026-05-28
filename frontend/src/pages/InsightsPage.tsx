import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleDashed, Sparkles } from 'lucide-react';
import { mlAPI, aiAPI } from '../services/apiService';

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
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await mlAPI.getInsights({
        severity: severityFilter === 'all' ? undefined : severityFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page_size: 50,
      });
      setInsights(response.data?.data || []);
    } catch (fetchError) {
      console.error('Error fetching insights:', fetchError);
      setInsights([]);
      setError('Unable to load insights.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setError('');
    try {
      await aiAPI.generateInsights();
      await fetchInsights();
    } catch (genError) {
      console.error('Error generating insights:', genError);
      setError('Unable to generate AI insights.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [severityFilter, statusFilter]);

  const handleAcknowledge = async (id: number) => {
    setActionLoadingId(id);
    try {
      await mlAPI.acknowledgeInsight(id);
      await fetchInsights();
    } catch (actionError) {
      console.error('Error acknowledging insight:', actionError);
      setError('Unable to acknowledge the selected insight.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (id: number) => {
    setActionLoadingId(id);
    try {
      await mlAPI.resolveInsight(id);
      await fetchInsights();
    } catch (actionError) {
      console.error('Error resolving insight:', actionError);
      setError('Unable to resolve the selected insight.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const severityFilters = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ] as const;

  const statusFilters = [
    { id: 'all', label: 'All statuses' },
    { id: 'new', label: 'New' },
    { id: 'acknowledged', label: 'Acknowledged' },
    { id: 'resolved', label: 'Resolved' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const criticalCount = insights.filter((insight) => insight.severity === 'critical').length;

  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            Insights
          </h1>
          <p className="text-xl text-[#86868b]">
            {insights.length} insights
            {criticalCount > 0 && <>, <span className="text-[#ff3b30]">{criticalCount} critical</span></>}
          </p>
        </div>
        <button
          onClick={handleGenerateInsights}
          disabled={generating}
          className="
            inline-flex items-center gap-2 px-5 py-3
            bg-[#0071e3] text-white rounded-full
            text-sm font-medium
            hover:bg-[#0077ed] transition-all duration-200
            disabled:opacity-60
          "
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate AI Insights'}
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        <div className="flex gap-2 flex-wrap">
          {severityFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSeverityFilter(filter.id)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-medium
                transition-all duration-200
                ${severityFilter === filter.id
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-gray-100 text-[#86868b] hover:bg-gray-200'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${statusFilter === filter.id
                  ? 'bg-[#f5f5f7] text-[#1d1d1f]'
                  : 'bg-white text-[#86868b] border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl bg-[#fff4f4] px-5 py-4 text-sm text-[#b42318]">
          {error}
        </div>
      )}

      <div className="space-y-6 stagger-children">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            loading={actionLoadingId === insight.id}
            onAcknowledge={() => handleAcknowledge(insight.id)}
            onResolve={() => handleResolve(insight.id)}
          />
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl text-[#86868b]">No insights to show</p>
        </div>
      )}
    </div>
  );
};

interface InsightCardProps {
  insight: Insight;
  loading: boolean;
  onAcknowledge: () => void;
  onResolve: () => void;
}

const InsightCard = ({ insight, loading, onAcknowledge, onResolve }: InsightCardProps) => {
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

  const statusLabels = {
    new: 'New',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    expired: 'Expired',
  };

  return (
    <div
      className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`w-2 h-2 rounded-full ${severityColors[insight.severity as keyof typeof severityColors] || 'bg-gray-400'}`} />
          <span className="text-sm text-[#86868b]">
            {categoryLabels[insight.category as keyof typeof categoryLabels] || insight.category}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#86868b]">
            {statusLabels[insight.status as keyof typeof statusLabels] || insight.status}
          </span>
        </div>
        <ArrowRight
          className={`w-5 h-5 text-[#86868b] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      <h3 className="text-2xl font-medium text-[#1d1d1f] mb-2">
        {insight.title}
      </h3>
      <p className="text-lg text-[#86868b]">
        {insight.message}
      </p>

      {isExpanded && (
        <div
          className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in"
          onClick={(event) => event.stopPropagation()}
        >
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

          <div className="flex gap-3 flex-wrap pt-2">
            {insight.status === 'new' && (
              <button
                type="button"
                disabled={loading}
                onClick={onAcknowledge}
                className="
                  inline-flex items-center gap-2 px-5 py-3
                  bg-[#1d1d1f] text-white rounded-full
                  text-sm font-medium
                  hover:bg-black transition-all duration-200 disabled:opacity-60
                "
              >
                <CircleDashed className="w-4 h-4" />
                {loading ? 'Saving...' : 'Acknowledge'}
              </button>
            )}

            {insight.status !== 'resolved' && (
              <button
                type="button"
                disabled={loading}
                onClick={onResolve}
                className="
                  inline-flex items-center gap-2 px-5 py-3
                  bg-[#0071e3] text-white rounded-full
                  text-sm font-medium
                  hover:bg-[#0077ed] transition-all duration-200 disabled:opacity-60
                "
              >
                <Check className="w-4 h-4" />
                {loading ? 'Saving...' : 'Resolve'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
