import { useEffect, useState } from 'react';
import { Search, Plus, X, Package, CheckCircle, AlertTriangle, XCircle, ArrowRight, Trash2, Brain } from 'lucide-react';
import { inventoryAPI, mlAPI } from '../services/apiService';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';

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
}

type StatusInfo = { text: string; color: string; bg: string; icon: React.ReactNode };

const getStatus = (product: InventoryRow): StatusInfo => {
  if (product.current_stock <= product.reorder_point * 0.5) {
    return {
      text: 'Critical',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/30',
      icon: <XCircle className="w-3.5 h-3.5" />,
    };
  }
  if (product.current_stock <= product.reorder_point) {
    return {
      text: 'Low',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    };
  }
  if (product.max_stock > 0 && product.current_stock >= product.max_stock * 0.9) {
    return {
      text: 'Overstock',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    };
  }
  return {
    text: 'Healthy',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  };
};

const InventoryPage = () => {
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mlRisk, setMlRisk] = useState<{ risk_label: string; probabilities: number[] } | null>(null);
  const [mlRiskLoading, setMlRiskLoading] = useState(false);

  const pagination = usePagination<InventoryRow>({ initialPageSize: 12 });
  const { currentPage, goToPage, setTotalItems, paginateData, totalPages } = pagination;

  const fetchInventory = async () => {
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
        const currentItems = itemsByProduct.get(item.product_id) || [];
        currentItems.push(item);
        itemsByProduct.set(item.product_id, currentItems);
      }

      const inventoryRows = productRecords.map((product) => {
        const warehouses = itemsByProduct.get(product.id) || [];
        const current_stock = warehouses.reduce((sum, item) => sum + item.current_stock, 0);
        const reorder_point = warehouses.reduce((sum, item) => sum + item.reorder_point, 0);
        const max_stock = warehouses.reduce((sum, item) => sum + item.max_stock, 0);

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
        };
      });

      setProducts(inventoryRows);
      setFilteredProducts(inventoryRows);
      setSelectedProduct((current) => {
        if (!current) return null;
        return inventoryRows.find((row) => row.id === current.id) || null;
      });
    } catch (fetchError) {
      console.error('Failed to fetch inventory:', fetchError);
      setError('Unable to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    let filtered: InventoryRow[];
    if (searchTerm) {
      filtered = products.filter(
        (product) =>
          product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    } else {
      filtered = products;
    }
    setFilteredProducts(filtered);
    setTotalItems(filtered.length);
    goToPage(1);
  }, [searchTerm, products, setTotalItems, goToPage]);

  const handleSaveWarehouse = async (itemId: number, values: Pick<InventoryItemRecord, 'current_stock' | 'reorder_point' | 'max_stock'>) => {
    setDetailLoading(true);
    setError('');
    try {
      await inventoryAPI.updateInventoryItem(itemId, values);
      await fetchInventory();
    } catch (saveError) {
      console.error('Failed to update inventory item:', saveError);
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

  // Fetch ML risk when a product is selected
  useEffect(() => {
    if (!selectedProduct) {
      setMlRisk(null);
      return;
    }
    setMlRiskLoading(true);
    mlAPI.getInventoryRisk(selectedProduct.id)
      .then((res) => setMlRisk(res.data))
      .catch(() => setMlRisk(null))
      .finally(() => setMlRiskLoading(false));
  }, [selectedProduct?.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const healthyCount = products.filter((p) => getStatus(p).text === 'Healthy').length;
  const lowCount = products.filter((p) => getStatus(p).text === 'Low' || getStatus(p).text === 'Overstock').length;
  const criticalCount = products.filter((p) => getStatus(p).text === 'Critical').length;

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
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-gray-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add product
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Package className="w-5 h-5" />}
          label="Total Products"
          value={`${products.length}`}
          color="text-[#0071e3] dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <KPICard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Healthy"
          value={`${healthyCount}`}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Low Stock"
          value={`${lowCount}`}
          color={lowCount > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}
          bg={lowCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}
        />
        <KPICard
          icon={<XCircle className="w-5 h-5" />}
          label="Critical"
          value={`${criticalCount}`}
          color={criticalCount > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}
          bg={criticalCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] dark:text-[#98989d]" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
        />
      </div>

      {/* Product Grid + Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginateData(filteredProducts).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProduct?.id === product.id}
              onClick={() => setSelectedProduct(product)}
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>

        <InventoryDetailPanel
          product={selectedProduct}
          loading={detailLoading}
          onClose={() => setSelectedProduct(null)}
          onSaveWarehouse={handleSaveWarehouse}
          mlRisk={mlRisk}
          mlRiskLoading={mlRiskLoading}
        />
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-gray-100 dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-[#86868b] dark:text-[#98989d]" />
          </div>
          <p className="text-lg text-[#86868b] dark:text-[#98989d]">No products found.</p>
        </div>
      )}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        className="mt-6"
      />

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
};

/* ─── KPI Card ─── */

const KPICard = ({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string; color: string; bg: string;
}) => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-5 flex items-start gap-4">
    <div className={`${bg} ${color} p-2.5 rounded-lg`}>{icon}</div>
    <div>
      <p className="text-sm text-[#86868b] dark:text-[#98989d]">{label}</p>
      <p className={`text-2xl font-semibold ${color} tracking-tight`}>{value}</p>
    </div>
  </div>
);

/* ─── Product Card ─── */

interface ProductCardProps {
  product: InventoryRow;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: number, name: string) => void;
}

const ProductCard = ({ product, isSelected, onClick, onDelete }: ProductCardProps) => {
  const status = getStatus(product);
  const stockPercent = product.max_stock > 0 ? Math.min((product.current_stock / product.max_stock) * 100, 100) : 0;
  const reorderPercent = product.max_stock > 0 ? Math.min((product.reorder_point / product.max_stock) * 100, 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 w-full transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30 group ${
        isSelected ? 'ring-2 ring-[#1d1d1f]/10 dark:ring-white/10 shadow-lg dark:shadow-black/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
          {status.icon}
          {status.text}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(product.id, product.product_name); }}
            className="p-1.5 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ArrowRight className="w-4 h-4 text-[#86868b] dark:text-[#98989d] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <h3 className="text-lg font-medium text-[#1d1d1f] dark:text-white mb-1 truncate">
        {product.product_name}
      </h3>
      <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-4">{product.category}</p>

      {/* Stock Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#86868b] dark:text-[#98989d]">Stock level</span>
          <span className="font-medium text-[#1d1d1f] dark:text-white">
            {product.current_stock} / {product.max_stock}
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-[#38383a] rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all ${
              status.text === 'Critical' ? 'bg-red-500' :
              status.text === 'Low' || status.text === 'Overstock' ? 'bg-amber-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${stockPercent}%` }}
          />
          {reorderPercent > 0 && (
            <div
              className="absolute top-0 h-full w-px bg-[#86868b] dark:bg-[#98989d] opacity-50"
              style={{ left: `${reorderPercent}%` }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-[#86868b] dark:text-[#98989d]">
          {product.warehouse_count} warehouse{product.warehouse_count !== 1 ? 's' : ''}
        </span>
        <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
          ${product.selling_price.toFixed(2)}
        </span>
      </div>
    </button>
  );
};

/* ─── Detail Panel ─── */

interface InventoryDetailPanelProps {
  product: InventoryRow | null;
  loading: boolean;
  onClose: () => void;
  onSaveWarehouse: (
    itemId: number,
    values: Pick<InventoryItemRecord, 'current_stock' | 'reorder_point' | 'max_stock'>,
  ) => Promise<void>;
  mlRisk: { risk_label: string; probabilities: number[] } | null;
  mlRiskLoading: boolean;
}

const InventoryDetailPanel = ({ product, loading, onClose, onSaveWarehouse, mlRisk, mlRiskLoading }: InventoryDetailPanelProps) => {
  if (loading && !product) {
    return (
      <aside className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 xl:sticky xl:top-8">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </aside>
    );
  }

  if (!product) {
    return (
      <aside className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 xl:sticky xl:top-8">
        <p className="text-lg text-[#86868b] dark:text-[#98989d]">
          Select a product to review warehouse-level stock.
        </p>
      </aside>
    );
  }

  const status = getStatus(product);

  return (
    <aside className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 xl:sticky xl:top-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-2">Inventory detail</p>
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
            {product.product_name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.icon}
              {status.text}
            </span>
            <span className="text-sm text-[#86868b] dark:text-[#98989d]">{product.category}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <DetailMetric label="Current stock" value={`${product.current_stock}`} />
        <DetailMetric label="Reorder point" value={`${product.reorder_point}`} />
        <DetailMetric label="Max stock" value={`${product.max_stock}`} />
        <DetailMetric label="Warehouses" value={`${product.warehouse_count}`} />
      </div>

      {/* ML Risk Assessment */}
      <div className="mb-6 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4">
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
              <div className="mt-2 flex gap-1">
                {mlRisk.probabilities.map((p, i) => (
                  <div key={i} className="flex-1">
                    <div className="h-1.5 bg-gray-200 dark:bg-[#38383a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${p * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#86868b] dark:text-[#98989d] mt-0.5">{(p * 100).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#86868b] dark:text-[#98989d]">Run ML Analysis to see risk assessment.</p>
        )}
      </div>

      <div className="space-y-3">
        {product.warehouses.map((warehouse) => (
          <WarehouseEditor
            key={warehouse.id}
            item={warehouse}
            loading={loading}
            onSave={onSaveWarehouse}
          />
        ))}
      </div>
    </aside>
  );
};

/* ─── Warehouse Editor ─── */

interface WarehouseEditorProps {
  item: InventoryItemRecord;
  loading: boolean;
  onSave: (
    itemId: number,
    values: Pick<InventoryItemRecord, 'current_stock' | 'reorder_point' | 'max_stock'>,
  ) => Promise<void>;
}

const WarehouseEditor = ({ item, loading, onSave }: WarehouseEditorProps) => {
  const [currentStock, setCurrentStock] = useState(String(item.current_stock));
  const [reorderPoint, setReorderPoint] = useState(String(item.reorder_point));
  const [maxStock, setMaxStock] = useState(String(item.max_stock));

  useEffect(() => {
    setCurrentStock(String(item.current_stock));
    setReorderPoint(String(item.reorder_point));
    setMaxStock(String(item.max_stock));
  }, [item]);

  const submit = async () => {
    await onSave(item.id, {
      current_stock: Number(currentStock),
      reorder_point: Number(reorderPoint),
      max_stock: Number(maxStock),
    });
  };

  return (
    <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{item.warehouse}</p>
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:bg-black dark:hover:bg-gray-200 transition-all disabled:opacity-60"
        >
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

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const NumberField = ({ label, value, onChange }: NumberFieldProps) => (
  <label className="block">
    <span className="block text-xs text-[#86868b] dark:text-[#98989d] mb-1">{label}</span>
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] text-sm text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3]"
    />
  </label>
);

interface DetailMetricProps {
  label: string;
  value: string;
}

const DetailMetric = ({ label, value }: DetailMetricProps) => (
  <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-4 py-3">
    <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-1">{label}</p>
    <p className="text-xl font-semibold text-[#1d1d1f] dark:text-white">{value}</p>
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
      await inventoryAPI.createProduct({
        product_name: productName.trim(),
        category: category.trim() || null,
        unit_cost: Number(unitCost) || 0,
        selling_price: Number(sellingPrice) || 0,
      });
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
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Widget Pro"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Category (optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics"
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Unit Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Selling Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
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
              'Create Product'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryPage;
