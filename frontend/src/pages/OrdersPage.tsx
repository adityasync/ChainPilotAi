import { useEffect, useState } from 'react';
import { Search, Plus, X, ShoppingCart, Package, MapPin, Trash2, Edit3, Upload } from 'lucide-react';
import { orderAPI, inventoryAPI } from '../services/apiService';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';

interface Order {
  id: number;
  product_id: number;
  product_name?: string;
  order_date: string;
  quantity: number;
  region: string | null;
}

interface ProductOption {
  id: number;
  product_name: string;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  const pagination = usePagination<Order>({ initialPageSize: 15 });
  const { currentPage, goToPage, setTotalItems, paginateData, totalPages } = pagination;

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderAPI.getOrders({ page_size: 500 });
      setOrders(response.data?.data || []);
    } catch {
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryAPI.getProducts({ page_size: 1000 });
      setProducts((response.data?.data || []).map((p: any) => ({ id: p.id, product_name: p.product_name })));
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = searchTerm
      ? orders.filter(
          (o) =>
            (o.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.region || '').toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : orders;
    setFilteredOrders(filtered);
    setTotalItems(filtered.length);
    goToPage(1);
  }, [searchTerm, orders, setTotalItems, goToPage]);

  const handleDelete = async (orderId: number) => {
    if (!confirm('Delete this order?')) return;
    try {
      await orderAPI.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      setError('Failed to delete order.');
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Orders</h1>
          <p className="text-sm sm:text-lg text-[#86868b] dark:text-[#98989d] mt-1">{orders.length} orders total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-gray-200 transition-all"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0071e3] text-white rounded-lg text-sm font-medium hover:bg-[#0077ED] transition-all"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] dark:text-[#98989d]" />
        <input
          type="text"
          placeholder="Search by product or region..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-6 h-6 text-[#86868b] dark:text-[#98989d]" />
            </div>
            <p className="text-lg text-[#86868b] dark:text-[#98989d]">No orders yet.</p>
            <p className="text-sm text-[#86868b] dark:text-[#98989d] mt-1">Click "New Order" to create one.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#38383a]">
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Order ID</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Product</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Quantity</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Region</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateData(filteredOrders).map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 dark:border-[#2c2c2e] hover:bg-[#fafafa] dark:hover:bg-[#2c2c2e]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#1d1d1f] dark:text-white">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#86868b] dark:text-[#98989d]" />
                          <span className="text-sm text-[#1d1d1f] dark:text-white">{order.product_name || `Product #${order.product_id}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#86868b] dark:text-[#98989d]">{order.order_date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#1d1d1f] dark:text-white">{order.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {order.region ? (
                          <span className="inline-flex items-center gap-1 text-sm text-[#86868b] dark:text-[#98989d]">
                            <MapPin className="w-3.5 h-3.5" />
                            {order.region}
                          </span>
                        ) : (
                          <span className="text-sm text-[#aeaeb2]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(order)}
                            className="p-2 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-2 rounded-lg text-[#86868b] dark:text-[#98989d] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-[#38383a]">
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          </>
        )}
      </div>

      {/* New Order Modal */}
      {showForm && (
        <NewOrderForm
          products={products}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchOrders();
          }}
        />
      )}

      {/* Edit Order Modal */}
      {showEditForm && editingOrder && (
        <EditOrderForm
          order={editingOrder}
          products={products}
          onClose={() => { setShowEditForm(false); setEditingOrder(null); }}
          onUpdated={() => {
            setShowEditForm(false);
            setEditingOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          products={products}
          onClose={() => setShowBulkImport(false)}
          onCreated={() => {
            setShowBulkImport(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

/* ─── New Order Form Modal ─── */

const NewOrderForm = ({
  products,
  onClose,
  onCreated,
}: {
  products: ProductOption[];
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [region, setRegion] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { setError('Select a product.'); return; }
    if (Number(quantity) <= 0) { setError('Quantity must be at least 1.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await orderAPI.createOrder({
        product_id: Number(productId),
        quantity: Number(quantity),
        region: region || null,
        order_date: orderDate,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">New Order</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Region (optional)</label>
            <input
              type="text"
              placeholder="e.g. North America, Europe"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
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
              'Create Order'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Edit Order Form Modal ─── */

const EditOrderForm = ({
  order,
  products,
  onClose,
  onUpdated,
}: {
  order: Order;
  products: ProductOption[];
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const [productId, setProductId] = useState(String(order.product_id));
  const [quantity, setQuantity] = useState(String(order.quantity));
  const [region, setRegion] = useState(order.region || '');
  const [orderDate, setOrderDate] = useState(order.order_date);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { setError('Select a product.'); return; }
    if (Number(quantity) <= 0) { setError('Quantity must be at least 1.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await orderAPI.updateOrder(order.id, {
        product_id: Number(productId),
        quantity: Number(quantity),
        region: region || null,
        order_date: orderDate,
      });
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">Edit Order #{order.id}</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.product_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Quantity</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Date</label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">Region (optional)</label>
            <input type="text" placeholder="e.g. North America" value={region} onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {submitting ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>) : 'Update Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Bulk Import Modal ─── */

const BulkImportModal = ({
  products,
  onClose,
  onCreated,
}: {
  products: ProductOption[];
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [csvText, setCsvText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      // Parse CSV: product_id,quantity,region,date
      const lines = csvText.trim().split('\n').filter(l => l.trim());
      const orders = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          product_id: Number(parts[0]),
          quantity: Number(parts[1]),
          region: parts[2] || null,
          order_date: parts[3] || new Date().toISOString().split('T')[0],
        };
      });

      if (orders.length === 0) {
        setError('No orders to import.');
        return;
      }

      const res = await orderAPI.bulkCreateOrders(orders);
      setResult(res.data);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to import orders.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">Bulk Import Orders</h2>
          <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}
        {result && <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-sm text-emerald-600 dark:text-emerald-400">Successfully imported {result.created} orders.</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-1.5">
              CSV Data <span className="text-xs font-normal">(product_id, quantity, region, date)</span>
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"1, 50, North America, 2026-01-15\n2, 30, Europe, 2026-01-16\n3, 25, Asia, 2026-01-17"}
              rows={8}
              className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] border-none focus:ring-2 focus:ring-[#0071e3] transition-all font-mono text-sm"
            />
          </div>
          <div className="bg-gray-50 dark:bg-[#2c2c2e] rounded-lg p-3">
            <p className="text-xs text-[#86868b] dark:text-[#98989d]">
              <strong>Format:</strong> One order per line. Fields: product_id, quantity, region (optional), date (optional, defaults to today).
              <br />
              <strong>Available product IDs:</strong> {products.map(p => p.id).join(', ')}
            </p>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 mt-2 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ED] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {submitting ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importing...</>) : 'Import Orders'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrdersPage;
