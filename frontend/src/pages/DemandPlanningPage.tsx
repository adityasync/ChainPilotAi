import { useEffect, useState } from 'react';
import {
  Line, Area, AreaChart, ComposedChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Bar, BarChart, Legend,
} from 'recharts';
import { demandAPI, inventoryAPI, mlAPI } from '../services/apiService';
import {
  TrendingUp, Package, ShoppingCart, ArrowUpRight, ArrowDownRight,
  ArrowLeft, BarChart3, Target, ChevronRight, Brain, Loader2,
} from 'lucide-react';

interface HistoryPoint {
  label: string;
  quantity: number;
  forecast?: number | null;
}

interface PortfolioProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  current_stock: number;
}

interface PortfolioData {
  period: string;
  total_demand: number;
  current_period_quantity: number;
  previous_period_quantity: number;
  change_percent: number;
  products_tracked: number;
  demand_series: Array<{ label: string; quantity: number }>;
  top_products: PortfolioProduct[];
  forecast_accuracy?: { mape: number | null; bias: number | null; products_with_data: number };
  demand_patterns?: Record<string, number>;
}

interface AccuracyPoint {
  label: string;
  predicted: number;
  actual: number;
  error: number;
  pct_error: number;
}

interface AccuracyData {
  mape: number | null;
  bias: number | null;
  accuracy_data: AccuracyPoint[];
  total_predictions: number;
  matched_predictions: number;
  ml_mape?: number | null;
  ml_bias?: number | null;
  ml_rmse?: number | null;
  ml_accuracy_data?: AccuracyPoint[];
}

interface DemandPattern {
  pattern: string;
  confidence: number;
  description: string;
}

interface MultiStepForecast {
  period: string;
  value: number;
  lower: number;
  upper: number;
}

interface DemandAnomaly {
  month: string;
  actual: number;
  expected: number;
  deviation: number;
  direction: string;
}

interface DemandInsights {
  ml_available: boolean;
  message?: string;
  demand_pattern?: DemandPattern;
  anomalies?: DemandAnomaly[];
  multi_step_forecast?: MultiStepForecast[];
  feature_importance?: Record<string, number>;
}

interface ProductSummary {
  product_id: number;
  product_name: string;
  change_percent: number;
  current_period_quantity: number;
  previous_period_quantity: number;
  forecast: { quantity: number; created_at: string | null; source: string; method?: string; confidence_lower?: number; confidence_upper?: number; trend_slope?: number; demand_pattern?: DemandPattern; multi_step_forecast?: MultiStepForecast[]; anomalies?: DemandAnomaly[]; feature_importance?: Record<string, number> };
  inventory: { current_stock: number; reorder_point: number };
  recommendation: { suggested_reorder_quantity: number; urgency: string; message: string };
}

const DemandPlanningPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [products, setProducts] = useState<Array<{ id: number; product_name: string }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  // Product detail state
  const [historySeries, setHistorySeries] = useState<HistoryPoint[]>([]);
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyData | null>(null);
  const [insights, setInsights] = useState<DemandInsights | null>(null);
  const [mlForecast, setMlForecast] = useState<{ predicted_demand: number; forecast_date: string } | null>(null);
  const [mlForecastLoading, setMlForecastLoading] = useState(false);

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
  ];

  // Fetch product list
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await inventoryAPI.getProducts({ page_size: 1000 });
        const productList = (response.data?.data || []).map((p: { id: number; product_name: string }) => ({
          id: p.id, product_name: p.product_name,
        }));
        setProducts(productList);
      } catch {
        setError('Unable to load products.');
      }
    };
    fetchProducts();
  }, []);

  // Fetch portfolio data when no product is selected
  useEffect(() => {
    if (selectedProductId !== null) return;
    const fetchPortfolio = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await demandAPI.getPortfolioSummary(selectedPeriod);
        setPortfolio(res.data);
      } catch (err: unknown) {
        // Retry once on 401 (token may still be loading)
        if ((err as { response?: { status?: number } })?.response?.status === 401) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            const res = await demandAPI.getPortfolioSummary(selectedPeriod);
            setPortfolio(res.data);
            setLoading(false);
            return;
          } catch { /* fall through */ }
        }
        setError('Unable to load demand data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [selectedPeriod, selectedProductId]);

  // Fetch product detail when a product is selected
  useEffect(() => {
    if (selectedProductId === null) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const [historyRes, summaryRes, accuracyRes, insightsRes] = await Promise.all([
          demandAPI.getDemandHistory(selectedProductId, selectedPeriod),
          demandAPI.getDemandSummary(selectedProductId, selectedPeriod),
          demandAPI.getForecastAccuracy(selectedProductId),
          demandAPI.getDemandInsights(selectedProductId).catch(() => ({ data: { ml_available: false } })),
        ]);
        const sData = summaryRes.data;
        const hData: HistoryPoint[] = historyRes.data.series.map(
          (pt: { label: string; quantity: number }) => ({ label: pt.label, quantity: pt.quantity, forecast: null }),
        );

        // Append forecast points (only forecast values, no actual quantity)
        const forecastQty = sData.forecast.quantity;
        const multiStep = sData.forecast.multi_step_forecast || [];
        if (multiStep.length > 0) {
          for (const step of multiStep) {
            hData.push({ label: step.period, quantity: 0, forecast: step.value });
          }
        } else {
          hData.push({ label: 'Next Period', quantity: 0, forecast: forecastQty });
        }

        setHistorySeries(hData);
        setSummary(sData);
        setAccuracy(accuracyRes.data);
        setInsights(insightsRes.data);
      } catch {
        setError('Unable to load demand data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedPeriod, selectedProductId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-8">
        <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Demand Planning</h1>
        <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d] mt-2">Add products and order history to start forecasting.</p>
      </div>
    );
  }

  const handleRefreshForecast = async () => {
    if (!selectedProductId) return;
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + 1);
    const dateStr = forecastDate.toISOString().split('T')[0];

    setMlForecastLoading(true);
    try {
      const res = await mlAPI.getDemandForecast(selectedProductId, dateStr);
      setMlForecast(res.data);
    } catch {
      setMlForecast(null);
    } finally {
      setMlForecastLoading(false);
    }
  };

  // PRODUCT DETAIL VIEW
  if (selectedProductId !== null && summary) {
    return (
      <ProductDetailView
        summary={summary}
        historySeries={historySeries}
        accuracy={accuracy}
        insights={insights}
        selectedPeriod={selectedPeriod}
        periods={periods}
        onPeriodChange={(p) => setSelectedPeriod(p as 'week' | 'month' | 'quarter')}
        onBack={() => setSelectedProductId(null)}
        error={error}
        mlForecast={mlForecast}
        mlForecastLoading={mlForecastLoading}
        onRefreshForecast={handleRefreshForecast}
      />
    );
  }

  // PORTFOLIO VIEW
  const portfolioChange = portfolio?.change_percent ?? 0;
  const portfolioPositive = portfolioChange >= 0;

  return (
    <div className="py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Demand Planning</h1>
          <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d] mt-1">Portfolio overview across all products</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-0.5 self-start">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id as 'week' | 'month' | 'quarter')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                selectedPeriod === p.id
                  ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
                  : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          icon={<BarChart3 className="w-4 h-4" />}
          label="Total Demand"
          value={(portfolio?.total_demand ?? 0).toLocaleString()}
          sub={`This ${selectedPeriod}`}
          color="text-[#0071e3] dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatBlock
          icon={portfolioPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          label="Period Change"
          value={`${portfolioPositive ? '+' : ''}${portfolioChange}%`}
          sub={`${portfolio?.previous_period_quantity ?? 0} → ${portfolio?.current_period_quantity ?? 0} units`}
          color={portfolioPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}
          bg={portfolioPositive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}
        />
        <StatBlock
          icon={<Target className="w-4 h-4" />}
          label="Forecast Accuracy"
          value={portfolio?.forecast_accuracy?.mape != null ? `${portfolio.forecast_accuracy.mape}% MAPE` : '—'}
          sub={portfolio?.forecast_accuracy?.mape != null ? `Across ${portfolio.forecast_accuracy.products_with_data} products` : 'Need 4+ months of data'}
          color={portfolio?.forecast_accuracy?.mape != null && portfolio.forecast_accuracy.mape < 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#86868b] dark:text-[#98989d]'}
          bg={portfolio?.forecast_accuracy?.mape != null && portfolio.forecast_accuracy.mape < 25 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-[#2c2c2e]'}
        />
        <StatBlock
          icon={<Package className="w-4 h-4" />}
          label="Products Tracked"
          value={`${portfolio?.products_tracked ?? 0}`}
          sub="With order history"
          color="text-[#1d1d1f] dark:text-white"
          bg="bg-gray-100 dark:bg-[#2c2c2e]"
        />
      </div>

      {/* Top Movers Chart */}
      {portfolio && portfolio.top_products.length > 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Top Movers</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">Products by demand volume</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#0071e3]" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portfolio.top_products} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fill: '#86868b', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="product_name"
                  tick={{ fill: '#86868b', fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  formatter={(value: number) => [`${value} units`, 'Demand']}
                />
                <Bar dataKey="total_quantity" fill="#0071e3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Portfolio Demand Trend */}
      {portfolio && portfolio.demand_series.length > 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Aggregate Demand Trend</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">All products combined</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#0071e3]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolio.demand_series}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071e3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fill: '#86868b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#86868b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  formatter={(value: number) => [`${value} units`, 'Demand']}
                />
                <Area type="monotone" dataKey="quantity" stroke="#0071e3" strokeWidth={2} fill="url(#portfolioGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Demand Pattern Distribution */}
      {portfolio?.demand_patterns && Object.keys(portfolio.demand_patterns).length > 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Demand Patterns</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">ML classification across products</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#0071e3]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(portfolio.demand_patterns).map(([pattern, count]) => (
              <div key={pattern} className={`rounded-xl p-3 text-center ${
                pattern === 'stable' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                pattern === 'trending_up' ? 'bg-blue-50 dark:bg-blue-900/20' :
                pattern === 'trending_down' ? 'bg-amber-50 dark:bg-amber-900/20' :
                pattern === 'seasonal' ? 'bg-purple-50 dark:bg-purple-900/20' :
                pattern === 'erratic' ? 'bg-red-50 dark:bg-red-900/20' :
                pattern === 'intermittent' ? 'bg-orange-50 dark:bg-orange-900/20' :
                'bg-gray-50 dark:bg-[#2c2c2e]'
              }`}>
                <p className={`text-2xl font-semibold ${
                  pattern === 'stable' ? 'text-emerald-600 dark:text-emerald-400' :
                  pattern === 'trending_up' ? 'text-blue-600 dark:text-blue-400' :
                  pattern === 'trending_down' ? 'text-amber-600 dark:text-amber-400' :
                  pattern === 'seasonal' ? 'text-purple-600 dark:text-purple-400' :
                  pattern === 'erratic' ? 'text-red-600 dark:text-red-400' :
                  pattern === 'intermittent' ? 'text-orange-600 dark:text-orange-400' :
                  'text-[#1d1d1f] dark:text-white'
                }`}>{count}</p>
                <p className="text-xs text-[#86868b] dark:text-[#98989d] capitalize">{pattern.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">All Products</h2>
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">Click a product to view detailed forecast</p>
          </div>
        </div>
        {portfolio && portfolio.top_products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#38383a]">
                  <th className="text-left py-3 text-[#86868b] dark:text-[#98989d] font-medium">Product</th>
                  <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Demand</th>
                  <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Stock</th>
                  <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.top_products.map((p) => (
                  <tr
                    key={p.product_id}
                    className="border-b border-gray-50 dark:border-[#2c2c2e] last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
                    onClick={() => setSelectedProductId(p.product_id)}
                  >
                    <td className="py-3 text-[#1d1d1f] dark:text-white font-medium">{p.product_name}</td>
                    <td className="text-right py-3 text-[#1d1d1f] dark:text-white">{p.total_quantity.toLocaleString()}</td>
                    <td className="text-right py-3 text-[#86868b] dark:text-[#98989d]">{p.current_stock.toLocaleString()}</td>
                    <td className="text-right py-3">
                      <ChevronRight className="w-4 h-4 text-[#86868b] dark:text-[#98989d] inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">No demand data yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Product Detail View Component
const ProductDetailView = ({
  summary, historySeries, accuracy, insights, selectedPeriod, periods, onPeriodChange, onBack, error,
  mlForecast, mlForecastLoading, onRefreshForecast,
}: {
  summary: ProductSummary;
  historySeries: HistoryPoint[];
  accuracy: AccuracyData | null;
  insights: DemandInsights | null;
  selectedPeriod: string;
  periods: Array<{ id: string; label: string }>;
  onPeriodChange: (p: string) => void;
  onBack: () => void;
  error: string;
  mlForecast: { predicted_demand: number; forecast_date: string } | null;
  mlForecastLoading: boolean;
  onRefreshForecast: () => void;
}) => {
  // Build forecast chart data with confidence band
  const multiStep = summary.forecast.multi_step_forecast || [];
  const hasMultiStep = multiStep.length > 0;
  const anomalies = summary.forecast.anomalies || insights?.anomalies || [];
  const anomalyMonths = new Set(anomalies.map(a => a.month));
  const demandPattern = summary.forecast.demand_pattern || insights?.demand_pattern;

  const forecastChart = historySeries.map((pt) => {
    const isForecast = pt.forecast !== null && pt.forecast !== undefined;
    const step = isForecast && hasMultiStep ? multiStep.find(m => m.period === pt.label) : null;

    return {
      label: pt.label,
      actual: isForecast ? null : pt.quantity,
      forecast: pt.forecast ?? null,
      forecastUpper: step ? step.upper : null,
      forecastLower: step ? step.lower : null,
      anomaly: anomalyMonths.has(pt.label) ? pt.quantity : null,
    };
  });

  return (
    <div className="py-8 space-y-8">
      {/* Header with back button */}
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#0071e3] dark:text-blue-400 hover:underline self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portfolio
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{summary.product_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d]">Demand forecast & analysis</p>
              {demandPattern && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  demandPattern.pattern === 'stable' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                  demandPattern.pattern === 'trending_up' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                  demandPattern.pattern === 'trending_down' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  demandPattern.pattern === 'seasonal' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                  demandPattern.pattern === 'erratic' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  demandPattern.pattern === 'intermittent' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                }`}>
                  {demandPattern.pattern === 'stable' ? 'Stable' :
                   demandPattern.pattern === 'trending_up' ? 'Trending Up' :
                   demandPattern.pattern === 'trending_down' ? 'Trending Down' :
                   demandPattern.pattern === 'seasonal' ? 'Seasonal' :
                   demandPattern.pattern === 'erratic' ? 'Erratic' :
                   demandPattern.pattern === 'intermittent' ? 'Intermittent' :
                   demandPattern.pattern.charAt(0).toUpperCase() + demandPattern.pattern.slice(1).replace('_', ' ')}
                </span>
              )}
              {summary.forecast.source === 'ml' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  ML Powered
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshForecast}
              disabled={mlForecastLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0071e3] text-white rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-all disabled:opacity-60"
            >
              {mlForecastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {mlForecastLoading ? 'Forecasting...' : 'Refresh ML Forecast'}
            </button>
            <div className="flex gap-1.5 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-1">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPeriodChange(p.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    selectedPeriod === p.id
                      ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
                      : 'text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ML Forecast Result */}
      {mlForecast && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-[#0071e3] dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                ML Forecast for {mlForecast.forecast_date}: <span className="text-[#0071e3] dark:text-blue-400">{Math.round(mlForecast.predicted_demand)} units</span>
              </p>
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">Predicted by XGBoost demand forecasting model</p>
            </div>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {/* Product KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          icon={<TrendingUp className="w-4 h-4" />}
          label="Forecasted Demand"
          value={Math.round(summary.forecast.quantity).toLocaleString()}
          sub={summary.forecast.source === 'ml' ? 'ML model' : summary.forecast.source === 'statistical' ? 'Statistical model' : 'Historical average'}
          color="text-[#0071e3] dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatBlock
          icon={<Target className="w-4 h-4" />}
          label="Forecast Accuracy"
          value={accuracy?.mape != null ? `${accuracy.mape}%` : '—'}
          sub={accuracy?.mape != null ? `Based on ${accuracy.matched_predictions} predictions` : 'Insufficient data'}
          color={accuracy?.mape != null && accuracy.mape < 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#86868b] dark:text-[#98989d]'}
          bg={accuracy?.mape != null && accuracy.mape < 20 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-[#2c2c2e]'}
        />
        <StatBlock
          icon={<Package className="w-4 h-4" />}
          label="Current Stock"
          value={summary.inventory.current_stock.toLocaleString()}
          sub={`Reorder at ${summary.inventory.reorder_point}`}
          color="text-[#1d1d1f] dark:text-white"
          bg="bg-gray-100 dark:bg-[#2c2c2e]"
        />
        <StatBlock
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Suggested Reorder"
          value={`${summary.recommendation.suggested_reorder_quantity}`}
          sub={summary.recommendation.urgency === 'high' ? 'Order soon' : 'Stock adequate'}
          color={summary.recommendation.suggested_reorder_quantity > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bg={summary.recommendation.suggested_reorder_quantity > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}
        />
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Demand Forecast</h2>
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">
              Historical demand with forecast projection
              {summary.forecast.method && ` (${summary.forecast.method})`}
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-[#0071e3]" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastChart}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071e3" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0071e3" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fill: '#86868b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#86868b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    actual: 'Actual Demand',
                    forecast: 'Forecast',
                    forecastUpper: 'Upper Bound',
                    forecastLower: 'Lower Bound',
                  };
                  return [`${value} units`, labels[name] || name];
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    actual: 'Actual Demand',
                    forecast: 'Forecast',
                  };
                  return labels[value] || value;
                }}
              />
              {/* Confidence band */}
              <Area type="monotone" dataKey="forecastUpper" stroke="none" fill="url(#forecastBand)" legendType="none" connectNulls />
              <Area type="monotone" dataKey="forecastLower" stroke="none" fill="url(#forecastBand)" legendType="none" connectNulls />
              {/* Actual line */}
              <Line type="monotone" dataKey="actual" stroke="#86868b" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
              {/* Forecast line */}
              <Line type="monotone" dataKey="forecast" stroke="#0071e3" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 5, fill: '#0071e3' }} connectNulls={false} />
              {/* Anomaly markers */}
              <Line type="monotone" dataKey="anomaly" stroke="none" dot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} connectNulls={false} legendType="none" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Accuracy Chart */}
      {accuracy && accuracy.accuracy_data.length > 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Forecast Accuracy</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">
                Prediction error per period
                {accuracy.bias !== null && (
                  <span className={accuracy.bias > 0 ? 'text-amber-500 ml-2' : 'text-emerald-500 ml-2'}>
                    Bias: {accuracy.bias > 0 ? '+' : ''}{accuracy.bias} units
                  </span>
                )}
              </p>
            </div>
            <Target className="w-5 h-5 text-[#0071e3]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracy.accuracy_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fill: '#86868b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#86868b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { predicted: 'Predicted', actual: 'Actual' };
                    return [`${value} units`, labels[name] || name];
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const labels: Record<string, string> = { predicted: 'Predicted', actual: 'Actual' };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="actual" fill="#86868b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predicted" fill="#0071e3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {summary.recommendation.message && (
        <div className={`rounded-xl p-6 ${
          summary.recommendation.suggested_reorder_quantity > 0
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${summary.recommendation.suggested_reorder_quantity > 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
              <ShoppingCart className={`w-5 h-5 ${summary.recommendation.suggested_reorder_quantity > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div>
              <p className="font-medium text-[#1d1d1f] dark:text-white">{summary.recommendation.message}</p>
              <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">
                Forecast source: {summary.forecast.source === 'ml' ? 'Machine Learning model' : summary.forecast.source === 'statistical' ? 'Statistical model (EWMA + trend)' : 'Historical average'}.
                {summary.forecast.created_at && ` Last updated ${new Date(summary.forecast.created_at).toLocaleDateString()}.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ML Unavailable Notice */}
      {insights && !insights.ml_available && insights.message && (
        <div className="bg-gray-50 dark:bg-[#2c2c2e] rounded-xl p-4">
          <p className="text-sm text-[#86868b] dark:text-[#98989d]">
            <span className="font-medium text-[#1d1d1f] dark:text-white">ML Insights:</span> {insights.message}
          </p>
        </div>
      )}

      {/* ML Insights Panel */}
      {insights?.ml_available && demandPattern && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Demand Intelligence</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">ML-powered demand analysis</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#0071e3]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demand Pattern */}
            <div className="rounded-xl bg-gray-50 dark:bg-[#2c2c2e] p-4">
              <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-1">Demand Pattern</p>
              <p className="text-lg font-semibold text-[#1d1d1f] dark:text-white capitalize">
                {demandPattern.pattern.replace('_', ' ')}
              </p>
              <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">{demandPattern.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.round(demandPattern.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-[#86868b] dark:text-[#98989d]">{Math.round(demandPattern.confidence * 100)}%</span>
              </div>
            </div>

            {/* Anomalies */}
            <div className="rounded-xl bg-gray-50 dark:bg-[#2c2c2e] p-4">
              <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-1">Anomalies Detected</p>
              {anomalies.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {anomalies.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#1d1d1f] dark:text-white">{a.month}</span>
                      <span className={a.direction === 'spike' ? 'text-red-500' : 'text-amber-500'}>
                        {a.direction === 'spike' ? '↑' : '↓'} {Math.abs(a.deviation).toFixed(1)}σ
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">No anomalies detected</p>
              )}
            </div>

            {/* Feature Importance */}
            {insights.feature_importance && Object.keys(insights.feature_importance).length > 0 && (
              <div className="rounded-xl bg-gray-50 dark:bg-[#2c2c2e] p-4 md:col-span-2">
                <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-2">Key Demand Drivers</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(insights.feature_importance).slice(0, 6).map(([feature, importance]) => (
                    <span key={feature} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      {feature.replace(/_/g, ' ')}
                      <span className="ml-1.5 text-blue-400 dark:text-blue-500">{(importance * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ML vs Statistical Accuracy Comparison */}
      {accuracy?.ml_mape !== null && accuracy?.ml_mape !== undefined && accuracy?.mape !== null && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-4">Model Comparison</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 dark:bg-[#2c2c2e] p-4 text-center">
              <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-1">Statistical (EWMA)</p>
              <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">{accuracy.mape}%</p>
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">MAPE</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${
              (accuracy.ml_mape ?? 100) < (accuracy.mape ?? 100)
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-50 dark:bg-[#2c2c2e]'
            }`}>
              <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-1">ML (XGBoost)</p>
              <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">{accuracy.ml_mape}%</p>
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">MAPE</p>
              {(accuracy.ml_mape ?? 100) < (accuracy.mape ?? 100) && accuracy.mape! > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {Math.round(((accuracy.mape! - accuracy.ml_mape!) / accuracy.mape!) * 100)}% more accurate
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBlock = ({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string;
}) => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-5">
    <div className="flex items-center gap-2 mb-2">
      <div className={`${bg} ${color} p-1.5 rounded-md`}>{icon}</div>
      <span className="text-xs text-[#86868b] dark:text-[#98989d]">{label}</span>
    </div>
    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">{sub}</p>
  </div>
);

export default DemandPlanningPage;
