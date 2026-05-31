import { useEffect, useState } from 'react';
import { Plus, ArrowRight, X, Sparkles, Trash2, Brain, Truck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supplierAPI, aiAPI, mlAPI } from '../services/apiService';

interface SupplierCardData {
  id: number;
  supplier_name: string;
  reliability_score: number;
  avg_lead_time: number;
  delay_probability: number | null;
  shipment_count: number;
  status: 'active' | 'warning' | 'inactive';
}

interface Shipment {
  id: number;
  supplier_id: number;
  expected_delivery_date: string;
  actual_delivery_date: string | null;
  shipping_cost: number;
}

interface SupplierDetail {
  id: number;
  supplier_name: string;
  reliability_score: number | null;
  avg_lead_time: number | null;
  delay_probability: number | null;
  shipments: Shipment[];
}

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState<SupplierCardData[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [mlDelayRisk, setMlDelayRisk] = useState<{ delay_risk: boolean; delay_probability: number } | null>(null);
  const [mlDelayRiskLoading, setMlDelayRiskLoading] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      await fetchSuppliersData();
      setLoading(false);
    };
    fetch();
  }, [page]);

  useEffect(() => {
    if (!selectedSupplierId) {
      setSelectedSupplier(null);
      return;
    }

    const fetchSupplierDetail = async () => {
      setDetailLoading(true);
      try {
        const response = await supplierAPI.getSupplierDetail(selectedSupplierId);
        setSelectedSupplier(response.data);
      } catch (fetchError) {
        console.error('Failed to fetch supplier detail:', fetchError);
        setError('Unable to load supplier detail.');
      } finally {
        setDetailLoading(false);
      }
    };

    fetchSupplierDetail();
  }, [selectedSupplierId]);

  // Fetch ML delay risk when a supplier is selected
  useEffect(() => {
    if (!selectedSupplierId) {
      setMlDelayRisk(null);
      return;
    }
    setMlDelayRiskLoading(true);
    mlAPI.getSupplierDelayRisk(selectedSupplierId)
      .then((res) => setMlDelayRisk(res.data))
      .catch(() => setMlDelayRisk(null))
      .finally(() => setMlDelayRiskLoading(false));
  }, [selectedSupplierId]);

  const handleDeleteSupplier = async (supplierId: number, supplierName: string) => {
    if (!confirm(`Delete supplier "${supplierName}"? This will also remove all associated shipments.`)) return;
    try {
      await supplierAPI.deleteSupplier(supplierId);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      if (selectedSupplierId === supplierId) setSelectedSupplierId(null);
    } catch {
      setError('Failed to delete supplier.');
    }
  };

  const fetchSuppliersData = async () => {
    try {
      const [suppliersResponse, shipmentsResponse] = await Promise.all([
        supplierAPI.getSuppliers({ page, page_size: pageSize }),
        supplierAPI.getShipments({ page_size: 500 }),
      ]);

      const shipmentCounts = new Map<number, number>();
      for (const shipment of (shipmentsResponse.data?.data || [])) {
        shipmentCounts.set(
          shipment.supplier_id,
          (shipmentCounts.get(shipment.supplier_id) || 0) + 1,
        );
      }

      const allSuppliers = suppliersResponse.data?.data || [];
      const data = allSuppliers.map((item: any) => {
        const reliability = item.reliability_score ?? 0;
        let status: SupplierCardData['status'] = 'active';
        if (reliability < 0.6) {
          status = 'inactive';
        } else if (reliability < 0.8) {
          status = 'warning';
        }

        return {
          id: item.id,
          supplier_name: item.supplier_name,
          reliability_score: Math.round(reliability * 100),
          avg_lead_time: Math.round(item.avg_lead_time ?? 0),
          delay_probability: null,
          shipment_count: shipmentCounts.get(item.id) || 0,
          status,
        };
      });

      setSuppliers(data);
      const totalCount = suppliersResponse.data?.total || 0;
      setTotal(totalCount);

      // Compute total active count: if we have all suppliers on this page, count directly;
      // otherwise use a heuristic based on the ratio on the current page
      if (allSuppliers.length >= totalCount) {
        setTotalActive(data.filter((s: SupplierCardData) => s.status === 'active').length);
      } else {
        // Fetch all suppliers to get accurate active count
        try {
          const allResponse = await supplierAPI.getSuppliers({ page_size: totalCount || 500 });
          const allData = allResponse.data?.data || [];
          const activeCount = allData.filter((item: any) => {
            const reliability = item.reliability_score ?? 0;
            return reliability >= 0.8;
          }).length;
          setTotalActive(activeCount);
        } catch {
          // Fallback: estimate from current page
          setTotalActive(data.filter((s: SupplierCardData) => s.status === 'active').length);
        }
      }
    } catch (fetchError) {
      console.error('Failed to fetch suppliers:', fetchError);
      setError('Unable to load suppliers.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-12">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-1 sm:mb-2">
            Suppliers
          </h1>
          <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d]">
            {totalActive} active of {total} suppliers
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="
            inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3
            bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-full
            text-sm font-medium
            hover:bg-black dark:hover:bg-gray-200 transition-all duration-200
          "
        >
          <Plus className="w-4 h-4" />
          Add supplier
        </button>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl bg-[#fff4f4] dark:bg-red-900/20 px-5 py-4 text-sm text-[#b42318] dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          {suppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              isSelected={selectedSupplierId === supplier.id}
              onClick={() => setSelectedSupplierId(supplier.id)}
              onDelete={handleDeleteSupplier}
            />
          ))}
        </div>

        <SupplierDetailPanel
          supplier={selectedSupplier}
          loading={detailLoading}
          onClose={() => setSelectedSupplierId(null)}
          mlDelayRisk={mlDelayRisk}
          mlDelayRiskLoading={mlDelayRiskLoading}
          onAddShipment={() => setShowShipmentModal(true)}
        />
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] text-[#1d1d1f] dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[#86868b] dark:text-[#98989d]">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] text-[#1d1d1f] dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <CreateSupplierModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchSuppliersData();
          }}
        />
      )}

      {/* Create Shipment Modal */}
      {showShipmentModal && selectedSupplierId && (
        <CreateShipmentModal
          supplierId={selectedSupplierId}
          onClose={() => setShowShipmentModal(false)}
          onCreated={() => {
            setShowShipmentModal(false);
            // Refresh supplier detail
            setSelectedSupplierId(selectedSupplierId);
          }}
        />
      )}
    </div>
  );
};

interface SupplierCardProps {
  supplier: SupplierCardData;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: number, name: string) => void;
}

const SupplierCard = ({ supplier, isSelected, onClick, onDelete }: SupplierCardProps) => {
  const getReliabilityColor = (score: number) => {
    if (score >= 90) return 'text-[#34c759]';
    if (score >= 75) return 'text-[#ff9f0a]';
    return 'text-[#ff3b30]';
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#34c759]';
      case 'warning': return 'bg-[#ff9f0a]';
      default: return 'bg-[#ff3b30]';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        text-left bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 w-full
        transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30 group
        ${isSelected ? 'ring-2 ring-[#1d1d1f]/10 dark:ring-white/10 shadow-lg dark:shadow-black/30' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${getStatusDot(supplier.status)}`} />
          <span className="text-sm text-[#86868b] dark:text-[#98989d]">
            {supplier.shipment_count} shipments
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(supplier.id, supplier.supplier_name); }}
            className="p-1.5 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ArrowRight className="w-5 h-5 text-[#86868b] dark:text-[#98989d] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <h3 className="text-xl font-medium text-[#1d1d1f] dark:text-white mb-6">
        {supplier.supplier_name}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-1">Reliability</p>
          <p className={`text-2xl font-semibold ${getReliabilityColor(supplier.reliability_score)}`}>
            {supplier.reliability_score}%
          </p>
        </div>
        <div>
          <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-1">Lead time</p>
          <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">
            {supplier.avg_lead_time}d
          </p>
        </div>
      </div>
    </button>
  );
};

interface SupplierDetailPanelProps {
  supplier: SupplierDetail | null;
  loading: boolean;
  onClose: () => void;
  mlDelayRisk: { delay_risk: boolean; delay_probability: number } | null;
  mlDelayRiskLoading: boolean;
  onAddShipment: () => void;
}

const SupplierDetailPanel = ({ supplier, loading, onClose, mlDelayRisk, mlDelayRiskLoading, onAddShipment }: SupplierDetailPanelProps) => {
  const [narrative, setNarrative] = useState<{ narrative: string; cached: boolean } | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState('');

  useEffect(() => {
    if (!supplier) {
      setNarrative(null);
      return;
    }
    setNarrativeLoading(true);
    setNarrativeError('');
    aiAPI.getSupplierNarrative(supplier.id)
      .then((res) => setNarrative(res.data.data || res.data)) // Handle nested data if present
      .catch(() => setNarrativeError('Unable to load AI assessment.'))
      .finally(() => setNarrativeLoading(false));
  }, [supplier?.id]);

  if (loading) {
    return (
      <aside className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 xl:sticky xl:top-8">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </aside>
    );
  }

  if (!supplier) {
    return (
      <aside className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 xl:sticky xl:top-8">
        <p className="text-lg text-[#86868b] dark:text-[#98989d]">
          Select a supplier to review shipment history and risk.
        </p>
      </aside>
    );
  }

  return (
    <aside className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 xl:sticky xl:top-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-2">Supplier detail</p>
          <h2 className="text-3xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
            {supplier.supplier_name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <DetailMetric
          label="Reliability"
          value={`${Math.round((supplier.reliability_score ?? 0) * 100)}%`}
        />
        <DetailMetric
          label="Lead time"
          value={`${supplier.avg_lead_time ?? 0}d`}
        />
        <DetailMetric
          label="Shipments"
          value={`${supplier.shipments.length}`}
        />
        <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3.5 h-3.5 text-[#0071e3] dark:text-blue-400" />
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">ML Delay Risk</p>
          </div>
          {mlDelayRiskLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
              <span className="text-xs text-[#86868b] dark:text-[#98989d]">Analyzing...</span>
            </div>
          ) : mlDelayRisk ? (
            <div>
              <p className={`text-2xl font-semibold ${mlDelayRisk.delay_risk ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {Math.round(mlDelayRisk.delay_probability * 100)}%
              </p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                mlDelayRisk.delay_risk
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {mlDelayRisk.delay_risk ? 'High Risk' : 'Low Risk'}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#86868b] dark:text-[#98989d]">Run ML Analysis to see risk.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-[#1d1d1f] dark:text-white">Recent shipments</h3>
          <button
            onClick={onAddShipment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0071e3] text-white rounded-lg text-xs font-medium hover:bg-[#0077ed] transition-all"
          >
            <Truck className="w-3.5 h-3.5" />
            Add Shipment
          </button>
        </div>
        <div className="space-y-3">
          {supplier.shipments.length > 0 ? supplier.shipments.map((shipment) => (
            <div key={shipment.id} className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                  Expected {formatDate(shipment.expected_delivery_date)}
                </p>
                <p className="text-sm text-[#86868b] dark:text-[#98989d]">
                  ${shipment.shipping_cost.toFixed(2)}
                </p>
              </div>
              <p className="text-sm text-[#86868b] dark:text-[#98989d]">
                {shipment.actual_delivery_date
                  ? `Delivered ${formatDate(shipment.actual_delivery_date)}`
                  : 'Awaiting delivery confirmation'}
              </p>
            </div>
          )) : (
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">No shipment history yet.</p>
          )}
        </div>
      </div>

      {/* AI Risk Narrative */}
      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#38383a]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#0071e3] dark:text-blue-400" />
          <h3 className="text-lg font-medium text-[#1d1d1f] dark:text-white">AI Risk Assessment</h3>
          {narrative?.cached && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b] dark:text-[#98989d]">Cached</span>
          )}
        </div>
        {narrativeLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">Generating risk assessment...</p>
          </div>
        ) : narrativeError ? (
          <p className="text-sm text-[#b42318] dark:text-red-400">{narrativeError}</p>
        ) : narrative ? (
          <NarrativeDisplay text={narrative.narrative} />
        ) : null}
      </div>
    </aside>
  );
};

interface DetailMetricProps {
  label: string;
  value: string;
}

const DetailMetric = ({ label, value }: DetailMetricProps) => (
  <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-4">
    <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-1">{label}</p>
    <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">{value}</p>
  </div>
);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const NarrativeDisplay = ({ text }: { text: string }) => (
  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-3 prose-headings:text-[#1d1d1f] dark:prose-headings:text-white prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-[#1d1d1f] dark:prose-strong:text-white prose-code:text-[#0071e3] dark:prose-code:text-blue-400 prose-code:bg-[#e8e8ed] dark:prose-code:bg-[#3a3a3c] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {text}
    </ReactMarkdown>
  </div>
);

/* ─── Create Supplier Modal ─── */

const CreateSupplierModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [supplierName, setSupplierName] = useState('');
  const [reliabilityScore, setReliabilityScore] = useState('80');
  const [avgLeadTime, setAvgLeadTime] = useState('7');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) { setError('Supplier name is required.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await supplierAPI.createSupplier({
        supplier_name: supplierName.trim(),
        reliability_score: Number(reliabilityScore) / 100,
        avg_lead_time: Number(avgLeadTime),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">New Supplier</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Reliability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={reliabilityScore}
                onChange={(e) => setReliabilityScore(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Avg Lead Time (days)</label>
              <input
                type="number"
                min="1"
                value={avgLeadTime}
                onChange={(e) => setAvgLeadTime(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create Supplier'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Create Shipment Modal ─── */

const CreateShipmentModal = ({ supplierId, onClose, onCreated }: { supplierId: number; onClose: () => void; onCreated: () => void }) => {
  const [expectedDate, setExpectedDate] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedDate) { setError('Expected delivery date is required.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await supplierAPI.createShipment({
        supplier_id: supplierId,
        expected_delivery_date: expectedDate,
        shipping_cost: Number(shippingCost) || 0,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">New Shipment</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Expected Delivery Date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Shipping Cost</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create Shipment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupplierPage;
