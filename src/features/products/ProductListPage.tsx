import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import type { Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { StockIndicator, StockBadge } from '../../components/ui/StockIndicator';

export function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: { search, page, limit: 20 },
      });
      setProducts(data.data);
      setTotalPages(data.pagination.totalPages);
      
      // Calculate low stock count
      const lowStock = data.data.filter((p: Product) => {
        if (p.variants && p.variants.length > 0) {
          return p.variants.some(v => v.stock <= 10);
        }
        return p.stock <= 10;
      }).length;
      setLowStockCount(lowStock);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-500 text-sm">
              {products.length} products
            </p>
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">
                  {lowStockCount} low stock
                </span>
              </div>
            )}
          </div>
        </div>
        <Button onClick={() => navigate('/products/new')}>+ Add Product</Button>
      </div>

      <input
        type="text"
        placeholder="Search by name, SKU, or barcode..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-g-1) 5%, transparent), transparent)' }}>
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock = p.variants && p.variants.length > 0 
                  ? p.variants.reduce((s, v) => s + v.stock, 0)
                  : p.stock;
                
                const hasLowStock = p.variants && p.variants.length > 0
                  ? p.variants.some(v => v.stock <= 10)
                  : p.stock <= 10;
                
                const isOutOfStock = totalStock === 0;
                
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`
                      hover:bg-gray-50 cursor-pointer transition-colors
                      ${isOutOfStock ? 'bg-red-50' : hasLowStock ? 'bg-amber-50' : ''}
                    `}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{p.name}</span>
                        {(hasLowStock || isOutOfStock) && (
                          <AlertTriangle 
                            size={14} 
                            className={isOutOfStock ? 'text-red-500' : 'text-amber-500'} 
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      Rp {p.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.variants && p.variants.length > 0 ? (
                          <div className="text-right">
                            <div className="font-medium">{totalStock} total</div>
                            <div className="text-xs text-gray-500">
                              {p.variants.length} variants
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium">{p.stock}</span>
                        )}
                        <StockIndicator 
                          stock={totalStock} 
                          size="sm" 
                          showLabel={false}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Deactivate
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors duration-200 ${
                page === i + 1
                  ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={page === i + 1 ? { background: 'var(--color-g-1)' } : {}}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
