import { useEffect, useState } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { demandAPI, inventoryAPI } from '../services/apiService';

const DemandPlanningPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [products, setProducts] = useState<Array<{ id: number; product_name: string }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historySeries, setHistorySeries] = useState<
    Array<{ label: string; quantity: number; forecast?: number | null }>
  >([]);
  const [summary, setSummary] = useState<{
    product_name: string;
    change_percent: number;
    forecast: { quantity: number; created_at: string | null; source: string };
    inventory: { current_stock: number; reorder_point: number };
    recommendation: { suggested_reorder_quantity: number; urgency: string; message: string };
  } | null>(null);

  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await inventoryAPI.getProducts({ page_size: 1000 });
        const productList = (response.data?.data || []).map((product: { id: number; product_name: string }) => ({
          id: product.id,
          product_name: product.product_name,
        }));
        setProducts(productList);
        setSelectedProductId(productList[0]?.id ?? null);
      } catch (fetchError) {
        console.error('Failed to fetch products:', fetchError);
        setError('Unable to load products.');
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      setLoading(false);
      return;
    }

    const fetchDemandData = async () => {
      setLoading(true);
      setError('');

      try {
        const [historyResponse, summaryResponse] = await Promise.all([
          demandAPI.getDemandHistory(selectedProductId, selectedPeriod),
          demandAPI.getDemandSummary(selectedProductId, selectedPeriod),
        ]);

        const summaryData = summaryResponse.data;
        const historyData = historyResponse.data.series.map(
          (point: { label: string; quantity: number }) => ({
            label: point.label,
            quantity: point.quantity,
            forecast: null,
          }),
        );

        historyData.push({
          label: 'Forecast',
          quantity: 0,
          forecast: summaryData.forecast.quantity,
        });

        setHistorySeries(historyData);
        setSummary(summaryData);
      } catch (fetchError) {
        console.error('Failed to fetch demand data:', fetchError);
        setError('Unable to load demand planning data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDemandData();
  }, [selectedPeriod, selectedProductId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-8">
        <div className="mb-12">
          <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            Demand
          </h1>
          <p className="text-xl text-[#86868b]">
            Add products and order history to start forecasting.
          </p>
        </div>
      </div>
    );
  }

  const forecastData = {
    current: summary?.inventory.current_stock ?? 0,
    predicted: Math.round(summary?.forecast.quantity ?? 0),
    change: summary?.change_percent ?? 0,
    reorderQuantity: summary?.recommendation.suggested_reorder_quantity ?? 0,
  };

  const chartData = historySeries.length > 0 ? historySeries : [{ label: 'Forecast', quantity: 0, forecast: 0 }];
  const lastUpdated = summary?.forecast.created_at
    ? new Date(summary.forecast.created_at).toLocaleString()
    : 'Not generated yet';
  const changePrefix = forecastData.change > 0 ? '+' : '';

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
          Demand
        </h1>
        <p className="text-xl text-[#86868b]">
          Real order history with forecasted demand
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div className="flex gap-2">
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

        <select
          value={selectedProductId ?? ''}
          onChange={(event) => setSelectedProductId(Number(event.target.value))}
          className="bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.product_name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl bg-[#fff4f4] px-5 py-4 text-sm text-[#b42318]">
          {error}
        </div>
      )}

      {/* Main Forecast Card */}
      <div className="bg-white rounded-3xl p-10 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Numbers */}
          <div>
            <p className="text-sm text-[#86868b] mb-2">Predicted demand</p>
            <p className="text-lg text-[#1d1d1f] mb-6">{summary?.product_name}</p>
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-7xl font-semibold text-[#1d1d1f] tracking-tight">
                {forecastData.predicted.toLocaleString()}
              </span>
              <span className={`text-2xl font-medium ${forecastData.change >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
                {changePrefix}{forecastData.change}%
              </span>
            </div>

            <p className="text-[#86868b]">
              vs. current stock: {forecastData.current.toLocaleString()} units
            </p>
            <p className="text-[#86868b] mt-3">
              {summary?.recommendation.message}
            </p>
          </div>

          {/* Right - Chart */}
          <div className="flex items-center justify-center">
            <div className="w-full h-64 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: '#86868b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#86868b', fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="#86868b"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#1d1d1f"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Suggested Reorder"
          value={`${forecastData.reorderQuantity}`}
          description={summary?.recommendation.urgency === 'high' ? 'Action recommended soon' : 'Current urgency is manageable'}
        />
        <StatCard
          label="Reorder Point"
          value={`${summary?.inventory.reorder_point ?? 0}`}
          description="Combined across tracked warehouses"
        />
        <StatCard
          label="Last Updated"
          value={summary?.forecast.source === 'baseline' ? 'Baseline' : 'Forecast'}
          description={lastUpdated}
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
