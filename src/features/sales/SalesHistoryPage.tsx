import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import type { Sale } from '../../types';

export function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returning, setReturning] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { data } = await api.get('/sales', { params });
      setSales(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch sales', err);
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleReturn = async () => {
    if (!selectedSale || !confirm('Process return for this sale?')) return;
    setReturning(true);
    try {
      await api.post(`/sales/${selectedSale.id}/return`);
      setSelectedSale(null);
      fetchSales();
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Return failed');
    } finally {
      setReturning(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700',
      REFUNDED: 'bg-yellow-100 text-yellow-700',
      VOID: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
      </div>

      <div className="flex gap-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-g-1) 5%, transparent), transparent)' }}>
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cashier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No sales found</td></tr>
            ) : (
              sales.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedSale(s)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(s.createdAt).toLocaleDateString()}{' '}
                    <span className="text-gray-400 text-xs">
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{s.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    Rp {s.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {s.status === 'COMPLETED' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedSale(s); }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Return
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
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 cursor-pointer"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {selectedSale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedSale(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start p-4 -m-6 mb-4 rounded-t-2xl"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-g-1) 8%, transparent), transparent)' }}>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Sale {selectedSale.invoiceNo}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </p>
              </div>
              {statusBadge(selectedSale.status)}
            </div>

            <div className="space-y-2 border-t pt-3">
              {selectedSale.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product?.name} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    Rp {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>Rp {selectedSale.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span>-Rp {selectedSale.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>Rp {selectedSale.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
              {selectedSale.status === 'COMPLETED' && (
                <Button
                  className="flex-1"
                  loading={returning}
                  onClick={handleReturn}
                >
                  Process Return
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
