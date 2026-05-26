import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import type { Product, Supplier } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/format';

interface POItem {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitCost: number;
  total: number;
  received: number;
  product: { name: string; sku: string };
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: { name: string };
  user: { name: string };
  status: string;
  total: number;
  notes: string | null;
  createdAt: string;
  items: POItem[];
}

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [poForm, setPoForm] = useState({ supplierId: '', notes: '' });
  const [poItems, setPoItems] = useState<{ productId: string; quantity: string; unitCost: string }[]>([]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/purchase-orders', { params: { page, limit: 20 } });
      setOrders(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch POs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  const openCreate = async () => {
    setError('');
    setPoForm({ supplierId: '', notes: '' });
    setPoItems([{ productId: '', quantity: '1', unitCost: '' }]);
    setShowForm(true);
    try {
      const [sRes, pRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products', { params: { limit: 100 } }),
      ]);
      setSuppliers(sRes.data.data);
      setProducts(pRes.data.data);
    } catch {}
  };

  const addItem = () => setPoItems([...poItems, { productId: '', quantity: '1', unitCost: '' }]);
  const updateItem = (i: number, field: string, value: string) => {
    setPoItems(poItems.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };
  const removeItem = (i: number) => setPoItems(poItems.filter((_, idx) => idx !== i));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId) { setError('Select a supplier'); return; }
    setSaving(true);
    setError('');

    try {
      await api.post('/purchase-orders', {
        supplierId: Number(poForm.supplierId),
        notes: poForm.notes || null,
        items: poItems.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      });
      setShowForm(false);
      setPage(1);
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create PO');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async (id: number) => {
    if (!confirm('Receive all items from this purchase order?')) return;
    try {
      await api.post(`/purchase-orders/${id}/receive`);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Receive failed');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SENT: 'bg-blue-100 text-blue-700',
      PARTIAL: 'bg-yellow-100 text-yellow-700',
      RECEIVED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? ''}`}>{status}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Button onClick={openCreate}>+ New PO</Button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Add Item</Button>
            </div>
            {poItems.map((item, i) => (
              <div key={i} className="flex gap-3 items-start mb-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <input type="number" placeholder="Qty" value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="w-32">
                  <input type="number" placeholder="Unit cost" value={item.unitCost}
                    onChange={(e) => updateItem(i, 'unitCost', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <button type="button" onClick={() => removeItem(i)} className="mt-2 text-red-500 hover:text-red-700 text-sm">✕</button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create PO</Button>
          </div>
        </motion.form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-g-1) 5%, transparent), transparent)' }}>
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PO #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">By</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No purchase orders</td></tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{po.poNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{po.supplier.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(po.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{po.user.name}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(po.status)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(po.total)}</td>
                  <td className="px-4 py-3 text-right">
                    {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                      <button onClick={() => handleReceive(po.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">
                        Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 cursor-pointer">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 cursor-pointer">Next</button>
        </div>
      )}
    </motion.div>
  );
}
