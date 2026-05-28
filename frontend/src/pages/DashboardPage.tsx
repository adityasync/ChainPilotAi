import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/apiService';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AskAI from '../components/AskAI';

interface Insight {
  id: number;
  title: string;
  message: string;
  severity: string;
  recommended_action: string;
}

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    needsAttention: 0,
    inventoryHealth: 0,
    stockoutRisks: 0,
    suppliersAtRisk: 0,
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getSummary();
        const summary = response.data;

        setStats({
          totalProducts: summary.kpis.total_products,
          needsAttention: summary.kpis.needs_attention_count,
          inventoryHealth: summary.kpis.inventory_health,
          stockoutRisks: summary.kpis.stockout_risk_count + summary.kpis.overstock_risk_count,
          suppliersAtRisk: summary.kpis.suppliers_at_risk,
        });
        setInsights(summary.top_insights || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 stagger-children">
      {/* Hero Section */}
      <section className="mb-20">
        <h1 className="text-6xl font-semibold text-[#1d1d1f] tracking-tight leading-tight mb-4">
          Good afternoon.
        </h1>
        <p className="text-2xl text-[#86868b]">
          {stats.totalProducts} products tracked
          {stats.needsAttention > 0 && (
            <>, <span className="text-[#1d1d1f]">{stats.needsAttention} need attention</span></>
          )}
        </p>
      </section>

      <AskAI />

      {error && (
        <section className="mb-10">
          <div className="rounded-2xl bg-[#fff4f4] px-5 py-4 text-sm text-[#b42318]">
            {error}
          </div>
        </section>
      )}

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <MetricCard
          label="Inventory Health"
          value={`${stats.inventoryHealth}%`}
          status={stats.inventoryHealth > 80 ? 'good' : stats.inventoryHealth > 50 ? 'warning' : 'critical'}
        />
        <MetricCard
          label="Stock Risks"
          value={`${stats.stockoutRisks}`}
          status={stats.stockoutRisks === 0 ? 'good' : stats.stockoutRisks < 3 ? 'warning' : 'critical'}
        />
        <MetricCard
          label="Supplier Risk"
          value={`${stats.suppliersAtRisk}`}
          status={stats.suppliersAtRisk === 0 ? 'good' : stats.suppliersAtRisk < 3 ? 'warning' : 'critical'}
        />
      </section>

      {/* Action Items */}
      {insights.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-[#1d1d1f]">
              Needs attention
            </h2>
            <Link
              to="/insights"
              className="text-[#0071e3] hover:underline flex items-center gap-1 text-sm font-medium"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightItem key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {insights.length === 0 && (
        <section className="text-center py-16">
          <p className="text-2xl text-[#86868b]">
            Everything looks good. No action needed.
          </p>
        </section>
      )}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}

const MetricCard = ({ label, value, status }: MetricCardProps) => {
  const statusColors = {
    good: 'text-[#34c759]',
    warning: 'text-[#ff9f0a]',
    critical: 'text-[#ff3b30]',
  };

  return (
    <div className="bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-lg">
      <p className="text-sm text-[#86868b] mb-2">{label}</p>
      <p className={`text-5xl font-semibold ${statusColors[status]} tracking-tight`}>
        {value}
      </p>
    </div>
  );
};

interface InsightItemProps {
  insight: Insight;
}

const InsightItem = ({ insight }: InsightItemProps) => {
  const severityDot = {
    critical: 'bg-[#ff3b30]',
    high: 'bg-[#ff9f0a]',
    medium: 'bg-[#ffcc00]',
    low: 'bg-[#34c759]',
  };

  return (
    <div className="bg-white rounded-2xl p-6 flex items-start gap-4 transition-all duration-300 hover:shadow-lg cursor-pointer">
      <div
        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${severityDot[insight.severity as keyof typeof severityDot] || 'bg-gray-400'
          }`}
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium text-[#1d1d1f] mb-1">
          {insight.title}
        </h3>
        <p className="text-[#86868b] line-clamp-2">
          {insight.message}
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-[#86868b] flex-shrink-0 mt-1" />
    </div>
  );
};

export default DashboardPage;
