import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/format';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

type Tab = 'revenue' | 'products' | 'inventory' | 'low-stock';

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('revenue');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const [dailySales, setDailySales] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const range = { dateFrom, dateTo };

    Promise.all([
      api.get('/reports/daily-sales', { params: range }).then((r) => setDailySales(r.data.data)),
      api.get('/reports/top-products', { params: { ...range, limit: 20 } }).then((r) => setTopProducts(r.data.data)),
      api.get('/reports/inventory').then((r) => setInventory(r.data.data)),
      api.get('/reports/low-stock', { params: { threshold: 5 } }).then((r) => setLowStock(r.data.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'products', label: 'Top Products' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'low-stock', label: 'Low Stock' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          {tab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 10%, transparent)' }}>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(dailySales?.revenue ?? 0)}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-2) 10%, transparent)' }}>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-xl font-bold text-gray-900">{dailySales?.transactionCount ?? 0}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-3) 10%, transparent)' }}>
                  <p className="text-sm text-gray-500">Avg Order</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(dailySales?.averageOrderValue ?? 0)}</p>
                </div>
              </div>
              {dailySales?.daily?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySales.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
<Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Bar dataKey="total" fill="var(--color-g-1, #2563eb)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">No data for this period</p>
              )}
            </div>
          )}

          {tab === 'products' && (
            <div>
              {topProducts.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">#</th>
                      <th className="text-left py-3 font-medium text-gray-600">Product</th>
                      <th className="text-right py-3 font-medium text-gray-600">SKU</th>
                      <th className="text-right py-3 font-medium text-gray-600">Sold</th>
                      <th className="text-right py-3 font-medium text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 text-gray-500">{i + 1}</td>
                        <td className="py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="py-3 text-right text-gray-500 font-mono text-xs">{p.sku}</td>
                        <td className="py-3 text-right font-medium">{p.quantity}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">No data for this period</p>
              )}
            </div>
          )}

          {tab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 10%, transparent)' }}>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-xl font-bold text-gray-900">{inventory?.totalItems ?? 0}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-2) 10%, transparent)' }}>
                  <p className="text-sm text-gray-500">Total Stock</p>
                  <p className="text-xl font-bold text-gray-900">{inventory?.totalStock ?? 0}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-3) 10%, transparent)' }}>
                  <p className="text-sm text-gray-500">Inventory Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(inventory?.totalValue ?? 0)}</p>
                </div>
              </div>
              {inventory?.categoryBreakdown && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">By Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(inventory.categoryBreakdown).map(([name, data]: any) => ({
                          name, value: data.value,
                        }))}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {Object.entries(inventory.categoryBreakdown).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {tab === 'low-stock' && (
            <div>
              {lowStock.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">Product</th>
                      <th className="text-left py-3 font-medium text-gray-600">Variant</th>
                      <th className="text-left py-3 font-medium text-gray-600">Category</th>
                      <th className="text-right py-3 font-medium text-gray-600">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lowStock.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="py-3 text-gray-500">{item.variantValue}</td>
                        <td className="py-3 text-gray-500">{item.category}</td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${item.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {item.currentStock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">All products are well-stocked</p>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
