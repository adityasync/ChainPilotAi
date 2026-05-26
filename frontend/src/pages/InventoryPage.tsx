import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { inventoryAPI } from '../services/apiService';

interface Product {
  id: number;
  product_name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  max_stock: number;
  unit_cost: number;
  selling_price: number;
  warehouse: string;
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await inventoryAPI.getProducts({ limit: 1000 });
        const data = response.data.map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          category: item.category || 'Uncategorized',
          current_stock: item.inventory_items?.[0]?.current_stock || 0,
          reorder_point: item.inventory_items?.[0]?.reorder_point || 0,
          max_stock: item.inventory_items?.[0]?.max_stock || 0,
          unit_cost: item.unit_cost,
          selling_price: item.selling_price,
          warehouse: item.inventory_items?.[0]?.warehouse || 'Default',
        }));
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const getStatus = (product: Product) => {
    if (product.current_stock <= product.reorder_point * 0.5) {
      return { text: 'Critical', color: 'text-[#ff3b30]' };
    }
    if (product.current_stock <= product.reorder_point) {
      return { text: 'Low', color: 'text-[#ff9f0a]' };
    }
    if (product.current_stock >= product.max_stock * 0.9) {
      return { text: 'Overstock', color: 'text-[#ff9f0a]' };
    }
    return { text: 'Healthy', color: 'text-[#34c759]' };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            Inventory
          </h1>
          <p className="text-xl text-[#86868b]">
            {products.length} products across {new Set(products.map(p => p.warehouse)).size} warehouses
          </p>
        </div>

        <button className="
          inline-flex items-center gap-2 px-6 py-3
          bg-[#1d1d1f] text-white rounded-full
          text-sm font-medium
          hover:bg-black transition-all duration-200
        ">
          <Plus className="w-4 h-4" />
          Add product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            w-full pl-12 pr-4 py-4 text-lg
            bg-white border border-gray-200 rounded-xl
            text-[#1d1d1f] placeholder-[#aeaeb2]
            focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10
            transition-all duration-200
          "
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-6 text-sm font-medium text-[#86868b]">Product</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#86868b] hidden md:table-cell">Category</th>
              <th className="text-right py-4 px-6 text-sm font-medium text-[#86868b]">Stock</th>
              <th className="text-right py-4 px-6 text-sm font-medium text-[#86868b] hidden lg:table-cell">Price</th>
              <th className="text-right py-4 px-6 text-sm font-medium text-[#86868b]">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const status = getStatus(product);
              return (
                <tr
                  key={product.id}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="py-5 px-6">
                    <p className="font-medium text-[#1d1d1f]">{product.product_name}</p>
                    <p className="text-sm text-[#86868b] md:hidden">{product.category}</p>
                  </td>
                  <td className="py-5 px-6 text-[#86868b] hidden md:table-cell">
                    {product.category}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className="font-medium text-[#1d1d1f]">{product.current_stock}</span>
                    <span className="text-[#86868b]"> / {product.max_stock}</span>
                  </td>
                  <td className="py-5 px-6 text-right text-[#1d1d1f] hidden lg:table-cell">
                    ${product.selling_price.toFixed(2)}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className={`font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-xl text-[#86868b]">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;