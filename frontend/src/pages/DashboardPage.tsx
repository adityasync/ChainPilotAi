import { useState, useEffect } from 'react';
import { dashboardAPI, mlAPI } from '../services/apiService';
import {
  Package, AlertTriangle, Users, ArrowRight,
  TrendingUp, ShoppingCart,
  Clock, ShieldCheck, Brain, Loader2, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import AskAI from '../components/AskAI';
import { KPIGridSkeleton, ChartSkeleton, PieSkeleton, TableSkeleton, SectionTitleSkeleton } from '../components/Skeleton';

interface Insight {
  id: number;
  title: string;
  message: string;
  severity: string;
  recommended_action?: string;
  category?: string;
  priority_score?: number;
  created_at?: string;
}

interface DemandPoint {
  label: string;
  quantity: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  current_stock: number;
  risk_status: string;
}

interface ReorderAlert {
  product_id: number;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  days_of_supply: number | null;
  urgency: string;
}

interface SupplierSummary {
  total: number;
  at_risk: number;
  avg_reliability: number | null;
}

const CHART_COLORS = {
  healthy: '#34c759',
  stockout: '#ff9f0a',
  critical: '#ff3b30',
  overstock: '#0071e3',
};

const RISK_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  stockout: 'Low Stock',
  critical: 'Critical',
  overstock: 'Overstock',
};

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
};

const DashboardPage = () => {
  const isMobile = useIsMobile();
  const [kpis, setKpis] = useState({
    total_products: 0,
    inventory_health: 0,
    stockout_risk_count: 0,
    critical_risk_count: 0,
    overstock_risk_count: 0,
    suppliers_at_risk: 0,
    needs_attention_count: 0,
  });
  const [demandTrend, setDemandTrend] = useState<DemandPoint[]>([]);
  const [inventoryBreakdown, setInventoryBreakdown] = useState({ healthy: 0, stockout: 0, critical: 0, overstock: 0 });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [supplierSummary, setSupplierSummary] = useState<SupplierSummary>({ total: 0, at_risk: 0, avg_reliability: null });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [actionRequired, setActionRequired] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');

  const fetchData = async () => {
    try {
      const [res, actionRes] = await Promise.all([
        dashboardAPI.getSummary(),
        mlAPI.getActionRequiredInsights().catch(() => ({ data: [] })),
      ]);
      const d = res.data;
      setKpis(d.kpis);
      setDemandTrend(d.demand_trend || []);
      setInventoryBreakdown(d.inventory_breakdown || { healthy: 0, stockout: 0, critical: 0, overstock: 0 });
      setTopProducts(d.top_products || []);
      setReorderAlerts(d.reorder_alerts || []);
      setSupplierSummary(d.supplier_summary || { total: 0, at_risk: 0, avg_reliability: null });
      setInsights(d.top_insights || []);
      setActionRequired(actionRes.data || []);
    } catch {
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRunAnalysis = async () => {
    setRunningAnalysis(true);
    setAnalysisResult('');
    setError('');
    try {
      const res = await mlAPI.runAnalysis();
      const { predictions_count, insights_count } = res.data;
      setAnalysisResult(`Analysis complete: ${predictions_count} predictions, ${insights_count} insights generated.`);
      await fetchData();
    } catch {
      setError('ML analysis failed. Please try again.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 space-y-8">
        <SectionTitleSkeleton />
        <KPIGridSkeleton count={4} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartSkeleton />
          <PieSkeleton />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  const totalRisks = kpis.stockout_risk_count + kpis.critical_risk_count + kpis.overstock_risk_count;
  const healthColor = kpis.inventory_health > 80 ? 'text-emerald-600 dark:text-emerald-400' : kpis.inventory_health > 50 ? 'text-amber-500' : 'text-red-500';
  const healthBg = kpis.inventory_health > 80 ? 'bg-emerald-50 dark:bg-emerald-900/20' : kpis.inventory_health > 50 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20';

  const pieData = [
    { name: 'Healthy', value: inventoryBreakdown.healthy, color: CHART_COLORS.healthy },
    { name: 'Low Stock', value: inventoryBreakdown.stockout, color: CHART_COLORS.stockout },
    { name: 'Critical', value: inventoryBreakdown.critical, color: CHART_COLORS.critical },
    { name: 'Overstock', value: inventoryBreakdown.overstock, color: CHART_COLORS.overstock },
  ].filter(d => d.value > 0);

  return (
    <div className="py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d] mt-1">
            Supply chain overview for your {kpis.total_products} products
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={runningAnalysis}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-all disabled:opacity-60"
        >
          {runningAnalysis ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {runningAnalysis ? 'Running Analysis...' : 'Run ML Analysis'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {analysisResult && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-5 py-3 text-sm text-emerald-700 dark:text-emerald-400">{analysisResult}</div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Package className="w-5 h-5" />}
          label="Total Products"
          value={`${kpis.total_products}`}
          subtitle="Tracked in inventory"
          color="text-[#1d1d1f] dark:text-white"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <KPICard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Inventory Health"
          value={`${kpis.inventory_health}%`}
          subtitle={`${inventoryBreakdown.healthy} products healthy`}
          color={healthColor}
          bg={healthBg}
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Stock Risks"
          value={`${totalRisks}`}
          subtitle={`${kpis.critical_risk_count} critical, ${kpis.stockout_risk_count} low stock`}
          color={totalRisks > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}
          bg={totalRisks > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}
        />
        <KPICard
          icon={<Users className="w-5 h-5" />}
          label="Suppliers at Risk"
          value={`${kpis.suppliers_at_risk}`}
          subtitle={`of ${supplierSummary.total} total`}
          color={kpis.suppliers_at_risk > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}
          bg={kpis.suppliers_at_risk > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Demand Trend Chart */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Demand Trend</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">Order volume over the last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#0071e3]" />
          </div>
          {demandTrend.length > 0 ? (
            <div className={isMobile ? 'h-48' : 'h-64'}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandTrend} margin={{ top: 5, right: 10, left: isMobile ? -10 : 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071e3" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fill: '#86868b', fontSize: isMobile ? 10 : 11 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 40 : 30} />
                  <YAxis tick={{ fill: '#86868b', fontSize: isMobile ? 10 : 11 }} width={isMobile ? 35 : 40} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, backgroundColor: '#fff', color: '#1d1d1f', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    labelStyle={{ color: '#1d1d1f', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: '#1d1d1f' }}
                    formatter={(value: number) => [`${value} units`, 'Demand']}
                  />
                  <Area
                    type="monotone"
                    dataKey="quantity"
                    stroke="#0071e3"
                    strokeWidth={2}
                    fill="url(#demandGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">No demand data yet</p>
            </div>
          )}
        </div>

        {/* Inventory Status Donut */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Inventory Status</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">Product health breakdown</p>
            </div>
            <Package className="w-5 h-5 text-[#0071e3]" />
          </div>
          {pieData.length > 0 ? (
            <div className={`flex ${isMobile ? 'flex-col items-center' : 'items-center'} ${isMobile ? 'h-auto' : 'h-64'}`}>
              <div className={isMobile ? 'w-full h-48' : 'w-1/2 h-full'}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 55}
                      outerRadius={isMobile ? 65 : 85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, backgroundColor: '#fff', color: '#1d1d1f', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelStyle={{ color: '#1d1d1f', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#1d1d1f' }}
                      formatter={(value: number, name: string) => [`${value} products`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={isMobile ? 'w-full grid grid-cols-2 gap-2 mt-2' : 'w-1/2 space-y-3 pl-4'}>
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-[#86868b] dark:text-[#98989d]">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#1d1d1f] dark:text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">No inventory data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Top Products</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">By demand volume (last 3 months)</p>
            </div>
            <ShoppingCart className="w-5 h-5 text-[#0071e3]" />
          </div>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#38383a]">
                    <th className="text-left py-3 text-[#86868b] dark:text-[#98989d] font-medium">Product</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Demand</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Stock</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.product_id} className="border-b border-gray-50 dark:border-[#2c2c2e] last:border-0">
                      <td className="py-3">
                        <Link to="/inventory" className="text-[#1d1d1f] dark:text-white font-medium hover:text-[#0071e3] dark:hover:text-blue-400">
                          {p.product_name}
                        </Link>
                      </td>
                      <td className="text-right py-3 text-[#1d1d1f] dark:text-white">{p.total_quantity.toLocaleString()}</td>
                      <td className="text-right py-3 text-[#1d1d1f] dark:text-white">{p.current_stock.toLocaleString()}</td>
                      <td className="text-right py-3">
                        <RiskBadge status={p.risk_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">No order data yet</p>
            </div>
          )}
        </div>

        {/* Reorder Alerts */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Reorder Alerts</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">Products that need attention</p>
            </div>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          {reorderAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#38383a]">
                    <th className="text-left py-3 text-[#86868b] dark:text-[#98989d] font-medium">Product</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Stock</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Reorder Pt</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Days Left</th>
                    <th className="text-right py-3 text-[#86868b] dark:text-[#98989d] font-medium">Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderAlerts.map((a) => (
                    <tr key={a.product_id} className="border-b border-gray-50 dark:border-[#2c2c2e] last:border-0">
                      <td className="py-3">
                        <Link to="/inventory" className="text-[#1d1d1f] dark:text-white font-medium hover:text-[#0071e3] dark:hover:text-blue-400">
                          {a.product_name}
                        </Link>
                      </td>
                      <td className="text-right py-3 text-[#1d1d1f] dark:text-white">{a.current_stock.toLocaleString()}</td>
                      <td className="text-right py-3 text-[#86868b] dark:text-[#98989d]">{a.reorder_point.toLocaleString()}</td>
                      <td className="text-right py-3 text-[#1d1d1f] dark:text-white">
                        {a.days_of_supply !== null ? `${a.days_of_supply}d` : '—'}
                      </td>
                      <td className="text-right py-3">
                        <UrgencyBadge urgency={a.urgency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">All products are well stocked</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Insights + Supplier Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Action Required */}
          {actionRequired.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Action Required</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  {actionRequired.length}
                </span>
              </div>
              <div className="space-y-3">
                {actionRequired.slice(0, 5).map((insight) => (
                  <InsightRow key={insight.id} insight={insight} urgent />
                ))}
              </div>
            </div>
          )}

          {/* Priority Insights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white">Priority Insights</h2>
              <Link to="/insights" className="text-sm text-[#0071e3] dark:text-blue-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <InsightRow key={insight.id} insight={insight} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-8 text-center">
                <p className="text-[#86868b] dark:text-[#98989d]">All clear — no critical issues detected.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-4">Supplier Health</h2>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#86868b] dark:text-[#98989d]">Total Suppliers</span>
              <span className="text-lg font-semibold text-[#1d1d1f] dark:text-white">{supplierSummary.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#86868b] dark:text-[#98989d]">At Risk</span>
              <span className={`text-lg font-semibold ${supplierSummary.at_risk > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {supplierSummary.at_risk}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#86868b] dark:text-[#98989d]">Avg Reliability</span>
              <span className="text-lg font-semibold text-[#1d1d1f] dark:text-white">
                {supplierSummary.avg_reliability !== null ? `${(supplierSummary.avg_reliability * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-[#38383a]">
              <Link to="/suppliers" className="text-sm text-[#0071e3] dark:text-blue-400 hover:underline flex items-center gap-1">
                View all suppliers <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AskAI />
    </div>
  );
};

const KPICard = ({ icon, label, value, subtitle, color, bg }: {
  icon: React.ReactNode; label: string; value: string; subtitle?: string; color: string; bg: string;
}) => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-5 flex items-start gap-4">
    <div className={`${bg} ${color} p-2.5 rounded-lg`}>{icon}</div>
    <div>
      <p className="text-sm text-[#86868b] dark:text-[#98989d]">{label}</p>
      <p className={`text-2xl font-semibold ${color} tracking-tight`}>{value}</p>
      {subtitle && <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const RiskBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    healthy: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    stockout: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    critical: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    overstock: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.healthy}`}>
      {RISK_LABELS[status] || status}
    </span>
  );
};

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    high: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    low: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[urgency] || ''}`}>
      {urgency}
    </span>
  );
};

const InsightRow = ({ insight, urgent }: { insight: Insight; urgent?: boolean }) => {
  const dot: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-yellow-400',
    low: 'bg-emerald-500',
  };
  return (
    <Link
      to="/insights"
      className={`block bg-white dark:bg-[#1c1c1e] rounded-xl px-5 py-4 hover:shadow-md dark:hover:shadow-black/30 transition-shadow ${
        urgent ? 'border-l-4 border-l-red-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot[insight.severity] || 'bg-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{insight.title}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              insight.severity === 'critical'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : insight.severity === 'high'
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                : 'bg-gray-100 dark:bg-[#2c2c2e] text-[#86868b] dark:text-[#98989d]'
            }`}>
              {insight.severity}
            </span>
            {insight.category && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#2c2c2e] text-[#86868b] dark:text-[#98989d]">
                {insight.category}
              </span>
            )}
          </div>
          <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-0.5 line-clamp-1">{insight.message}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#86868b] dark:text-[#98989d] flex-shrink-0 mt-0.5" />
      </div>
    </Link>
  );
};

export default DashboardPage;
