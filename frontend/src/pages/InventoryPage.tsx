import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, Plus, X, Package, CheckCircle, AlertTriangle, XCircle,
  Trash2, Brain, Edit3, MapPin, ArrowUpDown, Download, RefreshCw,
  DollarSign, ChevronDown, Loader2,
} from 'lucide-react';
import { inventoryAPI, mlAPI } from '../services/apiService';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';

/* ─── Types ─── */

interface ProductRecord {
  id: number;
  product_name: string;
  category: string | null;
  unit_cost: number;
  selling_price: number;
}

interface InventoryItemRecord {
  id: number;
  product_id: number;
  warehouse: string;
  current_stock: number;
  reorder_point: number;
  max_stock: number;
  last_updated?: string;
}

interface InventoryRow {
  id: number;
  product_name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  max_stock: number;
  unit_cost: number;
  selling_price: number;
  warehouse_count: number;
  warehouses: InventoryItemRecord[];
  inventory_value: number;
  last_updated: string | null;
}

type SortField = 'name' | 'stock' | 'status' | 'value' | 'price' | 'updated';
type SortDir = 'asc' | 'desc';
type StatusLabel = 'Healthy' | 'Low' | 'Critical' | 'Overstock';

type StatusInfo = { text: StatusLabel; color: string; bg: string; icon: React.ReactNode };

/* ─── Helpers ─── */

const getStatus = (product: InventoryRow): StatusInfo => {
  if (product.current_stock <= product.reorder_point * 0.5) {
    return { text: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: <XCircle className="w-3.5 h-3.5" /> };
  }
  if (product.current_stock <= product.reorder_point) {
    return { text: 'Low', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  }
  if (product.max_stock > 0 && product.current_stock >= product.max_stock * 0.9) {
    return { text: 'Overstock', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  }
  return { text: 'Healthy', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle className="w-3.5 h-3.5" /> };
};

const statusOrder: Record<StatusLabel, number> = { Critical: 0, Low: 1, Overstock: 2, Healthy: 3 };

const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return '—';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  if (diffMs < 60_000) return 'Just now';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const statusBadgeClass = (status: StatusLabel): string => {
  switch (status) {
    case 'Critical': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    case 'Low': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
    case 'Overstock': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    default: return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';
  }
};

const stockBarColor = (status: StatusLabel): string => {
  switch (status) {
    case 'Critical': return 'bg-red-500';
    case 'Low': case 'Overstock': return 'bg-amber-500';
    default: return 'bg-emerald-500';
  }
};

/* ─── Main Page ─── */

const InventoryPage = () => {
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<InventoryRow | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [mlRisk, setMlRisk] = useState<{ risk_label: string; probabilities: number[] } | null>(null);
  const [mlRiskLoading, setMlRiskLoading] = useState(false);

  const pagination = usePagination<InventoryRow>({ initialPageSize: 20 });
  const { currentPage, goToPage, setTotalItems, paginateData, totalPages } = pagination;

  /* ─── Data Fetching ─── */

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsResponse, itemsResponse] = await Promise.all([
        inventoryAPI.getProducts({ page_size: 500 }),
        inventoryAPI.getInventoryItems({ page_size: 1000 }),
      ]);

      const productRecords: ProductRecord[] = productsResponse.data?.data || [];
      const inventoryItems: InventoryItemRecord[] = itemsResponse.data?.data || [];

      const itemsByProduct = new Map<number, InventoryItemRecord[]>();
      for (const item of inventoryItems) {
        const current = itemsByProduct.get(item.product_id) || [];
        current.push(item);
        itemsByProduct.set(item.product_id, current);
      }

      const rows: InventoryRow[] = productRecords.map((product) => {
        const warehouses = itemsByProduct.get(product.id) || [];
        const current_stock = warehouses.reduce((sum, w) => sum + w.current_stock, 0);
        const reorder_point = warehouses.reduce((sum, w) => sum + w.reorder_point, 0);
        const max_stock = warehouses.reduce((sum, w) => sum + w.max_stock, 0);
        const lastUpdated = warehouses.reduce<string | null>((latest, w) => {
          if (!w.last_updated) return latest;
          if (!latest) return w.last_updated;
          return new Date(w.last_updated) > new Date(latest) ? w.last_updated : latest;
        }, null);

        return {
          id: product.id,
          product_name: product.product_name,
          category: product.category || 'Uncategorized',
          current_stock,
          reorder_point,
          max_stock,
          unit_cost: product.unit_cost,
          selling_price: product.selling_price,
          warehouse_count: warehouses.length,
          warehouses,
          inventory_value: current_stock * product.unit_cost,
          last_updated: lastUpdated,
        };
      });

      setProducts(rows);
      setSelectedProduct((current) => current ? rows.find((r) => r.id === current.id) || null : null);
    } catch (fetchError) {
      console.error('Failed to fetch inventory:', fetchError);
      setError('Unable to load inventory data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  /* ─── ML Risk ─── */

  useEffect(() => {
    if (!selectedProduct) { setMlRisk(null); return; }
    setMlRiskLoading(true);
    mlAPI.getInventoryRisk(selectedProduct.id)
      .then((res) => setMlRisk(res.data))
      .catch(() => setMlRisk(null))
      .finally(() => setMlRiskLoading(false));
  }, [selectedProduct?.id]);

  /* ─── Derived Data ─── */

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let result = products;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.product_name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => getStatus(p).text === statusFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.product_name.localeCompare(b.product_name); break;
        case 'stock': cmp = a.current_stock - b.current_stock; break;
        case 'status': cmp = statusOrder[getStatus(a).text] - statusOrder[getStatus(b).text]; break;
        case 'value': cmp = a.inventory_value - b.inventory_value; break;
        case 'price': cmp = a.unit_cost - b.unit_cost; break;
        case 'updated': {
          const ta = a.last_updated ? new Date(a.last_updated).getTime() : 0;
          const tb = b.last_updated ? new Date(b.last_updated).getTime() : 0;
          cmp = ta - tb;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [products, searchTerm, statusFilter, categoryFilter, sortField, sortDir]);

  useEffect(() => {
    setTotalItems(filteredAndSorted.length);
    goToPage(1);
    setSelectedIds(new Set());
  }, [filteredAndSorted.length, setTotalItems, goToPage]);

  const healthyCount = useMemo(() => products.filter((p) => getStatus(p).text === 'Healthy').length, [products]);
  const lowCount = useMemo(() => products.filter((p) => getStatus(p).text === 'Low').length, [products]);
  const criticalCount = useMemo(() => products.filter((p) => getStatus(p).text === 'Critical').length, [products]);
  const overstockCount = useMemo(() => products.filter((p) => getStatus(p).text === 'Overstock').length, [products]);
  const totalValue = useMemo(() => products.reduce((sum, p) => sum + p.inventory_value, 0), [products]);

  /* ─── Actions ─── */

  const handleSaveWarehouse = async (itemId: number, values: Pick<InventoryItemRecord, 'current_stock' | 'reorder_point' | 'max_stock'>) => {
    setDetailLoading(true);
    setError('');
    try {
      await inventoryAPI.updateInventoryItem(itemId, values);
      await fetchInventory();
    } catch {
      setError('Unable to update the selected inventory record.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Delete "${productName}"? This will also remove all associated inventory items.`)) return;
    try {
      await inventoryAPI.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      if (selectedProduct?.id === productId) setSelectedProduct(null);
    } catch {
      setError('Failed to delete product.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} product(s)? This will also remove all associated inventory items.`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => inventoryAPI.deleteProduct(id)));
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      if (selectedProduct && selectedIds.has(selectedProduct.id)) setSelectedProduct(null);
    } catch {
      setError('Failed to delete one or more products.');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageData = paginateData(filteredAndSorted);
    const allSelected = pageData.every((p) => selectedIds.has(p.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageData.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageData.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Product Name', 'Category', 'Current Stock', 'Reorder Point', 'Max Stock', 'Status', 'Unit Cost', 'Selling Price', 'Inventory Value', 'Warehouses'];
    const rows = filteredAndSorted.map((p) => [
      p.product_name, p.category, p.current_stock, p.reorder_point, p.max_stock,
      getStatus(p).text, p.unit_cost.toFixed(2), p.selling_price.toFixed(2),
      p.inventory_value.toFixed(2), p.warehouse_count,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 ml-1 transition-colors ${sortField === field ? 'text-[#0071e3]' : 'text-[#aeaeb2]'}`} />
  );

  /* ─── Loading State ─── */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const pageData = paginateData(filteredAndSorted);
  const allPageSelected = pageData.length > 0 && pageData.every((p) => selectedIds.has(p.id));

  /* ─── Render ─── */

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Inventory</h1>
          <p className="text-lg text-[#86868b] dark:text-[#98989d] mt-1">
            {products.length} products across{' '}
            {new Set(products.flatMap((p) => p.warehouses.map((w) => w.warehouse))).size} warehouses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchInventory} className="p-2.5 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-gray-200 transition-all">
            <Plus className="w-4 h-4" />
            Add product
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={<Package className="w-5 h-5" />} label="Total Products" value={`${products.length}`} subtitle={`${new Set(products.flatMap((p) => p.warehouses.map((w) => w.warehouse))).size} warehouses`} color="text-[#0071e3] dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <KPICard icon={<DollarSign className="w-5 h-5" />} label="Inventory Value" value={formatCurrency(totalValue)} subtitle="total stock value" color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-900/20" />
        <KPICard icon={<AlertTriangle className="w-5 h-5" />} label="Low Stock" value={`${lowCount}`} subtitle="need reorder" color={lowCount > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'} bg={lowCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'} />
        <KPICard icon={<XCircle className="w-5 h-5" />} label="Critical" value={`${criticalCount}`} subtitle="immediate action" color={criticalCount > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'} bg={criticalCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'} />
        <KPICard icon={<AlertTriangle className="w-5 h-5" />} label="Overstock" value={`${overstockCount}`} subtitle="excess inventory" color={overstockCount > 0 ? 'text-blue-500' : 'text-emerald-600 dark:text-emerald-400'} bg={overstockCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] dark:text-[#98989d]" />
        <input type="text" placeholder="Search products by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all" />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl text-sm text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 cursor-pointer transition-all">
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl text-sm text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 cursor-pointer transition-all">
            <option value="all">All Status</option>
            <option value="Healthy">Healthy</option>
            <option value="Low">Low Stock</option>
            <option value="Critical">Critical</option>
            <option value="Overstock">Overstock</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select value={`${sortField}-${sortDir}`} onChange={(e) => { const [f, d] = e.target.value.split('-'); setSortField(f as SortField); setSortDir(d as SortDir); }}
            className="appearance-none pl-3.5 pr-8 py-2.5 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl text-sm text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 cursor-pointer transition-all">
            <option value="name-asc">Name A→Z</option>
            <option value="name-desc">Name Z→A</option>
            <option value="stock-asc">Stock Low→High</option>
            <option value="stock-desc">Stock High→Low</option>
            <option value="value-asc">Value Low→High</option>
            <option value="value-desc">Value High→Low</option>
            <option value="status-asc">Status (Critical first)</option>
            <option value="updated-desc">Recently Updated</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] pointer-events-none" />
        </div>

        <div className="flex-1" />

        {/* Actions */}
        {selectedIds.size > 0 && (
          <button onClick={handleBulkDelete}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">
            <Trash2 className="w-4 h-4" />
            Delete ({selectedIds.size})
          </button>
        )}
        <button onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#2c2c2e]">
                <th className="w-12 px-4 py-4">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-[#48484a] text-[#0071e3] focus:ring-[#0071e3] cursor-pointer" />
                </th>
                <th className="text-left px-6 py-4">
                  <button onClick={() => toggleSort('name')} className="flex items-center text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                    Product <SortIndicator field="name" />
                  </button>
                </th>
                <th className="text-left px-6 py-4">
                  <button onClick={() => toggleSort('stock')} className="flex items-center text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                    Stock <SortIndicator field="stock" />
                  </button>
                </th>
                <th className="text-left px-6 py-4">
                  <button onClick={() => toggleSort('status')} className="flex items-center text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                    Status <SortIndicator field="status" />
                  </button>
                </th>
                <th className="text-right px-6 py-4">
                  <button onClick={() => toggleSort('price')} className="flex items-center text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider hover:text-[#1d1d1f] dark:hover:text-white transition-colors ml-auto">
                    Unit Cost <SortIndicator field="price" />
                  </button>
                </th>
                <th className="text-right px-6 py-4">
                  <button onClick={() => toggleSort('value')} className="flex items-center text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider hover:text-[#1d1d1f] dark:hover:text-white transition-colors ml-auto">
                    Value <SortIndicator field="value" />
                  </button>
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">WH</th>
                <th className="text-left px-6 py-4">
                  <button onClick={() => toggleSort('updated')} className="flex items-center text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
                    Updated <SortIndicator field="updated" />
                  </button>
                </th>
                <th className="w-24 px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((product) => {
                const status = getStatus(product);
                const stockPct = product.max_stock > 0 ? Math.min((product.current_stock / product.max_stock) * 100, 100) : 0;
                const isSelected = selectedProduct?.id === product.id;
                const isChecked = selectedIds.has(product.id);

                return (
                  <tr key={product.id}
                    onClick={() => setSelectedProduct(isSelected ? null : product)}
                    className={`border-b border-gray-50 dark:border-[#2c2c2e] last:border-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-[#fafafa] dark:hover:bg-[#2c2c2e]/50'
                    }`}>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-[#48484a] text-[#0071e3] focus:ring-[#0071e3] cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{product.product_name}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#2c2c2e] text-[#86868b]">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      {product.warehouse_count > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="w-20">
                            <div className="h-1.5 bg-gray-100 dark:bg-[#38383a] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${stockBarColor(status.text)}`} style={{ width: `${stockPct}%` }} />
                            </div>
                          </div>
                          <span className="text-sm text-[#1d1d1f] dark:text-white whitespace-nowrap">{product.current_stock} / {product.max_stock}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#aeaeb2]">No stock records</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.icon}
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#1d1d1f] dark:text-white">${product.unit_cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#1d1d1f] dark:text-white">{formatCurrency(product.inventory_value)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-[#86868b] dark:text-[#98989d]">
                        <MapPin className="w-3.5 h-3.5" />
                        {product.warehouse_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#86868b] dark:text-[#98989d]">{formatRelativeTime(product.last_updated)}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowEditModal(product)}
                          className="p-2 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id, product.product_name)}
                          className="p-2 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-[#86868b] dark:text-[#98989d]" />
            </div>
            <p className="text-lg text-[#86868b] dark:text-[#98989d]">No products match your filters.</p>
            <p className="text-sm text-[#aeaeb2] mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAndSorted.length > 0 && (
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} className="mt-6" />
      )}

      {/* Detail Drawer */}
      {selectedProduct && (
        <DetailDrawer
          product={selectedProduct}
          loading={detailLoading}
          onClose={() => setSelectedProduct(null)}
          onSaveWarehouse={handleSaveWarehouse}
          onAddWarehouse={() => setShowAddItemModal(true)}
          mlRisk={mlRisk}
          mlRiskLoading={mlRiskLoading}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProductModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchInventory(); }} />
      )}
      {showEditModal && (
        <EditProductModal product={showEditModal} onClose={() => setShowEditModal(null)} onSaved={() => { setShowEditModal(null); fetchInventory(); }} />
      )}
      {showAddItemModal && selectedProduct && (
        <AddInventoryItemModal productId={selectedProduct.id} productName={selectedProduct.product_name} onClose={() => setShowAddItemModal(false)} onCreated={() => { setShowAddItemModal(false); fetchInventory(); }} />
      )}
    </div>
  );
};

/* ─── KPI Card ─── */

const KPICard = ({ icon, label, value, subtitle, color, bg }: {
  icon: React.ReactNode; label: string; value: string; subtitle?: string; color: string; bg: string;
}) => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-5 flex items-start gap-4">
    <div className={`${bg} ${color} p-2.5 rounded-lg`}>{icon}</div>
    <div>
      <p className="text-sm text-[#86868b] dark:text-[#98989d]">{label}</p>
      <p className={`text-2xl font-semibold ${color} tracking-tight`}>{value}</p>
      {subtitle && <p className="text-xs text-[#aeaeb2] mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

/* ─── Detail Drawer ─── */

interface DetailDrawerProps {
  product: InventoryRow;
  loading: boolean;
  onClose: () => void;
  onSaveWarehouse: (itemId: number, values: Pick<InventoryItemRecord, 'current_stock' | 'reorder_point' | 'max_stock'>) => Promise<void>;
  onAddWarehouse: () => void;
  mlRisk: { risk_label: string; probabilities: number[] } | null;
  mlRiskLoading: boolean;
}

const DetailDrawer = ({ product, loading, onClose, onSaveWarehouse, onAddWarehouse, mlRisk, mlRiskLoading }: DetailDrawerProps) => {
  const status = getStatus(product);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white dark:bg-[#1c1c1e] z-50 shadow-2xl overflow-y-auto transform translate-x-0 transition-transform duration-300 ease-out">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-1">Inventory Detail</p>
              <h2 className="text-xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{product.product_name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.icon}{status.text}
                </span>
                <span className="text-sm text-[#86868b] dark:text-[#98989d]">{product.category}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <DetailMetric label="Current Stock" value={`${product.current_stock}`} />
            <DetailMetric label="Reorder Point" value={`${product.reorder_point}`} />
            <DetailMetric label="Max Stock" value={`${product.max_stock}`} />
            <DetailMetric label="Inventory Value" value={formatCurrency(product.inventory_value)} />
          </div>

          {/* Pricing */}
          <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">Unit Cost</p>
              <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">${product.unit_cost.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">Selling Price</p>
              <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">${product.selling_price.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">Margin</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {product.unit_cost > 0 ? `${(((product.selling_price - product.unit_cost) / product.unit_cost) * 100).toFixed(0)}%` : '—'}
              </p>
            </div>
          </div>

          {/* ML Risk */}
          <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-[#0071e3] dark:text-blue-400" />
              <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">ML Risk Assessment</p>
            </div>
            {mlRiskLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                <span className="text-xs text-[#86868b] dark:text-[#98989d]">Analyzing...</span>
              </div>
            ) : mlRisk ? (
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                  mlRisk.risk_label === 'Stockout Risk' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                  mlRisk.risk_label === 'Overstock Risk' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {mlRisk.risk_label}
                </span>
                {mlRisk.probabilities && mlRisk.probabilities.length > 0 && (
                  <div className="mt-3 flex gap-1.5">
                    {mlRisk.probabilities.map((p, i) => (
                      <div key={i} className="flex-1">
                        <div className="h-1.5 bg-gray-200 dark:bg-[#38383a] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${p * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-[#86868b] dark:text-[#98989d] mt-0.5">{(p * 100).toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#86868b] dark:text-[#98989d]">Select a product to view risk assessment.</p>
            )}
          </div>

          {/* Warehouses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">Warehouses ({product.warehouse_count})</p>
              <button onClick={onAddWarehouse}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-all">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {product.warehouses.map((wh) => (
                <WarehouseEditor key={wh.id} item={wh} loading={loading} onSave={onSaveWarehouse} />
              ))}
              {product.warehouses.length === 0 && (
                <p className="text-sm text-[#86868b] dark:text-[#98989d] py-4 text-center">No warehouse records.</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

/* ─── Warehouse Editor ─── */

const WarehouseEditor = ({ item, loading, onSave }: {
  item: InventoryItemRecord; loading: boolean;
  onSave: (itemId: number, values: Pick<InventoryItemRecord, 'current_stock' | 'reorder_point' | 'max_stock'>) => Promise<void>;
}) => {
  const [currentStock, setCurrentStock] = useState(String(item.current_stock));
  const [reorderPoint, setReorderPoint] = useState(String(item.reorder_point));
  const [maxStock, setMaxStock] = useState(String(item.max_stock));

  useEffect(() => {
    setCurrentStock(String(item.current_stock));
    setReorderPoint(String(item.reorder_point));
    setMaxStock(String(item.max_stock));
  }, [item]);

  const submit = async () => {
    await onSave(item.id, { current_stock: Number(currentStock), reorder_point: Number(reorderPoint), max_stock: Number(maxStock) });
  };

  return (
    <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#86868b]" />
          <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{item.warehouse}</p>
        </div>
        <button type="button" disabled={loading} onClick={submit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-60">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Stock" value={currentStock} onChange={setCurrentStock} />
        <NumberField label="Reorder" value={reorderPoint} onChange={setReorderPoint} />
        <NumberField label="Max" value={maxStock} onChange={setMaxStock} />
      </div>
    </div>
  );
};

/* ─── Reusable Bits ─── */

const NumberField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="block">
    <span className="block text-xs text-[#86868b] dark:text-[#98989d] mb-1">{label}</span>
    <input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] text-sm text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3]" />
  </label>
);

const DetailMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-3">
    <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-1">{label}</p>
    <p className="text-lg font-semibold text-[#1d1d1f] dark:text-white">{value}</p>
  </div>
);

/* ─── Create Product Modal ─── */

const CreateProductModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) { setError('Product name is required.'); return; }
    if (Number(unitCost) < 0 || Number(sellingPrice) < 0) { setError('Prices must be non-negative.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await inventoryAPI.createProduct({ product_name: productName.trim(), category: category.trim() || null, unit_cost: Number(unitCost) || 0, selling_price: Number(sellingPrice) || 0 });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">New Product</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Product Name</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Widget Pro"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Category (optional)</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electronics"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Unit Cost</label>
              <input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Selling Price</label>
              <input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Edit Product Modal ─── */

const EditProductModal = ({ product, onClose, onSaved }: { product: InventoryRow; onClose: () => void; onSaved: () => void }) => {
  const [productName, setProductName] = useState(product.product_name);
  const [category, setCategory] = useState(product.category === 'Uncategorized' ? '' : product.category);
  const [unitCost, setUnitCost] = useState(String(product.unit_cost));
  const [sellingPrice, setSellingPrice] = useState(String(product.selling_price));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) { setError('Product name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await inventoryAPI.updateProduct(product.id, {
        product_name: productName.trim(),
        category: category.trim() || null,
        unit_cost: Number(unitCost) || 0,
        selling_price: Number(sellingPrice) || 0,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">Edit Product</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Product Name</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electronics"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Unit Cost</label>
              <input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Selling Price</label>
              <input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Add Inventory Item Modal ─── */

const AddInventoryItemModal = ({ productId, productName, onClose, onCreated }: {
  productId: number; productName: string; onClose: () => void; onCreated: () => void;
}) => {
  const [warehouse, setWarehouse] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [reorderPoint, setReorderPoint] = useState('100');
  const [maxStock, setMaxStock] = useState('500');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse.trim()) { setError('Warehouse name is required.'); return; }
    if (Number(reorderPoint) >= Number(maxStock)) { setError('Reorder point must be less than max stock.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await inventoryAPI.createInventoryItem({
        product_id: productId,
        warehouse: warehouse.trim(),
        current_stock: Number(currentStock),
        reorder_point: Number(reorderPoint),
        max_stock: Number(maxStock),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to add inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">Add Warehouse</h2>
            <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">{productName}</p>
          </div>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Warehouse Name</label>
            <input type="text" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} placeholder="e.g. Warehouse A"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Current Stock</label>
              <input type="number" min="0" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Reorder Point</label>
              <input type="number" min="0" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Max Stock</label>
              <input type="number" min="1" value={maxStock} onChange={(e) => setMaxStock(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Adding...</> : 'Add Warehouse'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryPage;
