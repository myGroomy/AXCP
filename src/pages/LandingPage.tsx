import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DashboardIcon, ProductsIcon, POSIcon, SalesIcon,
  ReportsIcon, UsersIcon, CheckIcon, GridIcon,
} from '../components/ui/Icons';

const features = [
  { icon: POSIcon, title: 'Point of Sale', desc: 'Fast checkout with product search, variant selection, and multiple payment methods.' },
  { icon: DashboardIcon, title: 'Dashboard', desc: 'Real-time sales metrics, revenue trends, and performance indicators at a glance.' },
  { icon: ProductsIcon, title: 'Inventory', desc: 'Manage products, variants, stock levels, and categories with ease.' },
  { icon: SalesIcon, title: 'Sales History', desc: 'Track every transaction, process returns, and analyze sales patterns.' },
  { icon: ReportsIcon, title: 'Reports', desc: 'Deep insights with revenue analysis, top products, and inventory valuation.' },
  { icon: UsersIcon, title: 'Team Management', desc: 'Role-based access control with Admin, Manager, and Cashier roles.' },
];

const steps = [
  { num: '01', title: 'Set Up', desc: 'Configure your products, categories, suppliers, and team in minutes.' },
  { num: '02', title: 'Start Selling', desc: 'Ring up sales with the POS — search products, adjust quantities, take payments.' },
  { num: '03', title: 'Grow Smarter', desc: 'Use reports and dashboards to track performance and optimize your business.' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3))' }}>
              A
            </div>
            <span className="font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-2), var(--color-g-3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AXCP
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm text-white rounded-lg font-medium transition-all hover:shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3))' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-4" style={{ background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Point of Sale,{' '}
                <span
                  style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-2), var(--color-g-3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  Simplified
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
                A modern POS system for F&B, retail, fashion, and hardware businesses.
                Fast checkout, inventory management, and insightful reports.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 text-white rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3))' }}
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Live Demo
                </button>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-green-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-green-500" /> Free updates</span>
                <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-green-500" /> Offline mode</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                From ringing up sales to managing inventory, AXCP covers the essentials.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-transparent transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-g-1) 10%, transparent)', color: 'var(--color-g-1)' }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Get up and running in three simple steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {steps.map((step) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3))' }}>
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to simplify your sales?</h2>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                Join businesses using AXCP to manage sales, inventory, and customers in one place.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 text-white rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, var(--color-g-1), var(--color-g-3))' }}
              >
                Get Started Free
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <span>&copy; {new Date().getFullYear()} AXCP. All rights reserved.</span>
          <div className="flex items-center gap-1">
            <GridIcon className="w-4 h-4" />
            <span>Powered by AXCP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
