import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/format';
import { WarningIcon } from '../../components/ui/Icons';
import { LowStockAlerts, CompactLowStockAlerts } from '../../components/shared/LowStockAlerts';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [dailySales, setDailySales] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  const getDateRange = () => {
    const now = new Date();
    if (period === 'today') {
      return {
        dateFrom: now.toISOString().slice(0, 10),
        dateTo: now.toISOString().slice(0, 10),
      };
    }
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { dateFrom: weekAgo.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) };
    }
    if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { dateFrom: monthAgo.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) };
    }
    return {};
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const range = getDateRange();
      try {
        const [salesRes, topRes, invRes, lowRes] = await Promise.all([
          api.get('/reports/daily-sales', { params: range }),
          api.get('/reports/top-products', { params: { ...range, limit: 5 } }),
          api.get('/reports/inventory'),
          api.get('/reports/low-stock', { params: { threshold: 5 } }),
        ]);
        setDailySales(salesRes.data.data);
        setTopProducts(topRes.data.data);
        setInventory(invRes.data.data);
        setLowStock(lowRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 15%, transparent)' }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 8%, transparent)' }} />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 8%, transparent)' }} />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name ?? 'User'}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['today', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Revenue" value={formatCurrency(dailySales?.revenue ?? 0)} subtitle={`${dailySales?.transactionCount ?? 0} transactions`} accent />
        <SummaryCard title="Avg Order" value={formatCurrency(dailySales?.averageOrderValue ?? 0)} subtitle="Per transaction" />
        <SummaryCard title="Products" value={String(inventory?.totalItems ?? 0)} subtitle={`${inventory?.totalStock ?? 0} total stock`} />
        <SummaryCard title="Low Stock" value={String(lowStock.length)} subtitle="Items to reorder" accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h2>
          {dailySales?.daily?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySales.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                <Bar dataKey="total" fill="var(--color-g-1, #2563eb)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">No sales data for this period</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 15%, transparent)', color: 'var(--color-g-1)' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.quantity} sold</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
            )}
          </div>

          {/* Compact Low Stock Alerts */}
          <CompactLowStockAlerts threshold={10} maxItems={5} />
        </div>
      </div>

      {/* Full Low Stock Alerts Section */}
      <LowStockAlerts threshold={10} />
    </motion.div>
  );
}

function SummaryCard({ title, value, subtitle, accent }: { title: string; value: string; subtitle: string; accent?: boolean | string }) {
  const borderAccent = accent === 'warning'
    ? 'border-l-yellow-400'
    : accent
      ? 'border-l-transparent' : 'border-gray-200';
  return (
    <motion.div
      variants={item}
      className={`bg-white rounded-xl p-6 border hover:shadow-md transition-all duration-200 cursor-pointer ${borderAccent}`}
      style={accent && accent !== 'warning' ? { borderLeftColor: 'var(--color-g-1)', borderLeftWidth: 3 } : {}}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </motion.div>
  );
}
