import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';
import {
  DashboardIcon, ProductsIcon, CategoriesIcon, POSIcon, SalesIcon,
  ReportsIcon, UsersIcon, SuppliersIcon, PurchasingIcon,
  CollapseIcon, ExpandIcon, LogoutIcon, PaletteIcon,
} from '../ui/Icons';
import { ColorPicker } from '../ui/ColorPicker';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/products', label: 'Products', icon: ProductsIcon },
  { path: '/categories', label: 'Categories', icon: CategoriesIcon },
  { path: '/sales/new', label: 'POS', icon: POSIcon },
  { path: '/sales', label: 'Sales', icon: SalesIcon },
  { path: '/reports', label: 'Reports', icon: ReportsIcon },
  { path: '/users', label: 'Users', icon: UsersIcon },
  { path: '/suppliers', label: 'Suppliers', icon: SuppliersIcon },
  { path: '/purchase-orders', label: 'Purchasing', icon: PurchasingIcon },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        className="flex flex-col bg-white border-r border-gray-200 overflow-hidden"
      >
        <div className="flex items-center gap-2 h-14 px-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3))' }}>
            <div className="flex items-center justify-center text-white font-bold text-sm h-full w-full">
              A
            </div>
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-2), var(--color-g-3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              AXCP
            </motion.span>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200 cursor-pointer ${
                  active
                    ? 'font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={active ? { backgroundColor: 'color-mix(in srgb, var(--color-g-1) 10%, transparent)', color: 'var(--color-g-1)' } : {}}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          {sidebarOpen && user && (
            <div className="mb-2 px-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          )}
          <button
            onClick={() => setShowColorPicker(true)}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            <PaletteIcon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Theme</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            {sidebarOpen ? <CollapseIcon className="w-5 h-5 shrink-0" /> : <ExpandIcon className="w-5 h-5 shrink-0" />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer mt-1"
          >
            <LogoutIcon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="p-6"
        >
          <Outlet />
        </motion.div>
      </main>

      {showColorPicker && <ColorPicker onClose={() => setShowColorPicker(false)} />}
    </div>
  );
}
