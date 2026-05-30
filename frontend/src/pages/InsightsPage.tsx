import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleDashed, Sparkles, AlertTriangle, TrendingUp, Package, Users, Brain, Loader2, History, BarChart3 } from 'lucide-react';
import { mlAPI, aiAPI } from '../services/apiService';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';

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

interface Prediction {
  id: number;
  entity_type: string;
  entity_id: number;
  prediction_type: string;
  prediction_value: number;
  created_at: string;
}

const InsightsPage = () => {
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions'>('insights');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [predictionTypeFilter, setPredictionTypeFilter] = useState<string>('all');
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');

  const pagination = usePagination<Insight | Prediction>({ initialPageSize: 10 });
  const { currentPage, goToPage, setTotalItems, paginateData, totalPages } = pagination;

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch ALL insights without filters — filtering is done client-side
      // so KPI summary cards always show true totals
      const response = await mlAPI.getInsights({
        page_size: 500,
      });
      const data = response.data?.data || [];
      setInsights(data);
    } catch {
      setInsights([]);
      setError('Unable to load insights.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await mlAPI.getPredictions({
        prediction_type: predictionTypeFilter === 'all' ? undefined : predictionTypeFilter,
        page_size: 100,
      });
      const data = response.data?.data || [];
      setPredictions(data);
      setTotalItems(data.length);
    } catch (err) {
      console.error('Failed to load predictions:', err);
      setPredictions([]);
      setTotalItems(0);
      setError('Unable to load predictions.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setError('');
    setAnalysisResult('');
    try {
      const res = await aiAPI.generateInsights();
      const data = res.data?.data || [];
      const msg = res.data?.message;
      await fetchInsights();
      if (data.length > 0) {
        setAnalysisResult(`Generated ${data.length} AI insights.`);
      } else if (msg) {
        setError(msg);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.detail || err?.message || 'Unable to generate AI insights.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleRunAnalysis = async () => {
    setRunningAnalysis(true);
    setAnalysisResult('');
    setError('');
    try {
      const res = await mlAPI.runAnalysis();
      const { predictions_count, insights_count } = res.data;
      setAnalysisResult(`Analysis complete: ${predictions_count} predictions, ${insights_count} insights generated.`);
      await fetchInsights();
      if (activeTab === 'predictions') await fetchPredictions();
    } catch {
      setError('ML analysis failed. Please try again.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights') {
      fetchInsights();
    } else {
      fetchPredictions();
    }
    goToPage(1);
  }, [severityFilter, categoryFilter, statusFilter, predictionTypeFilter, activeTab]);

  const handleAcknowledge = async (id: number) => {
    setActionLoadingId(id);
    try { await mlAPI.acknowledgeInsight(id); await fetchInsights(); }
    catch { setError('Unable to acknowledge insight.'); }
    finally { setActionLoadingId(null); }
  };

  const handleResolve = async (id: number) => {
    setActionLoadingId(id);
    try { await mlAPI.resolveInsight(id); await fetchInsights(); }
    catch { setError('Unable to resolve insight.'); }
    finally { setActionLoadingId(null); }
  };

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const highCount = insights.filter(i => i.severity === 'high').length;

  const filteredInsights = insights.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  // Keep pagination in sync with filtered results
  useEffect(() => {
    if (activeTab === 'insights') {
      setTotalItems(filteredInsights.length);
    }
  }, [filteredInsights.length, activeTab]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const categories = [
    { id: 'all', label: 'All', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'supplier', label: 'Supplier', icon: <Users className="w-4 h-4" /> },
    { id: 'demand', label: 'Demand', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'cost', label: 'Cost', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Insights</h1>
          <p className="text-lg text-[#86868b] dark:text-[#98989d] mt-1">
            {activeTab === 'insights' ? (
              <>
                {insights.length} insights
                {criticalCount > 0 && <>, <span className="text-red-500 font-medium">{criticalCount} critical</span></>}
                {highCount > 0 && <>, <span className="text-amber-500 font-medium">{highCount} high</span></>}
              </>
            ) : (
              <>{predictions.length} predictions</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={runningAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-60"
          >
            {runningAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {runningAnalysis ? 'Running...' : 'Run ML Analysis'}
          </button>
          <button
            onClick={handleGenerateInsights}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-all disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate AI Insights'}
          </button>
        </div>
      </div>

      {analysisResult && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-5 py-3 text-sm text-emerald-700 dark:text-emerald-400">{analysisResult}</div>
      )}

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('insights')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'insights'
              ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
              : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'predictions'
              ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
              : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Predictions
        </button>
      </div>

      {activeTab === 'insights' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Critical', count: criticalCount, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'High', count: highCount, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'New', count: insights.filter(i => i.status === 'new').length, color: 'text-[#0071e3] dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Resolved', count: insights.filter(i => i.status === 'resolved').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                <p className="text-xs text-[#86868b] dark:text-[#98989d]">{s.label}</p>
                <p className={`text-2xl font-semibold ${s.color}`}>{s.count}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    categoryFilter === cat.id
                      ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
                      : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap ${
                    severityFilter === s
                      ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
                      : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['all', 'new', 'acknowledged', 'resolved'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
                      : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

          <div className="space-y-3">
            {paginateData(filteredInsights).map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight as Insight}
                loading={actionLoadingId === insight.id}
                onAcknowledge={() => handleAcknowledge(insight.id)}
                onResolve={() => handleResolve(insight.id)}
              />
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="mt-6"
          />

          {filteredInsights.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-[#86868b] dark:text-[#98989d]" />
              </div>
              <p className="text-lg text-[#86868b] dark:text-[#98989d]">No insights match your filters.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Predictions Tab */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: 'all', label: 'All' },
                { id: 'demand_forecast', label: 'Demand' },
                { id: 'inventory_risk', label: 'Inventory Risk' },
                { id: 'delay_risk', label: 'Delay Risk' },
                { id: 'cost_anomaly', label: 'Cost Anomaly' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPredictionTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    predictionTypeFilter === t.id
                      ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
                      : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

          {predictions.length > 0 ? (
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#38383a]">
                      <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Type</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Entity</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Value</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(predictions).map((pred) => (
                      <PredictionRow key={pred.id} prediction={pred as Prediction} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-[#38383a]">
                <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
              </div>
            </div>
          ) : (
            !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-[#86868b] dark:text-[#98989d]" />
                </div>
                <p className="text-lg text-[#86868b] dark:text-[#98989d]">No predictions yet.</p>
                <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">Run ML Analysis to generate predictions.</p>
              </div>
            )
          )}
        </>
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
  const [expanded, setExpanded] = useState(false);

  const severityStyle: Record<string, { badge: string; border: string }> = {
    critical: { badge: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400', border: 'border-l-red-500' },
    high: { badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', border: 'border-l-amber-500' },
    medium: { badge: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', border: 'border-l-yellow-400' },
    low: { badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', border: 'border-l-emerald-500' },
  };

  const catIcon: Record<string, React.ReactNode> = {
    inventory: <Package className="w-4 h-4" />,
    supplier: <Users className="w-4 h-4" />,
    demand: <TrendingUp className="w-4 h-4" />,
    cost: <AlertTriangle className="w-4 h-4" />,
  };

  const style = severityStyle[insight.severity] || severityStyle.medium;
  const icon = catIcon[insight.category] || <Sparkles className="w-4 h-4" />;

  return (
    <div
      className={`bg-white dark:bg-[#1c1c1e] rounded-xl border-l-4 ${style.border} cursor-pointer transition-all hover:shadow-md dark:hover:shadow-black/30`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-5 py-4 flex items-start gap-4">
        <div className={`${style.badge} p-2 rounded-lg flex-shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{insight.severity}</span>
            <span className="text-xs text-[#86868b] dark:text-[#98989d] capitalize">{insight.category}</span>
            {insight.status === 'acknowledged' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2c2c2e] text-[#86868b] dark:text-[#98989d]">acknowledged</span>
            )}
            {insight.status === 'resolved' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">resolved</span>
            )}
          </div>
          <h3 className="text-base font-medium text-[#1d1d1f] dark:text-white">{insight.title}</h3>
          <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-0.5">{insight.message}</p>
        </div>
        <ArrowRight className={`w-4 h-4 text-[#86868b] dark:text-[#98989d] flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-0 ml-14 space-y-3" onClick={(e) => e.stopPropagation()}>
          {insight.explanation && (
            <div className="bg-gray-50 dark:bg-[#2c2c2e] rounded-lg p-3">
              <p className="text-xs font-medium text-[#86868b] dark:text-[#98989d] mb-1">Why this matters</p>
              <p className="text-sm text-[#1d1d1f] dark:text-white">{insight.explanation}</p>
            </div>
          )}
          {insight.recommended_action && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs font-medium text-[#0071e3] dark:text-blue-400 mb-1">Recommended action</p>
              <p className="text-sm text-[#1d1d1f] dark:text-white">{insight.recommended_action}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {insight.status === 'new' && (
              <button
                disabled={loading}
                onClick={onAcknowledge}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-gray-200 disabled:opacity-60"
              >
                <CircleDashed className="w-3.5 h-3.5" />
                {loading ? 'Saving...' : 'Acknowledge'}
              </button>
            )}
            {insight.status !== 'resolved' && (
              <button
                disabled={loading}
                onClick={onResolve}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] text-white rounded-lg text-sm font-medium hover:bg-[#0077ed] disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                {loading ? 'Saving...' : 'Resolve'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Prediction Row ─── */

const PREDICTION_TYPE_LABELS: Record<string, string> = {
  demand_forecast: 'Demand Forecast',
  inventory_risk: 'Inventory Risk',
  delay_risk: 'Delay Risk',
  cost_anomaly: 'Cost Anomaly',
};

const PREDICTION_TYPE_COLORS: Record<string, string> = {
  demand_forecast: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  inventory_risk: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  delay_risk: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  cost_anomaly: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
};

const PredictionRow = ({ prediction }: { prediction: Prediction }) => (
  <tr className="border-b border-gray-50 dark:border-[#2c2c2e] hover:bg-[#fafafa] dark:hover:bg-[#2c2c2e]/50 transition-colors">
    <td className="px-6 py-4">
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${PREDICTION_TYPE_COLORS[prediction.prediction_type] || 'bg-gray-100 dark:bg-[#2c2c2e] text-[#86868b]'}`}>
        {PREDICTION_TYPE_LABELS[prediction.prediction_type] || prediction.prediction_type}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-[#1d1d1f] dark:text-white capitalize">
      {prediction.entity_type} #{prediction.entity_id}
    </td>
    <td className="px-6 py-4 text-sm font-medium text-[#1d1d1f] dark:text-white">
      {typeof prediction.prediction_value === 'number' ? prediction.prediction_value.toFixed(2) : prediction.prediction_value}
    </td>
    <td className="px-6 py-4 text-sm text-[#86868b] dark:text-[#98989d]">
      {new Date(prediction.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </td>
  </tr>
);

export default InsightsPage;
