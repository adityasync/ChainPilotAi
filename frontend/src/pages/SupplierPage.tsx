import { useState, useEffect } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { supplierAPI } from '../services/apiService';

interface Supplier {
  id: number;
  name: string;
  category: string;
  reliability_score: number;
  lead_time_days: number;
  active_orders: number;
  status: 'active' | 'warning' | 'inactive';
}

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await supplierAPI.getSuppliers({ limit: 100 });
        const data = response.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category || 'General',
          reliability_score: Math.round(item.reliability_score * 100) || 0, // Convert 0-1 to 0-100
          lead_time_days: Math.round(item.avg_lead_time) || 0,
          active_orders: 0, // TODO: Fetch from orders API if needed
          status: 'active', // Default status for now
        }));
        setSuppliers(data);
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = suppliers.filter(s => s.status === 'active').length;

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            Suppliers
          </h1>
          <p className="text-xl text-[#86868b]">
            {activeCount} active of {suppliers.length} suppliers
          </p>
        </div>

        <button className="
          inline-flex items-center gap-2 px-6 py-3
          bg-[#1d1d1f] text-white rounded-full
          text-sm font-medium
          hover:bg-black transition-all duration-200
        ">
          <Plus className="w-4 h-4" />
          Add supplier
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    </div>
  );
};

interface SupplierCardProps {
  supplier: Supplier;
}

const SupplierCard = ({ supplier }: SupplierCardProps) => {
  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-[#34c759]';
    if (score >= 75) return 'text-[#ff9f0a]';
    return 'text-[#ff3b30]';
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#34c759]';
      case 'warning': return 'bg-[#ff9f0a]';
      default: return 'bg-[#aeaeb2]';
    }
  };

  return (
    <div className="
      bg-white rounded-2xl p-6
      transition-all duration-300
      hover:shadow-lg cursor-pointer
      group
    ">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${getStatusDot(supplier.status)}`} />
          <span className="text-sm text-[#86868b]">{supplier.category}</span>
        </div>
        <ArrowRight className="w-5 h-5 text-[#86868b] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-medium text-[#1d1d1f] mb-6">
        {supplier.name}
      </h3>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-[#86868b] mb-1">Reliability</p>
          <p className={`text-2xl font-semibold ${getReliabilityColor(supplier.reliability_score)}`}>
            {supplier.reliability_score}%
          </p>
        </div>
        <div>
          <p className="text-sm text-[#86868b] mb-1">Lead time</p>
          <p className="text-2xl font-semibold text-[#1d1d1f]">
            {supplier.lead_time_days}d
          </p>
        </div>
      </div>

      {/* Active orders */}
      {supplier.active_orders > 0 && (
        <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-[#86868b]">
          {supplier.active_orders} active orders
        </p>
      )}
    </div>
  );
};

export default SupplierPage;